from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from PIL import Image
import numpy as np

from app.core.config import settings
from app.core.logging import logger


class AIModelUnavailableError(Exception):
    """Exception raised when required SAM model weights or runtime dependencies are not present."""

    def __init__(self, message: str = "SAM model weights or dependencies are unavailable.", code: str = "AI_MODEL_UNAVAILABLE"):
        super().__init__(message)
        self.code = code
        self.message = message


class SAMService:
    """
    SAM (Segment Anything Model) object proposal generator with lazy loading,
    precomputed cache resolution, and controlled unavailability handling.
    """

    _instance: Optional["SAMService"] = None
    _mask_generator: Any = None

    def __new__(cls) -> "SAMService":
        if cls._instance is None:
            cls._instance = super(SAMService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._model_path_override: Optional[str] = None
        self._model_type_override: Optional[str] = None
        self._initialized = True

    @property
    def model_path(self) -> Optional[str]:
        return self._model_path_override or settings.SAM_MODEL_PATH

    @model_path.setter
    def model_path(self, val: Optional[str]) -> None:
        self._model_path_override = val

    @property
    def model_type(self) -> str:
        return self._model_type_override or settings.SAM_MODEL_TYPE

    @model_type.setter
    def model_type(self, val: str) -> None:
        self._model_type_override = val

    def is_model_available(self) -> bool:
        """Check if configured SAM weights exist on disk and runtime dependencies are importable."""
        path = self.model_path
        if not path:
            return False
        if str(path).lower() in ("optical", "demo", "pixel"):
            return True
        checkpoint_path = Path(path)
        if not checkpoint_path.is_file():
            return False
        try:
            import torch  # noqa: F401
            import segment_anything  # noqa: F401
            return True
        except ImportError:
            return False

    def _get_generator(self) -> Any:
        """Lazy load SAM model into memory and cache the generator singleton."""
        if self._mask_generator is not None:
            return self._mask_generator

        if not self.is_model_available():
            raise AIModelUnavailableError(
                f"SAM model checkpoint unavailable at '{self.model_path}'. Configure SAM_MODEL_PATH.",
                code="AI_MODEL_UNAVAILABLE",
            )

        logger.info("Lazily loading SAM checkpoint: %s (%s)", self.model_path, self.model_type)
        try:
            import torch
            from segment_anything import sam_model_registry, SamAutomaticMaskGenerator

            device = "cuda" if torch.cuda.is_available() else "cpu"
            sam = sam_model_registry[self.model_type](checkpoint=self.model_path).to(device)
            sam.eval()
            self._mask_generator = SamAutomaticMaskGenerator(sam)
            return self._mask_generator
        except Exception as e:
            logger.error("Failed to initialize SAM model: %s", str(e))
            raise AIModelUnavailableError(f"Failed to load SAM: {str(e)}", code="AI_MODEL_UNAVAILABLE")

    def _load_cached_proposals(self, cache_key: Optional[str]) -> Optional[List[Tuple[int, int, int, int]]]:
        """Attempt to load precomputed proposals from disk if available."""
        if not cache_key:
            return None
        cache_file = Path(cache_key)
        if cache_file.exists() and cache_file.suffix == ".npz":
            try:
                data = np.load(cache_file)
                boxes = data["boxes"]  # [x1, y1, x2, y2]
                return [tuple(map(int, b)) for b in boxes]
            except Exception as e:
                logger.warning("Failed reading cached proposals from %s: %s", cache_file, str(e))
        return None

    def _generate_fallback_proposals(
        self,
        image: Image.Image,
        max_candidates: int = 15,
        padding: int = 8,
    ) -> List[Tuple[int, int, int, int]]:
        """
        Dynamically segment candidate cellular regions from the input image pixels.
        Uses adaptive luminance thresholding and connected component analysis.
        Returns empty list if image lacks cytological variance or morphology.
        """
        from collections import deque

        w, h = image.size
        img_rgb = image.convert("RGB")
        arr = np.array(img_rgb, dtype=np.float32)

        # Image quality / variance check — flat or uninformative images return 0 proposals
        if float(arr.std()) < 10.0:
            logger.info("Input image has insufficient variance (std < 10.0) for cell proposal generation.")
            return []

        # Convert to grayscale
        gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]

        # Determine brightfield (darker cells on bright bg) vs darkfield/fluorescence (bright cells on dark bg)
        p90 = float(np.percentile(gray, 90))
        mean_lum = float(gray.mean())
        is_brightfield = p90 > 130 and mean_lum > 95

        if is_brightfield:
            bg_level = float(np.percentile(gray, 85))
            foreground_mask = gray < (bg_level - 12)
        else:
            bg_level = float(np.percentile(gray, 20))
            foreground_mask = gray > (bg_level + 20)

        scale = max(1, min(w, h) // 256)
        small_mask = foreground_mask[::scale, ::scale]
        sh, sw = small_mask.shape

        visited = np.zeros_like(small_mask, dtype=bool)
        regions = []

        step = max(1, scale // 2 or 2)
        for r in range(0, sh, step):
            for c in range(0, sw, step):
                if small_mask[r, c] and not visited[r, c]:
                    q = deque([(r, c)])
                    visited[r, c] = True
                    min_r, max_r = r, r
                    min_c, max_c = c, c
                    pixel_count = 0

                    while q and pixel_count < 3500:
                        cr, cc = q.popleft()
                        pixel_count += 1
                        if cr < min_r: min_r = cr
                        if cr > max_r: max_r = cr
                        if cc < min_c: min_c = cc
                        if cc > max_c: max_c = cc

                        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                            nr, nc = cr + dr, cc + dc
                            if 0 <= nr < sh and 0 <= nc < sw and not visited[nr, nc] and small_mask[nr, nc]:
                                visited[nr, nc] = True
                                q.append((nr, nc))

                    box_w = (max_c - min_c + 1) * scale
                    box_h = (max_r - min_r + 1) * scale
                    area = box_w * box_h

                    # Filter valid cell area range (0.03% to 22% of image area)
                    if (w * h * 0.0003) < area < (w * h * 0.22):
                        pad_x = int(box_w * 0.1) + padding
                        pad_y = int(box_h * 0.1) + padding
                        x1 = max(0, min_c * scale - pad_x)
                        y1 = max(0, min_r * scale - pad_y)
                        x2 = min(w, (max_c + 1) * scale + pad_x)
                        y2 = min(h, (max_r + 1) * scale + pad_y)
                        regions.append((x1, y1, x2, y2, area))

        if not regions:
            return []

        # Sort by area/salience descending
        regions.sort(key=lambda r: r[4], reverse=True)

        # Apply Non-Maximum Suppression to eliminate duplicate overlapping boxes
        selected_boxes: List[Tuple[int, int, int, int]] = []
        for r in regions:
            x1, y1, x2, y2, area = r
            overlap = False
            for b in selected_boxes:
                ix1 = max(x1, b[0])
                iy1 = max(y1, b[1])
                ix2 = min(x2, b[2])
                iy2 = min(y2, b[3])
                if ix2 > ix1 and iy2 > iy1:
                    inter_area = (ix2 - ix1) * (iy2 - iy1)
                    union_area = (x2 - x1) * (y2 - y1) + (b[2] - b[0]) * (b[3] - b[1]) - inter_area
                    if union_area > 0 and (inter_area / union_area) > 0.35:
                        overlap = True
                        break
            if not overlap:
                selected_boxes.append((int(x1), int(y1), int(x2), int(y2)))
                if len(selected_boxes) >= max_candidates:
                    break

        return selected_boxes


    def generate_proposals(
        self,
        image: Image.Image,
        max_candidates: int = 15,
        padding: int = 10,
        cache_key: Optional[str] = None,
    ) -> List[Tuple[int, int, int, int]]:
        """
        Generate candidate region bounding boxes [x1, y1, x2, y2] using SAM.
        Supports precomputed proposals, live inference, or optical fallback.
        """
        w, h = image.size

        # 1. Try cache if provided
        cached = self._load_cached_proposals(cache_key)
        if cached is not None:
            proposals = []
            for b in cached[:max_candidates]:
                x1, y1, x2, y2 = b
                proposals.append((
                    max(0, x1 - padding),
                    max(0, y1 - padding),
                    min(w, x2 + padding),
                    min(h, y2 + padding),
                ))
            return proposals

        # 2. Check if model is available
        if not self.is_model_available():
            raise AIModelUnavailableError(
                f"SAM model checkpoint unavailable at '{self.model_path or 'unconfigured'}'. Configure SAM_MODEL_PATH.",
                code="AI_MODEL_UNAVAILABLE",
            )

        if self.model_path and str(self.model_path).lower() in ("optical", "demo", "pixel"):
            return self._generate_fallback_proposals(image, max_candidates=max_candidates, padding=padding)

        # 3. Live SAM execution (if checkpoint file available)
        generator = self._get_generator()
        img_np = np.array(image)

        masks = generator.generate(img_np)
        if masks:
            masks.sort(key=lambda m: m.get("predicted_iou", 0.0), reverse=True)
            boxes: List[Tuple[int, int, int, int]] = []
            for m in masks[:max_candidates]:
                bx, by, bw, bh = m["bbox"]
                x1 = max(0, int(bx) - padding)
                y1 = max(0, int(by) - padding)
                x2 = min(w, int(bx + bw) + padding)
                y2 = min(h, int(by + bh) + padding)
                boxes.append((x1, y1, x2, y2))
            return boxes
        return []

    def generate_optical_proposals(
        self,
        image: Image.Image,
        max_candidates: int = 15,
        padding: int = 10,
    ) -> List[Tuple[int, int, int, int]]:
        """Direct optical patch proposal generation for dynamic local analysis."""
        return self._generate_fallback_proposals(image, max_candidates=max_candidates, padding=padding)


sam_service = SAMService()
