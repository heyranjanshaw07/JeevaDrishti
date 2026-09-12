class prompts:
    CELL_CLASSIFICATION_BCCD = """
    You will be provided with an image crop of a microscopic cell. The cropped image dimensions are {} pixels, and it should contain only one cell.

    **Your task is to classify the cell type into one of the following categories based on its visual characteristics:**

    1. **Platelets**: These are small, irregularly shaped cell fragments with no nucleus. They typically appear much smaller than other cells.
    2. **RBC** (Red Blood Cells): These are biconcave disc-shaped cells with smooth, round outlines. They generally lack a nucleus and have a uniform appearance.
    3. **WBC** (White Blood Cells): These are larger cells with prominent, multi-lobed nuclei and more granular cytoplasm. They may have irregular shapes and internal complexity.
    4. **None**: Any other shape, multiple cells, no visible cell, or ambiguous cases.

    **Guidelines:**

    - If the cell appears small and irregular with no nucleus, classify it as `Platelets`.
    - If the cell has a smooth, round shape with no visible internal structure or nucleus, classify it as `RBC`.
    - If the cell is larger, has a visible nucleus or complex internal structure, classify it as `WBC`.
    - For any other cases, classify it as `None`.

    **Response Format:**

    - Return only the exact label (`Platelets`, `RBC`, `WBC`, or `None`) as a single string.
    - Do not include any additional text, quotes, or formatting.
    """

    CELL_CLASSIFICATION_MALARIA = """
    You will be provided with an image crop of a microscopic cell from a stained blood smear. The cropped image dimensions are {} pixels, and it should contain only one cell or parasite.

    **Your task is to classify the cell or parasite type into one of the following categories based on its shape and appearance:**

    1. **gametocyte**: Typically crescent or banana-shaped.
    2. **leukocyte**: Large, round or irregular shape, often with internal texture.
    3. **schizont**: Round or oval, may appear as a cluster inside a red cell.
    4. **red blood cell**: Smooth, round, and uniform with no internal structures.
    5. **ring**: Small ring-like shape, usually inside a red cell.
    6. **trophozoite**: Irregular shape with more solid or filled appearance than a ring.
    7. **None**: Any other shape, multiple cells, no visible cell, or ambiguous cases.

    **Guidelines:**

    - If the cell matches the **gametocyte** description, classify it as `gametocyte`.
    - If the cell matches the **leukocyte** description, classify it as `leukocyte`.
    - If the cell matches the **schizont** description, classify it as `schizont`.
    - If the cell matches the **red blood cell** description, classify it as `red blood cell`.
    - If the cell matches the **ring** description, classify it as `ring`.
    - If the cell matches the **trophozoite** description, classify it as `trophozoite`.
    - If none of the above apply, or if the image is ambiguous, contains multiple cells, or no visible cell, classify it as `None`.

    **Response Format:**

    - Return only the exact label (`gametocyte`, `leukocyte`, `schizont`, `red blood cell`, `ring`, `trophozoite`, or `None`) as a single string.
    - Do not include any additional text, quotes, or formatting.
    """

    CELL_CLASSIFICATION_RATC6 = """
    You will be provided with an image crop of a microscopic cell from a microscopic image. The cropped image dimensions are {} pixels, and it should contain only one cell.

    **Your task is to classify the cell shape into one of the following categories based on its appearance:**

    1. **Round**: Cells appear circular, and sometimes with smooth edges.
    2. **Spindle**: Cells are elongated and tapered, resembling a spindle or stretched ellipse.
    3. **Polygonal**: Cells have multiple angles or sides.
    4. **None**: Any other shape, multiple cells, no visible cell, or ambiguous cases.

    **Guidelines:**
    - If the cell matches the **Round** description, classify it as `Round`.
    - If the cell matches the **Spindle** description, classify it as `Spindle`.
    - If the cell matches the **Polygonal** description, classify it as `Polygonal`.
    - For any other cases, classify it as `None`.

    **Response Format:**
    - Return only the exact label (`Round`, `Spindle`, `Polygonal`, or `None`) as a single string.
    - Do not include any additional text, quotes, or formatting.
    """

    CELL_CLASSIFICATION_NIH = """
    You will be provided with an image crop of a microscopic cell from a NIH-3T3 microscopy image. The cropped image dimensions are {} pixels, and it should contain only one cell.

    **Your task is to classify the cell shape into one of the following categories based on its appearance:**

    1. **Round**: Cells appear circular, and sometimes with smooth edges.
    2. **Spindle**: Cells are elongated and tapered, resembling a spindle or stretched ellipse.
    3. **Polygonal**: Cells have multiple angles or sides.
    4. **None**: Any other shape, multiple cells, no visible cell, or ambiguous cases.

    **Guidelines:**
    - If the cell matches the **Round** description, classify it as `Round`.
    - If the cell matches the **Spindle** description, classify it as `Spindle`.
    - If the cell matches the **Polygonal** description, classify it as `Polygonal`.
    - For any other cases, classify it as `None`.

    **Response Format:**
    - Return only the exact label (`Round`, `Spindle`, `Polygonal`, or `None`) as a single string.
    - Do not include any additional text, quotes, or formatting.
    """

class config:
    # ---- few-shot settings --------------------------------------------------
    shot            = 6          # default K-shot for Classifier; can over-written through main
    support_images  = 50         # how many support images to sample

    # ---- SAM-RPN ------------------------------------------------------------
    max_box         = 23         # top-N proposals
    sam_checkpoint  = "models/sam-model/sam_vit_h_4b8939.pth"
    sam_model_type  = "vit_h"
    padding         = 10         # pad each SAM box (pixels)

    # ---- VLM classifier -----------------------------------------------------
    #vlm_model_type  = "gpt"
    #vlm             = "gpt-5-2025-08-07"
    #vlm_model_type  = "gemini"
    #vlm             = "gemini-2.5-flash"
    #vlm_model_type = "together"
    #vlm = "Qwen/Qwen2.5-VL-72B-Instruct"
    #vlm_model_type  = "anthropic"
    #vlm             = "claude-3-7-sonnet-20250219"
    vlm_model_type = "qwen_local"
    vlm = "Qwen/Qwen2.5-VL-7B-Instruct"
    thinking_budget = -1 #-1 #0 # for gemini models

    # ---- few-shot support crop ---------------------------------------------
    target_size     = (128, 128)