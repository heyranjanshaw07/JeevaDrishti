# qwen_local.py
"""
Local Qwen2.5-VL runner that mimics the API class interface.

Inputs:
  inputs = {
    "prompt": <str>,
    "image": <base64 jpeg str>
  }
  example_pairs = {
    "<label>": [<base64 jpeg str>, ...],
    ...
  }

Returns:
  str  (model's decoded text)

Install deps:
  pip install torch transformers pillow safetensors accelerate
"""

from __future__ import annotations
from io import BytesIO
from typing import Dict, List
import base64
import torch
from PIL import Image
from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor, AutoTokenizer
from qwen_vl_utils import process_vision_info  # available in your env

def _b64_to_pil(b64_str: str) -> Image.Image:
    img_bytes = base64.b64decode(b64_str)
    return Image.open(BytesIO(img_bytes)).convert("RGB")

class QwenLocalAPI:
    """
    Drop-in replacement for API clients (e.g., GPTAPI) but runs locally.

    Example:
      api = QwenLocalAPI(model="Qwen/Qwen2.5-VL-7B-Instruct")
      text = api.get_shape_information(inputs, example_pairs)
    """

    # cache one model per model_id across instances
    _CACHE: Dict[str, Dict[str, object]] = {}

    def __init__(
        self,
        model: str = "Qwen/Qwen2.5-VL-7B-Instruct",
        *,
        device: str | None = None,
        torch_dtype: str | torch.dtype = "auto",
        max_new_tokens: int = 128,
        temperature: float = 1.0,
        top_p: float = 1.0,
    ):
        self.model_id = model
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.torch_dtype = torch_dtype
        self.max_new_tokens = max_new_tokens
        self.temperature = temperature
        self.top_p = top_p

        if model not in QwenLocalAPI._CACHE:
            # Load once; reuse across instances
            if self.device == "cuda":
                model_obj = Qwen2_5_VLForConditionalGeneration.from_pretrained(
                    self.model_id,
                    torch_dtype=self.torch_dtype,
                    device_map="auto",
                )
            else:
                model_obj = Qwen2_5_VLForConditionalGeneration.from_pretrained(
                    self.model_id,
                    torch_dtype=self.torch_dtype,
                ).to(self.device)

            processor = AutoProcessor.from_pretrained(self.model_id)
            tokenizer = AutoTokenizer.from_pretrained(self.model_id)

            QwenLocalAPI._CACHE[self.model_id] = {
                "model": model_obj,
                "processor": processor,
                "tokenizer": tokenizer,
                "device": self.device,
            }

        cache = QwenLocalAPI._CACHE[self.model_id]
        self.model = cache["model"]
        self.processor = cache["processor"]
        self.tokenizer = cache["tokenizer"]

    # -- public API ---------------------------------------------------------
    def get_shape_information(self, inputs: dict, example_pairs: Dict[str, List[str]]) -> str | None:
        """
        Build one multi-modal chat turn like the API path:
          [prompt] + [few-shot image/label pairs] + [prompt] + [target image]
        """
        try:
            user_prompt = inputs["prompt"]
            target_img = _b64_to_pil(inputs["image"])
        except Exception as e:
            print(f"[QwenLocalAPI] Invalid inputs: {e}")
            return None

        # build few-shot content identical to your API packing
        few_shots = []
        for label, crops in (example_pairs or {}).items():
            for crop_b64 in crops:
                try:
                    crop_img = _b64_to_pil(crop_b64)
                except Exception as e:
                    print(f"[QwenLocalAPI] Skipping bad example image: {e}")
                    continue
                few_shots.append({"type": "image", "image": crop_img})
                few_shots.append({"type": "text", "text": '{"Intended classification output: "}'})
                few_shots.append({"type": "text", "text": f"{label}"})

        # messages match the structure used in your GPT API payload
        messages = [{
            "role": "user",
            "content": [
                {"type": "text", "text": user_prompt},
                *few_shots,
                {"type": "text", "text": user_prompt},
                {"type": "image", "image": target_img},
            ],
        }]

        # chat template → tensors
        try:
            text = self.processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            image_inputs, video_inputs = process_vision_info(messages)
            model_inputs = self.processor(
                text=[text],
                images=image_inputs,
                videos=video_inputs,
                padding=True,
                return_tensors="pt",
            )

            for k, v in model_inputs.items():
                if hasattr(v, "to"):
                    model_inputs[k] = v.to(self.device)

            # generation (sample to mirror temp=1.0 behavior in your API script)
            gen_ids = self.model.generate(
                **model_inputs,
                max_new_tokens=self.max_new_tokens,
                do_sample=True if self.temperature and self.temperature > 0 else False,
                temperature=self.temperature,
                top_p=self.top_p,
            )

            # decode only the continuation (skip the prompt tokens)
            if "input_ids" in model_inputs:
                new_tokens = gen_ids[0, model_inputs["input_ids"].shape[1]:]
            else:
                new_tokens = gen_ids[0]

            out_text = self.tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
            return out_text or None

        except RuntimeError as oom:
            print(f"[QwenLocalAPI] Generation failed (likely OOM): {oom}")
            return None
        except Exception as e:
            print(f"[QwenLocalAPI] Generation error: {e}")
            return None
