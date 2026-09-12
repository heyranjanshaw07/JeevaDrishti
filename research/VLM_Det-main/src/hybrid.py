import os
from pathlib import Path
from typing import List, Sequence, Tuple
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import base64
from read_keys import read_keys
import config.hybrid as hybrid_cfg
from api import GPTAPI, GeminiAPI, TogetherAPI, AnthropicAPI, QwenLocalAPI
from segment_anything import sam_model_registry, SamAutomaticMaskGenerator


class RPN:
    """
    Region-Proposal-Network wrapper that can **either**
    1.  *load* pre-computed SAM detections from disk (`preload_dir`) or
    2.  run SAM on-the-fly (fallback / legacy mode).

    The class keeps *one* SAM model in memory per `(model_type, checkpoint)`
    tuple across all instances, so even the fallback path is GPU-efficient.

    Parameters
    ----------
    preload_dir : Path | None
        Directory that contains `.npz` files produced by `precompute_sam.py`.
        If `None`, the RPN calls SAM live.
    top_n, padding, min_area, max_area : int | None
        Same semantics as before – applied **after** cache load.
    sam_checkpoint, sam_model_type : str
        Passed through to SAM if `preload_dir` is `None` **or** the `.npz`
        file for an image is missing (rare).
    device : "cuda" | "cpu"
        Where to place the SAM model for live inference.
    """

    # --------------------------------------------------------------------- #
    #                     ----------  INITIALISATION ----------              #
    # --------------------------------------------------------------------- #
    _SAM_GEN: dict[Tuple[str, str], SamAutomaticMaskGenerator] = {}

    def __init__(
        self,
        *,
        preload_dir: Path | None = None,
        top_n: int | None = None,
        padding: int | None = None,
        min_area: int | None = None,
        max_area: int | None = None,
        sam_checkpoint: str | None = None,
        sam_model_type: str | None = None,
        device: str = "cuda",
    ):
        cfg = hybrid_cfg.config
        self.preload_dir = Path(preload_dir) if preload_dir else None

        # runtime filters ----------------------------------------------------
        self.max_box = top_n if top_n is not None else cfg.max_box
        self.padding = padding if padding is not None else cfg.padding
        self.min_area = min_area
        self.max_area = max_area

        # SAM (model used *only* if cache miss) -----------------------------
        self.sam_checkpoint = sam_checkpoint or cfg.sam_checkpoint
        self.sam_model_type = sam_model_type or cfg.sam_model_type
        
        self.device = device

        if self.preload_dir is None:
            # live mode → make sure a generator is ready
            self._init_live_sam()

        print(
            f"[RPN] Ready  | cache: "
            f"{self.preload_dir if self.preload_dir else 'disabled'}  |  "
            f"top_n={self.max_box}, pad={self.padding}, "
            f"min_area={self.min_area}, max_area={self.max_area}"
        )

    # --------------------------------------------------------------------- #
    #                        ----------  INTERNALS ----------                #
    # --------------------------------------------------------------------- #
    def _init_live_sam(self) -> None:
        key = (self.sam_model_type, self.sam_checkpoint)
        if key not in RPN._SAM_GEN:
            print(f"[RPN] Loading SAM {key} → {self.device}")
            model = sam_model_registry[self.sam_model_type](
                checkpoint=self.sam_checkpoint
            ).to(self.device)
            model.eval()
            RPN._SAM_GEN[key] = SamAutomaticMaskGenerator(model)
        self._sam_gen = RPN._SAM_GEN[key]

    # ..................................................................... #
    def _load_cached(self, rel_path: str) -> Tuple[np.ndarray, np.ndarray] | None:
        """
        Returns
        -------
        (boxes, iou)  or  None   – both already sorted desc by IOU
        """
        if not self.preload_dir:
            return None
        npz_path = (self.preload_dir / rel_path).with_suffix(".npz")
        if not npz_path.exists():
            return None
        z = np.load(npz_path)
        return z["boxes"], z["iou"]

    # ..................................................................... #
    def _propose_sam_full(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Fall-back path: run SAM and return **un-padded** boxes + IOU,
        already sorted descending by IOU.
        """
        masks = self._sam_gen.generate(image)
        boxes = np.array([m["bbox"] for m in masks], np.int32)            # x,y,w,h
        boxes[:, 2:] += boxes[:, :2]                                      # → x1,y1,x2,y2
        iou = np.array([m["predicted_iou"] for m in masks], np.float32)
        order = np.argsort(iou)[::-1]
        return boxes[order], iou[order]

    # --------------------------------------------------------------------- #
    #                       ----------  PUBLIC API ----------                #
    # --------------------------------------------------------------------- #
    def propose(
        self, image: np.ndarray, *, img_rel_path: str
    ) -> List[Sequence[int]]:
        """
        Parameters
        ----------
        image : H×W×3  BGR numpy array (cv2.imread output)
        img_rel_path : str
            Path relative to the dataset root, e.g.
            `"reference/BCCD/images/BloodImage_00002.jpg"`.
            It is used as the lookup key inside `preload_dir`.

        Returns
        -------
        list[[x1, y1, x2, y2]]  – filtered & padded proposals, at most `top_n`
        """

        # 1) try cache ------------------------------------------------------
        cached = self._load_cached(img_rel_path)
        if cached:
            boxes, _iou = cached
        else:
            # 2) fallback: run SAM live -------------------------------------
            boxes, _iou = self._propose_sam_full(image)

        # 3) runtime filters + padding --------------------------------------
        H, W = image.shape[:2]
        out: list[list[int]] = []
        for b in boxes:
            x1, y1, x2, y2 = map(int, b)
            area = (x2 - x1) * (y2 - y1)
            if self.min_area and area < self.min_area:
                continue
            if self.max_area and area > self.max_area:
                continue
            if len(out) == self.max_box:
                break
            out.append(
                [
                    max(0, x1 - self.padding),
                    max(0, y1 - self.padding),
                    min(W, x2 + self.padding),
                    min(H, y2 + self.padding),
                ]
            )
        return out


class VLMClassifier:
    def __init__(self, model_type="gpt", model_name="gpt-4o-2024-08-06", thinking_budget=0):
        print(f"[VLMClassifier] Initializing with model: {model_type}, {model_name}")
        self.model_type = model_type
        self.model_name = model_name
        self.thinking_budget = thinking_budget
        read_keys()

        if self.model_type == "gpt":
            self.api_key = os.environ["OPENAI_API_KEY"]
            self.api = GPTAPI(self.api_key, self.model_name)
        elif self.model_type == "gemini":
            self.api_key = os.environ["GOOGLE_API_KEY"]
            self.api = GeminiAPI(self.api_key, self.model_name, self.thinking_budget)
        elif self.model_type == "together":
            self.api_key = os.environ["TOGETHER_API_KEY"]
            self.api = TogetherAPI(self.api_key, self.model_name)
        elif self.model_type == "anthropic":
            self.api_key = os.environ["ANTHROPIC_API_KEY"]
            self.api = AnthropicAPI(self.api_key, self.model_name, self.thinking_budget)
        elif self.model_type == "qwen_local":
            self.api = QwenLocalAPI(
                model=self.model_name,
                device="cuda",
                torch_dtype="auto",
                max_new_tokens=12000,
                temperature=1.0,
                top_p=1.0,
            )
        else:
            raise ValueError(f"Unsupported VLM model type: {self.model_type}")

    def classify(self, patch, prompt: str, examples: dict = None):
        print(f"[VLMClassifier] Classifying patch")
        try:
            if isinstance(patch, np.ndarray):
                image = cv2.cvtColor(patch, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(image)
                buffered = BytesIO()
                pil_img.save(buffered, format="JPEG")
                img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            else:
                raise ValueError("Patch must be a NumPy array")
        except Exception as e:
            print(f"[VLMClassifier] Error processing image patch: {e}")
            return "InvalidImage"

        inputs = {"prompt": prompt, "image": img_str}
        examples = examples or {}

        try:
            label = self.api.get_shape_information(inputs, examples)
            print(f"[VLMClassifier] Received label: {label}")
            return label
        except Exception as e:
            print(f"[VLMClassifier] Classification error: {e}")
            return "Unknown"


class Classifier:
    def __init__(self):
        self.cfg = hybrid_cfg.config

        model_type = self.cfg.vlm_model_type
        model_name = self.cfg.vlm
        thinking_budget = self.cfg.thinking_budget
        print(f"[Classifier] Initializing Classifier with {model_type}:{model_name}")
        self.vlm_classifier = VLMClassifier(model_type=model_type, model_name=model_name, thinking_budget=thinking_budget)
        

    def _prepare_few_shot_examples(self, extras, shots_per_class=1, target_size=(124, 124), allowed_classes=None) -> dict:
        print(f"[Classifier] Preparing few-shot examples...")
        print(f"[Classifier] Resizing to shape {target_size}")
        class_map = {}
        for img, annotations in extras:
            for (bbox, label) in annotations:
                if allowed_classes and label not in allowed_classes:
                    continue
                if label not in class_map:
                    class_map[label] = []
                if len(class_map[label]) < shots_per_class:
                    x1, y1, x2, y2 = bbox[0][0], bbox[0][1], bbox[1][0], bbox[1][1]
                    patch = img[y1:y2, x1:x2]
                    try:
                        image = cv2.cvtColor(patch, cv2.COLOR_BGR2RGB)
                        pil_img = Image.fromarray(image)
                        pil_img = pil_img.resize(target_size, Image.BILINEAR)
                        buffered = BytesIO()
                        pil_img.save(buffered, format="JPEG")
                        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
                        class_map[label].append(img_str)
                    except Exception as e:
                        print(f"[Classifier] Error preparing example for {label}: {e}")
        print(f"[Classifier] Prepared {sum(len(v) for v in class_map.values())} examples")
        return class_map

    def classify_regions(self, image: np.ndarray, bboxes: list, prompt: str, extras=None, allowed_classes=None) -> list:
        print(f"[Classifier] Classifying {len(bboxes)} regions")

        target_size = self.cfg.target_size
        shots_per_class = self.cfg.shot

        examples = self._prepare_few_shot_examples(extras, shots_per_class, target_size, allowed_classes=allowed_classes) if extras else {}
        results = []
        for bbox in bboxes:
            try:
                x1, y1, x2, y2 = bbox
                patch = image[y1:y2, x1:x2]
                label = self.vlm_classifier.classify(patch, prompt, examples)
                if label is None or str(label).strip().lower() == "none":
                    continue
                results.append((bbox, label))
            except Exception as e:
                print(f"[Classifier] Classification failed for bbox {bbox}: {e}")
                results.append((bbox, "Unknown"))
        return results
