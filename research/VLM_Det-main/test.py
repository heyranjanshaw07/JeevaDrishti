#!/usr/bin/env python3
"""
Minimal Qwen2.5-VL inference script.

Replicates the interactive session:
- Loads Qwen/Qwen2.5-VL-7B-Instruct
- Builds a chat with an image URL and a text prompt
- Generates a response and prints it

Usage:
  python qwen2_5_vl_infer.py \
    --image https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen-VL/assets/demo.jpeg \
    --text "Describe this image."

Optional:
  --model Qwen/Qwen2.5-VL-7B-Instruct
  --max-new-tokens 128
"""

import argparse
import torch
from transformers import Qwen2_5_VLForConditionalGeneration, AutoTokenizer, AutoProcessor
from qwen_vl_utils import process_vision_info  # make sure this is importable

DEFAULT_MODEL = "Qwen/Qwen2.5-VL-7B-Instruct"
DEFAULT_IMAGE = "https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen-VL/assets/demo.jpeg"
DEFAULT_TEXT = "Describe this image."

def build_messages(image_url: str, text: str):
    return [{
        "role": "user",
        "content": [
            {"type": "image", "image": image_url},
            {"type": "text", "text": text},
        ],
    }]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default=DEFAULT_MODEL, help="HF model hub ID or local path")
    parser.add_argument("--image", default=DEFAULT_IMAGE, help="Image URL/path to describe")
    parser.add_argument("--text", default=DEFAULT_TEXT, help="User text to send with the image")
    parser.add_argument("--max-new-tokens", type=int, default=12000)
    args = parser.parse_args()

    device = "cuda" if torch.cuda.is_available() else "cpu"

    # 1) Load model & processor/tokenizer
    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        args.model,
        torch_dtype="auto",
        device_map="auto" if device == "cuda" else None,  # put on GPU if available
    )
    processor = AutoProcessor.from_pretrained(args.model)
    tokenizer = AutoTokenizer.from_pretrained(args.model)

    # 2) Build chat-style messages
    messages = build_messages(args.image, args.text)

    # 3) Create prompt text from chat template
    text_prompt = processor.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )

    # 4) Process vision inputs (images/videos)
    image_inputs, video_inputs = process_vision_info(messages)

    # 5) Tokenize/prepare batch
    inputs = processor(
        text=[text_prompt],
        images=image_inputs,
        videos=video_inputs,
        padding=True,
        return_tensors="pt",
    )
    inputs = {k: v.to(device) if hasattr(v, "to") else v for k, v in inputs.items()}

    # 6) Generate
    generated_ids = model.generate(**inputs, max_new_tokens=args.max_new_tokens)

    # 7) Decode only the newly generated tokens
    #    (skip the original prompt/input tokens for a clean answer)
    if "input_ids" in inputs:
        new_tokens = generated_ids[0, inputs["input_ids"].shape[1]:]
    else:
        # Fallback: decode whole sequence
        new_tokens = generated_ids[0]

    output_text = tokenizer.decode(new_tokens, skip_special_tokens=True)
    print(output_text.strip())

if __name__ == "__main__":
    main()
