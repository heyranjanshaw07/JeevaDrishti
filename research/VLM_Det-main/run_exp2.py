from pathlib import Path
from exp2 import exp2_multi

exp2_multi(
    dataset_root=Path("sampled_dataset/dataset_53_v1"),
    output_dir=Path("results/exp1_claude_3_7_sonnet_thinking"),
    sources=["NIH-3T3", "BCCD", "malaria", "RatC6"], #["malaria", "RatC6"], #
    shots=[0]
)
