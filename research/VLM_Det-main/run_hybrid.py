from pathlib import Path
from hybrid import HybridDetector

det = HybridDetector(
    dataset_root = Path("/work/mech-ai-scratch/shreyang/FSOD/sampled_dataset/dataset_53_v1"),
    output_dir   = Path("./results/hybrid_results_qwen_2_5_7b_vl"),
    shots        = (1, 3, 6),
    use_precomputed_boxes = True,
    precomputed_box_dir = "sampled_dataset/dataset_53_v1/reference/precomputed_masks/b336dafc",
    max_images = 15
    #sources = ["BCCD", "malaria"]
    # rpn_cfg      = {"BCCD": {"top_n": 50, "padding": 5}},  # optional
)
det.run()


"""
HYBRID EXPERIMENTS:
GPT-4o -> All done
GPT-o4_mini -> All Done
Claude 3.7 20250219 -> All Done
Claude 3.7 20250219 (Thinking) -> 3 done, "malaria" left.
Gemini 2.5 Flash -> Next
Gemini 2.5 Flash (Thinking) -> Next

EXPERIMENT 1:
OwL-ViT -> All done

EXPERIMENT 3:
OwL-ViT -> All Done


EXPERIMENT 2:
GPT-4o -> 
GPT-o4_mini -> 
Claude 3.7 20250219 -> 
Claude 3.7 20250219 (Thinking) -> 
Gemini 2.5 Flash -> 
Gemini 2.5 Flash (Thinking) -> 
"""