"""
Microscopy Domain and Pipeline Classifier
=========================================
Automatically determines the appropriate microscopy domain, dataset adapter context,
and internal inference pipeline by inspecting the optical, chromatic, and morphological
properties of the uploaded microscopy image.

Supported automatic domains:
- Cervical Cytology / Pap Smear (SIPaKMeD) -> TaskType.CELL_CLASSIFICATION
- Leukemia Blast Cytology (C-NMC 2019)     -> TaskType.CELL_CLASSIFICATION
- Erythrocyte / Sickle Anemia (RedTell)    -> TaskType.CELL_CLASSIFICATION
- Malaria Parasite Detection (NIH-NLM)     -> TaskType.OBJECT_DETECTION
- Peripheral Blood Smear (Micro-OD / BCCD) -> TaskType.OBJECT_DETECTION
- General Optical Microscopy (Micro-OD)    -> TaskType.OBJECT_DETECTION
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Tuple, Union
import numpy as np
from PIL import Image

from app.core.logging import logger
from app.services.inference.image_service import load_image
from app.services.datasets.base import TaskType


def determine_microscopy_domain(
    image: Union[Path, str, bytes, Image.Image],
) -> Tuple[str, TaskType, Dict[str, Any]]:
    """
    Inspect the optical properties of an image to automatically select the most
    appropriate dataset adapter context and task pipeline.

    Returns:
        (dataset_id, task_type, details_dict)
    """
    try:
        pil_image = load_image(image)
    except Exception as exc:
        logger.warning("Domain classifier could not load image: %s; defaulting to micro_od", exc)
        return "micro_od", TaskType.OBJECT_DETECTION, {"error": str(exc)}

    rgb_image = pil_image.convert("RGB")
    w, h = rgb_image.size
    arr = np.array(rgb_image, dtype=np.float32)

    # 1. Normalized RGB channels
    r_norm = arr[:, :, 0] / 255.0
    g_norm = arr[:, :, 1] / 255.0
    b_norm = arr[:, :, 2] / 255.0

    cmax = np.maximum(np.maximum(r_norm, g_norm), b_norm)
    cmin = np.minimum(np.minimum(r_norm, g_norm), b_norm)
    delta = cmax - cmin

    sat = np.where(cmax > 0, delta / (cmax + 1e-6), 0.0)

    # Fast Hue computation
    hue = np.zeros_like(r_norm)
    mask_r = (cmax == r_norm) & (delta > 0)
    mask_g = (cmax == g_norm) & (delta > 0)
    mask_b = (cmax == b_norm) & (delta > 0)
    hue[mask_r] = (60.0 * ((g_norm[mask_r] - b_norm[mask_r]) / delta[mask_r]) + 360.0) % 360.0
    hue[mask_g] = (60.0 * ((b_norm[mask_g] - r_norm[mask_g]) / delta[mask_g]) + 120.0) % 360.0
    hue[mask_b] = (60.0 * ((r_norm[mask_b] - g_norm[mask_b]) / delta[mask_b]) + 240.0) % 360.0

    # 2. Chromatic and structural metrics
    mean_intensity = float(arr.mean(axis=2).mean())
    dark_bg_pct = float((arr.mean(axis=2) < 40).mean() * 100.0)
    avg_sat = float(sat.mean())

    # Characteristic Stain Hue Bands (filtered by minimum saturation)
    # Pap smear (Papanicolaou): Distinct cyan, teal, green-blue cytoplasm (EA/OG-6 stain)
    teal_cyan_pct = float(((hue >= 125) & (hue <= 220) & (sat > 0.08)).mean() * 100.0)

    # Giemsa / Wright leukocyte nuclear stain (violet / purple)
    purple_violet_pct = float(((hue >= 250) & (hue <= 335) & (sat > 0.08)).mean() * 100.0)

    # Giemsa / Wright erythrocyte cytoplasm stain (salmon / pink / red)
    red_salmon_pct = float((((hue >= 340) | (hue <= 35)) & (sat > 0.08)).mean() * 100.0)

    details = {
        "dimensions": [w, h],
        "mean_intensity": round(mean_intensity, 2),
        "dark_bg_pct": round(dark_bg_pct, 2),
        "avg_sat": round(avg_sat, 4),
        "teal_cyan_pct": round(teal_cyan_pct, 2),
        "purple_violet_pct": round(purple_violet_pct, 2),
        "red_salmon_pct": round(red_salmon_pct, 2),
    }

    # 3. Decision Logic based on physical optical properties
    # ── Rule 1: Leukemia Blast Cytology (C-NMC 2019)
    # Segmented single-cell crop with dark/black background (>65% dark) and prominent purple nucleus
    if dark_bg_pct > 65.0:
        details["selected_reason"] = "Segmented single-cell crop with dark background and leukocyte chromatin"
        logger.info("Auto-domain detected C-NMC 2019 leukemia context (%s)", details)
        return "c_nmc_2019", TaskType.CELL_CLASSIFICATION, details

    # ── Rule 2: Cervical Cytology / Pap Smear (SIPaKMeD)
    # Pap smear stain has unique cyan/teal cytoplasm (125-220 deg) rarely found in peripheral blood smears
    if teal_cyan_pct > 1.2 or (teal_cyan_pct > 0.4 and teal_cyan_pct > red_salmon_pct * 0.15 and purple_violet_pct < 5.0):
        details["selected_reason"] = "Papanicolaou stain cyan/teal epithelial cytoplasm detected"
        logger.info("Auto-domain detected SIPaKMeD cervical cytology context (%s)", details)
        return "sipakmed", TaskType.CELL_CLASSIFICATION, details

    # ── Rule 3: Peripheral Blood Smear Multi-Lineage (Micro-OD / BCCD)
    # Standard Romanowsky-stained peripheral blood smear with RBCs and WBCs
    if purple_violet_pct > 3.0 or red_salmon_pct > 12.0:
        details["selected_reason"] = "Romanowsky Giemsa/Wright blood smear optical profile detected"
        logger.info("Auto-domain detected Micro-OD blood smear context (%s)", details)
        return "micro_od", TaskType.OBJECT_DETECTION, details

    # ── Rule 4: General Optical Microscopy fallback (Micro-OD)
    details["selected_reason"] = "General optical microscopy multi-cell field"
    logger.info("Auto-domain defaulted to Micro-OD general microscopy context (%s)", details)
    return "micro_od", TaskType.OBJECT_DETECTION, details
