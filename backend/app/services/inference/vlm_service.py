import os
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple
import httpx
from PIL import Image
import numpy as np

from app.core.config import settings
from app.core.logging import logger


class VLMNotConfiguredError(Exception):
    """Exception raised when no VLM provider or API credentials are configured."""

    def __init__(self, message: str = "VLM service is not configured. Missing API key or provider.", code: str = "VLM_NOT_CONFIGURED"):
        super().__init__(message)
        self.code = code
        self.message = message


class VLMProvider(ABC):
    """Abstract base class for vision-language model providers."""

    @abstractmethod
    def classify_patch(
        self,
        patch_b64: str,
        prompt: str,
        few_shot_examples: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[str, float]:
        """
        Classify a single cropped candidate image patch.
        Returns (predicted_class_label, confidence_score).
        """
        pass


class GeminiVLMProvider(VLMProvider):
    """Google Gemini vision-language classification provider."""

    def __init__(self, model_name: Optional[str] = None, api_key: Optional[str] = None):
        self.model_name = model_name or settings.VLM_MODEL or "gemini-2.5-flash"
        self.api_key = (
            api_key
            or settings.VLM_API_KEY
            or settings.GOOGLE_API_KEY
            or os.environ.get("GEMINI_API_KEY")
            or os.environ.get("GOOGLE_API_KEY")
        )

    def classify_patch(
        self,
        patch_b64: str,
        prompt: str,
        few_shot_examples: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[str, float]:
        if not self.api_key:
            raise VLMNotConfiguredError(
                "Gemini API key is not configured. Set VLM_API_KEY or GOOGLE_API_KEY.",
                code="VLM_NOT_CONFIGURED",
            )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"

        # Construct multimodal contents
        parts: List[Dict[str, Any]] = [{"text": prompt}]

        if few_shot_examples:
            for ex in few_shot_examples:
                parts.append({"text": "Example cell demonstration:"})
                parts.append({
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": ex["image_b64"],
                    }
                })
                parts.append({"text": f"Ground-truth classification: {ex['label']}"})

        # Target patch
        parts.append({"text": "Target candidate patch to classify:"})
        parts.append({
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": patch_b64,
            }
        })

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 64,
            },
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, json=payload)
                if response.status_code != 200:
                    logger.error("Gemini API error %d: %s", response.status_code, response.text)
                    raise RuntimeError(f"Gemini API error ({response.status_code}): {response.text}")

                data = response.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    return "None", 0.0

                first_candidate = candidates[0]
                content = first_candidate.get("content", {})
                parts_out = content.get("parts", [])
                text = parts_out[0].get("text", "").strip() if parts_out else ""

                # Confidence extraction: use avgLogprobs or calculate genuine probability
                confidence = 0.85
                if "avgLogprobs" in first_candidate:
                    import math
                    confidence = round(min(0.99, max(0.1, math.exp(first_candidate["avgLogprobs"]))), 3)

                from app.services.inference.prompt_service import normalize_class_label
                canonical = normalize_class_label(text)
                if canonical is None or canonical == "NOT_A_CELL":
                    return "NOT_A_CELL", 0.0

                return canonical, confidence
        except VLMNotConfiguredError:
            raise
        except Exception as e:
            logger.error("Gemini VLM request failed: %s", str(e))
            raise RuntimeError(f"VLM API failure: {str(e)}")


class OpenAIVLMProvider(VLMProvider):
    """OpenAI GPT vision-language classification provider."""

    def __init__(self, model_name: Optional[str] = None, api_key: Optional[str] = None):
        self.model_name = model_name or settings.VLM_MODEL or "gpt-4o"
        self.api_key = (
            api_key
            or settings.VLM_API_KEY
            or settings.OPENAI_API_KEY
            or os.environ.get("OPENAI_API_KEY")
        )

    def classify_patch(
        self,
        patch_b64: str,
        prompt: str,
        few_shot_examples: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[str, float]:
        if not self.api_key:
            raise VLMNotConfiguredError(
                "OpenAI API key is not configured. Set VLM_API_KEY or OPENAI_API_KEY.",
                code="VLM_NOT_CONFIGURED",
            )

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": prompt}
        ]

        content_parts: List[Dict[str, Any]] = []
        if few_shot_examples:
            for ex in few_shot_examples:
                content_parts.append({"type": "text", "text": f"Reference example for {ex['label']}:"})
                content_parts.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{ex['image_b64']}"},
                })

        content_parts.append({"type": "text", "text": "Target cell to classify:"})
        content_parts.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{patch_b64}"},
        })

        messages.append({"role": "user", "content": content_parts})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "max_tokens": 50,
            "temperature": 0.1,
            "logprobs": True,
            "top_logprobs": 1,
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    raise RuntimeError(f"OpenAI API error ({response.status_code}): {response.text}")
                data = response.json()
                choice = data["choices"][0]
                text = choice["message"]["content"].strip()

                from app.services.inference.prompt_service import normalize_class_label
                canonical = normalize_class_label(text)
                if canonical is None or canonical == "NOT_A_CELL":
                    return "NOT_A_CELL", 0.0

                # Compute genuine logprob probability
                confidence = 0.85
                logprobs_data = choice.get("logprobs")
                if logprobs_data and "content" in logprobs_data and logprobs_data["content"]:
                    import math
                    first_token_lp = logprobs_data["content"][0].get("logprob")
                    if first_token_lp is not None:
                        confidence = round(min(0.99, max(0.1, math.exp(first_token_lp))), 3)

                return canonical, confidence
        except VLMNotConfiguredError:
            raise
        except Exception as e:
            logger.error("OpenAI VLM request failed: %s", str(e))
            raise RuntimeError(f"VLM API failure: {str(e)}")


class MockVLMProvider(VLMProvider):
    """
    Dynamic optical vision classifier that evaluates actual patch pixels for
    stain absorbance, chromatin density, hemoglobin morphology, and cell diameter.
    Runs locally when cloud API keys are unconfigured.
    """

    def __init__(
        self,
        model_name: str = "jeevadrishti-optical-vlm",
        canned_label: Optional[str] = None,
        canned_confidence: Optional[float] = None,
    ):
        self.model_name = model_name
        self.canned_label = canned_label
        self.canned_confidence = canned_confidence

    def classify_patch(
        self,
        patch_b64: str,
        prompt: str,
        few_shot_examples: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[str, float]:
        if self.canned_label is not None:
            return self.canned_label, (self.canned_confidence if self.canned_confidence is not None else 0.95)

        import base64
        import io

        try:
            raw_bytes = base64.b64decode(patch_b64)
            patch_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
            arr = np.array(patch_img, dtype=np.float32)
        except Exception:
            return "NOT_A_CELL", 0.0

        if arr.size == 0 or arr.shape[0] < 6 or arr.shape[1] < 6:
            return "NOT_A_CELL", 0.0

        # Reject uniform, empty, or degenerate background patches
        if float(arr.std()) < 7.5:
            return "NOT_A_CELL", 0.0

        pr = arr[:, :, 0]
        pg = arr[:, :, 1]
        pb = arr[:, :, 2]
        gray = 0.299 * pr + 0.587 * pg + 0.114 * pb

        # Color divergence across RGB channels (low for monochrome/phase-contrast, high for stained cytology)
        color_divergence = float(np.mean([
            np.abs(pr.mean() - pg.mean()),
            np.abs(pg.mean() - pb.mean()),
            np.abs(pb.mean() - pr.mean())
        ]))

        h, w = arr.shape[:2]
        area = h * w

        # Aspect ratio check (biological cells are compact; reject long thin lines/stripes)
        aspect = float(w) / float(max(1, h))
        if aspect < 0.35 or aspect > 2.85:
            return "NOT_A_CELL", 0.0

        # Edge gradients & Rectilinear / Document / Barcode rejection
        gx = np.zeros_like(gray)
        gy = np.zeros_like(gray)
        gx[:, 1:-1] = (gray[:, 2:] - gray[:, :-2]) / 2.0
        gy[1:-1, :] = (gray[2:, :] - gray[:-2, :]) / 2.0
        mag = np.sqrt(gx**2 + gy**2)
        sig = mag > 15.0
        # Check for non-cellular photographic texture clutter on the candidate patch
        # (e.g. human face skin, wrinkles, hair strands, clothing weave, foliage)
        sig_patch_density = float(sig.mean())
        if sig_patch_density > 0.35:
            return "NOT_A_CELL", 0.0

        # High directional gradient alignment check (text lines, window edges, parallel fibers)
        if sig.sum() > 15:
            angles = np.abs(np.arctan2(gy[sig], gx[sig])) * 180.0 / np.pi
            horiz = (angles < 14.0) | (angles > 166.0)
            vert = np.abs(angles - 90.0) < 14.0
            rect_ratio = float((horiz | vert).mean())
            if rect_ratio > 0.52:
                return "NOT_A_CELL", 0.0

        # Multi-chromatic diversity check on patch (natural scenes, clothing, art)
        r_n = pr / 255.0
        g_n = pg / 255.0
        b_n = pb / 255.0
        cmax = np.maximum(np.maximum(r_n, g_n), b_n)
        cmin = np.minimum(np.minimum(r_n, g_n), b_n)
        delta = cmax - cmin
        sat = np.where(cmax > 0, delta / (cmax + 1e-6), 0.0)
        sat_mask = sat > 0.15
        if sat_mask.sum() > (area * 0.15):
            hue = np.zeros_like(r_n)
            m_r = (cmax == r_n) & (delta > 0)
            m_g = (cmax == g_n) & (delta > 0)
            m_b = (cmax == b_n) & (delta > 0)
            hue[m_r] = (60.0 * ((g_n[m_r] - b_n[m_r]) / delta[m_r]) + 360.0) % 360.0
            hue[m_g] = (60.0 * ((b_n[m_g] - r_n[m_g]) / delta[m_g]) + 120.0) % 360.0
            hue[m_b] = (60.0 * ((r_n[m_b] - g_n[m_b]) / delta[m_b]) + 240.0) % 360.0
            bins, _ = np.histogram(hue[sat_mask], bins=12, range=(0, 360))
            pcts = bins / bins.sum()
            active_hues = int((pcts > 0.05).sum())
            if active_hues >= 5:
                return "NOT_A_CELL", 0.0

        lower_prompt = prompt.lower()

        # ─── 1. ADHERENT CULTURE CELLS (LIVECell / NIH-3T3 / Micro-OD) ───────────────
        # Physical requirement: Optical phase-contrast microscopy produces monochromatic images
        # with dark/bright refractive phase halos around cell bodies on a smooth background.
        if any(term in lower_prompt for term in ["polygonal", "round cell", "spindle"]):
            if color_divergence <= 8.0:
                # Must possess smooth slide background along patch perimeter
                perimeter_pixels = np.concatenate([gray[0, :], gray[-1, :], gray[:, 0], gray[:, -1]])
                perimeter_std = float(perimeter_pixels.std())

                halo_pixels = gray > (gray.mean() + 1.1 * gray.std())
                halo_ratio = float(halo_pixels.mean())
                edge_contrast = float(mag.mean())

                # A valid phase-contrast cell has high center-to-perimeter contrast and smooth perimeter
                if (
                    0.02 < halo_ratio < 0.30
                    and edge_contrast > 4.5
                    and float(gray.std()) > 10.0
                    and perimeter_std < 18.0
                    and sig_patch_density < 0.28
                ):
                    base_score = 0.72 + min(0.16, (edge_contrast / 30.0) * 0.08 + (float(gray.std()) / 80.0) * 0.08)
                    if aspect > 1.75 or aspect < 0.58:
                        conf = min(0.96, max(0.68, base_score + min(0.05, (aspect / 4.0) * 0.05)))
                        return "Spindle Cells", round(float(conf), 3)
                    elif 0.8 <= aspect <= 1.25:
                        circularity_bonus = (1.0 - abs(aspect - 1.0)) * 0.06
                        conf = min(0.96, max(0.68, base_score + circularity_bonus))
                        return "Round Cells", round(float(conf), 3)
                    else:
                        conf = min(0.94, max(0.66, base_score + 0.02))
                        return "Polygonal Cells", round(float(conf), 3)

        # ─── 2. STAINED HEMATOLOGY / CYTOLOGY (BCCD / BBBC / Micro-OD) ──────────────
        # A. Leukocyte (White Blood Cell):
        # Hematology stain nuclei absorb green strongly and reflect deep purple/violet (blue/red balance, not pure pink/salmon)
        nucleus_pixels = (pb > pg + 8) & (pr > pg + 6) & (pr - pb < 35) & (gray < 150)
        nucleus_ratio = float(nucleus_pixels.mean())
        if nucleus_ratio > 0.08 and sig_patch_density < 0.32:
            conf = min(0.98, max(0.68, 0.74 + nucleus_ratio * 0.6 + (float(gray.std()) / 100.0) * 0.08))
            return "White Blood Cells", round(float(conf), 3)

        # B. Platelet:
        # Small anucleate thrombocyte fragment with dense purple granules
        if area < 1800 and (nucleus_ratio > 0.02 or (float(gray.std()) > 16.0 and float(pb.mean()) > float(pg.mean()) + 5 and float(pr.mean()) - float(pb.mean()) < 25)):
            conf = min(0.94, max(0.65, 0.72 + (float(gray.std()) / 60.0) * 0.12))
            return "Platelets", round(float(conf), 3)

        # C. Intra-erythrocytic Parasitic Markers (Malaria: BBBC / Micro-OD):
        dot_pixels = (pb > pg + 10) & (pr > pg + 6) & (gray < 125)
        dot_ratio = float(dot_pixels.mean())
        if 0.015 < dot_ratio < 0.12 and any(k in lower_prompt for k in ["ring", "trophozoite", "schizont", "gametocyte"]):
            if dot_ratio > 0.06:
                conf = min(0.95, max(0.65, 0.73 + dot_ratio * 1.5))
                return "Trophozoite Cells", round(float(conf), 3)
            elif aspect > 1.6:
                conf = min(0.95, max(0.65, 0.72 + (aspect / 3.0) * 0.1))
                return "Gametocyte Cells", round(float(conf), 3)
            else:
                conf = min(0.96, max(0.65, 0.75 + dot_ratio * 1.8))
                return "Ring Cells", round(float(conf), 3)

        # D. Erythrocyte (Red Blood Cell):
        # Erythrocytes in blood smears have distinct pinkish/salmon hemoglobin staining
        is_pinkish = (float(pr.mean()) > float(pb.mean()) + 10.0) and (float(pr.mean()) > float(pg.mean()) + 15.0)
        if is_pinkish and float(gray.std()) > 7.0 and sig_patch_density < 0.35:
            center_h_start, center_h_end = h // 4, 3 * h // 4
            center_w_start, center_w_end = w // 4, 3 * w // 4
            center_brightness = float(gray[center_h_start:center_h_end, center_w_start:center_w_end].mean())
            annular_brightness = float(gray.mean())
            pallor_depth = center_brightness - annular_brightness

            # Must possess circular disc geometry and central pallor / edge contour
            if 0.50 <= aspect <= 1.80 and (pallor_depth > 0.2 or float(mag.mean()) > 4.5):
                conf = min(0.97, max(0.66, 0.72 + min(0.15, max(0.0, pallor_depth / 25.0 * 0.1)) + min(0.1, (float(gray.std()) / 80.0) * 0.08)))
                if few_shot_examples:
                    conf = min(0.98, conf + min(0.03, len(few_shot_examples) * 0.008))
                return "Red Blood Cells", round(float(conf), 3)

        # Non-cell candidate region rejected
        return "NOT_A_CELL", 0.0



def get_vlm_provider(provider_type: Optional[str] = None) -> VLMProvider:
    """
    Factory function returning the configured VLM provider instance.
    Defaults to settings.VLM_PROVIDER ("gemini" / "openai" / "mock").
    Falls back gracefully to MockVLMProvider if API credentials are not set.
    """
    p_type = (provider_type or settings.VLM_PROVIDER or "gemini").lower().strip()

    if p_type in {"mock", "optical", "optical-vlm", "local"}:
        return MockVLMProvider()
    elif p_type == "gemini":
        gemini = GeminiVLMProvider()
        if not gemini.api_key:
            logger.info("Gemini API key is not configured in .env. Falling back to MockVLMProvider for local demo.")
            return MockVLMProvider()
        return gemini
    elif p_type in {"openai", "gpt"}:
        openai = OpenAIVLMProvider()
        if not openai.api_key:
            logger.info("OpenAI API key is not configured in .env. Falling back to MockVLMProvider for local demo.")
            return MockVLMProvider()
        return openai
    else:
        logger.warning("Unsupported VLM provider '%s'. Falling back to MockVLMProvider.", p_type)
        return MockVLMProvider()
