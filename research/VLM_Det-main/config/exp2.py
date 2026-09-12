"""Configuration & prompts for Experiment 2 (direct detection)."""

class prompts:
    # ------------------------------------------------------------------
    DETECTION_BCCD = (
        """
        You will be given a microscopic RGB image of a human blood smear. Your task is to get bounding boxes around the following three categories of blood components:

        1. **Platelets** – Small, irregularly shaped fragments. They lack a nucleus and appear as tiny, scattered specks.
        2. **Red Blood Cells (RBCs)** – Round, biconcave discs with a smooth, circular outline. They often appear lighter in the center.
        3. **White Blood Cells (WBCs)** – Larger cells with a distinct, often multi-lobed nucleus. Their cytoplasm may contain visible granules.

        Return **only** a JSON object with exactly these three keys: `"Platelets"`, `"RBC"`, and `"WBC"`. Each key must map to a list of bounding boxes, with each bounding box defined as an array of four integers: `[x1, y1, x2, y2]` (pixel coordinates, where (x1, y1) is the top-left corner and (x2, y2) is the bottom-right corner).

        **Important**:
        - Return ONLY the bounding box coordinate directly
        - You are not allowed to return other suggestions or code to generate the bounding boxes through other programs.
        - The image has a top-left origin. X increases to the right, and Y increases downward.
        - Return only the JSON object. Do **not** include any text, comments, or additional keys.
        - If no objects of a category are detected, return an empty list for that category.

        **Example output (structure only, placeholder values):**
        {
        "Platelets": [[...], [...]],
        "RBC": [[...], [...]],
        "WBC": [[...], [...]]
        }
        ---
        """
    )

    DETECTION_MALARIA = (
        """
        You will be given a microscopic cell image from a stained blood smear. Your task is to get bounding boxes around the following three categories of blood components:

        1. **gametocyte**: Typically crescent or banana-shaped.
        2. **leukocyte**: Large, round or irregular shape, often with internal texture.
        3. **schizont**: Round or oval, may appear as a cluster inside a red cell.
        4. **red blood cell**: Smooth, round, and uniform with no internal structures.
        5. **ring**: Small ring-like shape, usually inside a red cell.
        6. **trophozoite**: Irregular shape with more solid or filled appearance than a ring.

        Return **only** a JSON object with exactly these three keys: `gametocyte`, `leukocyte`, `schizont`, `red blood cell`, `ring`, `trophozoite`. Each key must map to a list of bounding boxes, with each bounding box defined as an array of four integers: `[x1, y1, x2, y2]` (pixel coordinates, where (x1, y1) is the top-left corner and (x2, y2) is the bottom-right corner).

        **Important**:
        - The image has a top-left origin. X increases to the right, and Y increases downward.
        - Return only the JSON object. Do **not** include any text, comments, or additional keys.
        - If no objects of a category are detected, return an empty list for that category.

        
        You are forced to generate the bounding box and not allowed to return other suggestions or code to generate the bounding boxes through other programs.
        **Example output (structure only, placeholder values):**
        {
        "gametocyte": [[...], [...]],
        "leukocyte": [[...], [...]],
        "schizont": [[...], [...]],
        "red blood cell": [[...], [...]],
        "ring": [[...], [...]],
        "trophozoite": [[...], [...]]
        }
        """
    )

    DETECTION_NIH = (
        """
        You will be given a microscopic cell image from a NIH-3T3 microscopy. Your task is to get draw bounding boxes around the following three categories of cell shape components components:

        1. **Round**: Cells appear circular, and sometimes with smooth edges.
        2. **Spindle**: Cells are elongated and tapered, resembling a spindle or stretched ellipse.
        3. **Polygonal**: Cells have multiple angles or sides.

        Return **only** a JSON object with exactly these three keys: `Round`, `Spindle`, `Polygonal`. Each key must map to a list of bounding boxes, with each bounding box defined as an array of four integers: `[x1, y1, x2, y2]` (pixel coordinates, where (x1, y1) is the top-left corner and (x2, y2) is the bottom-right corner).

        **Important**:
        - Return the bounding box coordinate; you are not allowed to return other suggestions or code to generate the bounding boxes through other programs.
        - The image has a top-left origin. X increases to the right, and Y increases downward.
        - Return only the JSON object. Do **not** include any text, comments, or additional keys.
        - If no objects of a category are detected, return an empty list for that category.

        **Example output (structure only, placeholder values):**
        {
        "Round": [[...], [...]],
        "Spindle": [[...], [...]],
        "Polygonal": [[...], [...]]
        }
        """
    )

    DETECTION_RATC6 = (
        """
        You will be given a microscopic cell image. Your task is to get bounding boxes around the following three categories of cell shape components components:

        1. **Round**: Cells appear circular, and sometimes with smooth edges.
        2. **Spindle**: Cells are elongated and tapered, resembling a spindle or stretched ellipse.
        3. **Polygonal**: Cells have multiple angles or sides.

        Return **only** a JSON object with exactly these three keys: `Round`, `Spindle`, `Polygonal`. Each key must map to a list of bounding boxes, with each bounding box defined as an array of four integers: `[x1, y1, x2, y2]` (pixel coordinates, where (x1, y1) is the top-left corner and (x2, y2) is the bottom-right corner).

        **Important**:
        - Return the bounding box coordinate; you are not allowed to return other suggestions or code to generate the bounding boxes through other programs.
        - The image has a top-left origin. X increases to the right, and Y increases downward.
        - Return only the JSON object. Do **not** include any text, comments, or additional keys.
        - If no objects of a category are detected, return an empty list for that category.

        **Example output (structure only, placeholder values):**
        {
        "Round": [[12, 34, 56, 78], [91, 102, 110, 123]],
        "Spindle": [[...], [...]],
        "Polygonal": [[...]]
        }
        """
    )


    # mapping helper ---------------------------------------------------
    MAP = {
        "BCCD": DETECTION_BCCD,
        "malaria": DETECTION_MALARIA,
        "NIH-3T3": DETECTION_NIH,
        "RatC6": DETECTION_RATC6
    }


class schemas:
    BCCD = {
        "type": "object",
        "properties": {
            "Platelets": {
                "type": "array",
                "items": {
                    "type": "array",
                    "items": {"type": "integer"},
                    "minItems": 4, "maxItems": 4,
                },
            },
            "RBC": {
                "type": "array",
                "items": {
                    "type": "array",
                    "items": {"type": "integer"},
                    "minItems": 4, "maxItems": 4,
                },
            },
            "WBC": {
                "type": "array",
                "items": {
                    "type": "array",
                    "items": {"type": "integer"},
                    "minItems": 4, "maxItems": 4,
                },
            },
        },
        "required": ["Platelets", "RBC", "WBC"],
    }

    MALARIA = {
        "type": "object",
        "properties": {
            "gametocyte": {"type": "array", "items": {"type": "array", "items": {"type": "integer"}, "minItems": 4, "maxItems": 4}},
            "leukocyte": {"type": "array", "items": {"type": "array", "items": {"type": "integer"}, "minItems": 4, "maxItems": 4}},
            "schizont": {"type": "array", "items": {"type": "array", "items": {"type": "integer"}, "minItems": 4, "maxItems": 4}},
            "red blood cell": {"type": "array", "items": {"type": "array", "items": {"type": "integer"}, "minItems": 4, "maxItems": 4}},
            "ring": {"type": "array", "items": {"type": "array", "items": {"type": "integer"}, "minItems": 4, "maxItems": 4}},
            "trophozoite": {"type": "array", "items": {"type": "array", "items": {"type": "integer"}, "minItems": 4, "maxItems": 4}},
        },
        "required": ["gametocyte", "leukocyte", "schizont", "red blood cell", "ring", "trophozoite"],
    }

    NIH = {
        "type": "object",
        "properties": {
            "Round": {"type": "array", "items": {"type": "array", "items": {"type": "integer"}, "minItems": 4, "maxItems": 4}},
            "Spindle": {"type": "array", "items": {"type": "array", "items": {"type": "integer"}, "minItems": 4, "maxItems": 4}},
            "Polygonal": {"type": "array", "items": {"type": "array", "items": {"type": "integer"}, "minItems": 4, "maxItems": 4}},
        },
        "required": ["Round", "Spindle", "Polygonal"],
    }

    RATC6 = NIH  # same as NIH schema

    MAP = {
        "BCCD": BCCD,
        "malaria": MALARIA,
        "NIH": NIH,
        "RATC6": RATC6,
    }



class config:
    # -------- VLM backend --------------------------------------------
    model_type   = "anthropic"                  # {"gpt", "gemini"}
    vlm          = "claude-3-7-sonnet-latest"    # model name / version
    temperature  = 1.0
    p_factor     = 1.0                     # top‑p / nucleus sampling
    thinking_budget = 2048          # for gemini: 0#no #-1 dynamic

    # -------- runtime options -----------------------------------------
    save_overlays = True                  # draw coloured boxes for qualitative checks
    shot          = 6                     # few‑shot examples not used by default

    # feel free to extend with additional flags (rate limits, retries…)
