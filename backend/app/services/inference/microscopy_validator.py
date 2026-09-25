from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional, Union
import numpy as np
from PIL import Image

from app.core.logging import logger
from app.services.inference.image_service import load_image


@dataclass
class MicroscopyValidationResult:
    """Structured result from the microscopy validation layer."""

    is_valid: bool
    reason: Optional[str] = None
    message: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)


class MicroscopyValidator:
    """
    General computer-vision microscopy image validator.
    Inspects optical properties, rectilinear edge distributions, spatial illumination
    uniformity, chromatic entropy, and condenser field profiles to reject non-microscopy
    images (human portraits, art/religious paintings, ID cards, documents, screenshots,
    natural photographs) before cell detection.
    """

    def __init__(
        self,
        max_rectilinear_ratio: float = 0.58,
        max_quadrant_divergence: float = 28.0,
        text_edge_threshold: float = 15.0,
    ):
        self.max_rectilinear_ratio = max_rectilinear_ratio
        self.max_quadrant_divergence = max_quadrant_divergence
        self.text_edge_threshold = text_edge_threshold

    def validate(
        self,
        image: Union[Path, str, bytes, Image.Image],
        vlm_provider: Optional[Any] = None,
    ) -> MicroscopyValidationResult:
        """
        Validate whether the given image represents an authentic microscopy specimen.
        Returns MicroscopyValidationResult(is_valid, reason, message, details).
        """
        try:
            pil_image = load_image(image)
        except Exception as e:
            return MicroscopyValidationResult(
                is_valid=False,
                reason="invalid_image_format",
                message=f"Image could not be parsed: {str(e)}",
                details={"error": str(e)},
            )

        rgb_image = pil_image.convert("RGB")
        w, h = rgb_image.size

        # Reject extremely small or degenerate inputs
        if w < 64 or h < 64:
            return MicroscopyValidationResult(
                is_valid=False,
                reason="non_microscopy_image",
                message="The uploaded image does not appear to be a microscopy image (dimensions too small).",
                details={"width": w, "height": h},
            )

        arr = np.array(rgb_image, dtype=np.float32)
        gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]

        # 1. Check for complete blank / uniform slide
        # (A blank slide is a VALID microscopy field with 0 detections, not a non-microscopy image)
        gray_std = float(gray.std())
        if gray_std < 5.0:
            return MicroscopyValidationResult(
                is_valid=True,
                reason=None,
                message="Valid microscopy slide field (uniform background).",
                details={"gray_std": round(gray_std, 2), "classification": "uniform_microscopy_slide"},
            )

        # 2. Circular Eyepiece / Ocular Aperture Detection
        # Optical microscope photographs often have a circular field diaphragm with black outer corners
        c_sz = max(4, min(h, w) // 16)
        c1 = arr[:c_sz, :c_sz].mean()
        c2 = arr[:c_sz, -c_sz:].mean()
        c3 = arr[-c_sz:, :c_sz].mean()
        c4 = arr[-c_sz:, -c_sz:].mean()
        corner_mean = float(np.mean([c1, c2, c3, c4]))
        corner_std = float(np.std([c1, c2, c3, c4]))

        mid_y, mid_x = h // 2, w // 2
        cy_grid, cx_grid = np.ogrid[:h, :w]
        dist_from_center = np.sqrt((cx_grid - mid_x)**2 + (cy_grid - mid_y)**2)
        r_aperture = min(mid_x, mid_y) * 0.92
        inner_mask = dist_from_center < (r_aperture * 0.85)
        outer_corners_mask = dist_from_center > (r_aperture * 1.08)

        is_circular_ocular_field = False
        if outer_corners_mask.sum() > 100 and inner_mask.sum() > 100:
            outer_mean = float(gray[outer_corners_mask].mean())
            inner_mean = float(gray[inner_mask].mean())
            if outer_mean < 25.0 and inner_mean > 50.0 and (inner_mean - outer_mean) > 35.0:
                is_circular_ocular_field = True

        eval_gray = gray[inner_mask] if is_circular_ocular_field else gray

        # 3. Rectilinear & Text / Document / ID Card Edge Analysis
        gx = np.zeros_like(gray)
        gy = np.zeros_like(gray)
        gx[:, 1:-1] = (gray[:, 2:] - gray[:, :-2]) / 2.0
        gy[1:-1, :] = (gray[2:, :] - gray[:-2, :]) / 2.0
        mag = np.sqrt(gx**2 + gy**2)

        sig_mask = mag > self.text_edge_threshold
        sig_count = int(sig_mask.sum())
        sig_edge_pct = float(sig_mask.mean() * 100.0)

        rectilinear_ratio = 0.0
        if sig_count > 60:
            angles = np.abs(np.arctan2(gy[sig_mask], gx[sig_mask])) * 180.0 / np.pi
            horiz = (angles < 14.0) | (angles > 166.0)
            vert = np.abs(angles - 90.0) < 14.0
            rectilinear_ratio = float((horiz | vert).mean())

        row_grads = np.abs(gy).mean(axis=1)
        row_std = float(row_grads.std())
        row_peaks = int((row_grads > (row_grads.mean() + 1.6 * row_std)).sum()) if row_std > 0 else 0

        # 4. Spatial Illumination & Color Divergence (Quadrants)
        q1 = arr[:mid_y, :mid_x].mean(axis=(0, 1))
        q2 = arr[:mid_y, mid_x:].mean(axis=(0, 1))
        q3 = arr[mid_y:, :mid_x].mean(axis=(0, 1))
        q4 = arr[mid_y:, mid_x:].mean(axis=(0, 1))
        quad_divergence = float(np.array([q1, q2, q3, q4]).std(axis=0).mean())

        if is_circular_ocular_field:
            bg_brightness = float(np.percentile(eval_gray, 75))
        else:
            bg_brightness = float(corner_mean)

        # 5. Chromatic & Hue Entropy Analysis
        r_norm = arr[:, :, 0] / 255.0
        g_norm = arr[:, :, 1] / 255.0
        b_norm = arr[:, :, 2] / 255.0
        cmax = np.maximum(np.maximum(r_norm, g_norm), b_norm)
        cmin = np.minimum(np.minimum(r_norm, g_norm), b_norm)
        delta = cmax - cmin
        sat = np.where(cmax > 0, delta / (cmax + 1e-6), 0.0)

        if is_circular_ocular_field:
            bg_sat = float(sat[inner_mask].mean())
        else:
            bg_sat = float(
                sat[:c_sz, :c_sz].mean()
                + sat[:c_sz, -c_sz:].mean()
                + sat[-c_sz:, :c_sz].mean()
                + sat[-c_sz:, -c_sz:].mean()
            ) / 4.0

        hue = np.zeros_like(r_norm)
        mask_r = (cmax == r_norm) & (delta > 0)
        mask_g = (cmax == g_norm) & (delta > 0)
        mask_b = (cmax == b_norm) & (delta > 0)
        hue[mask_r] = (60.0 * ((g_norm[mask_r] - b_norm[mask_r]) / delta[mask_r]) + 360.0) % 360.0
        hue[mask_g] = (60.0 * ((b_norm[mask_g] - r_norm[mask_g]) / delta[mask_g]) + 120.0) % 360.0
        hue[mask_b] = (60.0 * ((r_norm[mask_b] - g_norm[mask_b]) / delta[mask_b]) + 240.0) % 360.0

        sat_pixels = sat > 0.12
        if is_circular_ocular_field:
            sat_pixels = sat_pixels & inner_mask

        active_hue_bins = 0
        hue_entropy = 0.0
        if sat_pixels.sum() > (h * w * 0.01):
            sat_hues = hue[sat_pixels]
            bins, _ = np.histogram(sat_hues, bins=12, range=(0, 360))
            pcts = bins / bins.sum()
            active_hue_bins = int((pcts > 0.04).sum())
            hue_entropy = float(-np.sum(pcts[pcts > 0] * np.log2(pcts[pcts > 0])))

        # Physical Optical Illumination Field Classification:
        # Optical microscopy can have varied condenser brightness (40-255) depending on lamp setting, staining, or camera exposure
        is_brightfield = bg_brightness >= 45.0
        is_darkfield = bg_brightness <= 30.0 and not is_circular_ocular_field
        is_phase_contrast = (bg_sat <= 0.045) and (float(sat.mean()) <= 0.045)
        # Uniform spatial illumination characteristic of a microscope stage/slide condenser field
        is_uniform_condenser_field = quad_divergence <= (self.max_quadrant_divergence * 0.85) and corner_std <= 25.0

        details = {
            "rectilinear_ratio": round(rectilinear_ratio, 4),
            "sig_edge_pct": round(sig_edge_pct, 2),
            "quad_divergence": round(quad_divergence, 2),
            "corner_std": round(corner_std, 2),
            "bg_brightness": round(bg_brightness, 2),
            "bg_sat": round(bg_sat, 4),
            "active_hue_bins": active_hue_bins,
            "hue_entropy": round(hue_entropy, 2),
            "is_circular_ocular_field": is_circular_ocular_field,
            "row_peaks": row_peaks,
            "dimensions": [w, h],
        }

        # ─── REJECTION HEURISTICS ─────────────────────────────────────────────

        # A. ID Card / Credential / Document / Screenshot Detection
        # Strong outer card/window boundaries and horizontal text rows
        if rectilinear_ratio > self.max_rectilinear_ratio and (sig_edge_pct > 2.0 or row_peaks > 15):
            logger.info("MicroscopyValidator rejected image: Document/card structure detected (%s)", details)
            return MicroscopyValidationResult(
                is_valid=False,
                reason="non_microscopy_image",
                message="The uploaded image does not appear to be a microscopy image. Detected structural characteristics of a document, card, or screenshot.",
                details=details,
            )

        # B. Macroscopic Natural Scene Illumination Asymmetry (landscapes, rooms, outdoor scenes)
        # Natural scenes have macroscopic lighting gradients (sky vs ground, directional shadows)
        if not is_circular_ocular_field:
            if quad_divergence > self.max_quadrant_divergence or (corner_std > 28.0 and quad_divergence > 7.5):
                logger.info("MicroscopyValidator rejected image: Macroscopic illumination asymmetry (%s)", details)
                return MicroscopyValidationResult(
                    is_valid=False,
                    reason="non_microscopy_image",
                    message="The uploaded image does not appear to be a microscopy image. Illumination profile does not match optical microscopy condenser field.",
                    details=details,
                )

        # C. Multi-Chromatic Diversity / Religious Art / Paintings / Real-World Photos
        # Optical microscopy stains (Giemsa, Wright, H&E) produce 1-2 distinct stain hues.
        # Real-world scenes, religious art, and natural photography cover diverse hues across the spectrum.
        is_multi_chromatic = (
            (active_hue_bins >= 7)
            or (hue_entropy > 2.65)
            or (active_hue_bins >= 4 and bg_sat > 0.35 and not is_phase_contrast and quad_divergence > 6.0)
            or (active_hue_bins >= 5 and not is_brightfield and not is_phase_contrast and bg_brightness > 30.0)
            or (active_hue_bins >= 4 and is_darkfield and bg_sat > 0.15)
        )
        if is_multi_chromatic:
            logger.info("MicroscopyValidator rejected image: Multi-chromatic scene/art detected (%s)", details)
            return MicroscopyValidationResult(
                is_valid=False,
                reason="non_microscopy_image",
                message="The uploaded image does not appear to be a microscopy image. Detected multi-hue real-world scene or artwork.",
                details=details,
            )

        # D. Optical Condenser Profile Check
        # Rejects portraits, indoor photos, and real-world objects whose illumination
        # does not match an optical microscopy condenser field, darkfield, phase contrast, or circular field
        if not (is_brightfield or is_darkfield or is_phase_contrast or is_circular_ocular_field or is_uniform_condenser_field):
            logger.info("MicroscopyValidator rejected image: Non-microscopic illumination profile (%s)", details)
            return MicroscopyValidationResult(
                is_valid=False,
                reason="non_microscopy_image",
                message="The uploaded image does not appear to be a microscopy image. Illumination profile does not match an optical microscopy condenser field.",
                details=details,
            )

        # E. Macroscopic Texture Density (Real-World Photographic Texture Clutter)
        # Optical microscopy has smooth background with cellular instances; real-world photos (clothing, foliage, hair)
        # have dominating edge clutter across the entire visual field combined with high color divergence or rectilinearity.
        if sig_edge_pct > 32.0 and (active_hue_bins >= 5 or rectilinear_ratio > 0.45 or quad_divergence > 9.0):
            logger.info("MicroscopyValidator rejected image: Macroscopic edge texture clutter (sig_edge_pct=%.2f%%)", sig_edge_pct)
            return MicroscopyValidationResult(
                is_valid=False,
                reason="non_microscopy_image",
                message="The uploaded image does not appear to be a microscopy image. Detected high-density macroscopic photographic texture.",
                details=details,
            )

        # F. Active VLM Whole-Image Domain Verification (if live cloud VLM provider supplied)
        if vlm_provider and hasattr(vlm_provider, "api_key") and getattr(vlm_provider, "api_key", None):
            try:
                from app.services.inference.image_service import image_to_base64
                small_img = rgb_image.copy()
                small_img.thumbnail((384, 384))
                img_b64 = image_to_base64(small_img, format="JPEG")
                domain_prompt = (
                    "Inspect this image carefully. Is this an authentic optical, electron, or fluorescence microscopy specimen "
                    "of biological cells, tissues, blood smears, or microorganisms? "
                    "If it depicts a human portrait, person, artwork, religious painting, natural photography, document, "
                    "ID card, screenshot, or everyday macroscopic object, you MUST answer NO.\n"
                    "Respond with ONLY 'YES' or 'NO'."
                )
                raw_ans, _ = vlm_provider.classify_patch(patch_b64=img_b64, prompt=domain_prompt)
                if raw_ans and "no" in raw_ans.lower():
                    logger.info("VLM domain verification rejected image: %s", raw_ans)
                    return MicroscopyValidationResult(
                        is_valid=False,
                        reason="non_microscopy_image",
                        message="The uploaded image does not appear to be a microscopy image.",
                        details={**details, "vlm_verification": raw_ans},
                    )
            except Exception as e:
                logger.warning("VLM domain verification check skipped on exception: %s", str(e))

        # Passed all validation checks -> authentic microscopy specimen
        return MicroscopyValidationResult(
            is_valid=True,
            reason=None,
            message="Microscopy specimen validated successfully.",
            details=details,
        )


microscopy_validator = MicroscopyValidator()
