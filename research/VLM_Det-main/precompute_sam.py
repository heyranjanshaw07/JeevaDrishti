# precompute_sam.py  (abbreviated)
import cv2, json, argparse, hashlib, numpy as np
from pathlib import Path
from segment_anything import SamAutomaticMaskGenerator, sam_model_registry
from dataloaders.hybrid import HybridDataLoader

def cfg_hash(d):            # -> 'e9d471a2'
    return hashlib.md5(json.dumps(d, sort_keys=True).encode()).hexdigest()[:8]

def main():
    a = parse_args()
    sam_cfg = dict(model=a.sam_model, ckpt=Path(a.sam_checkpoint).name)
    root = Path(a.save_dir) / cfg_hash(sam_cfg)
    g = SamAutomaticMaskGenerator(
            sam_model_registry[a.sam_model](checkpoint=a.sam_checkpoint).to("cuda"))

    for src in ["NIH-3T3","RatC6","malaria","BCCD"]:
        dl = HybridDataLoader(root=a.dataset_root, source=src)
        (root/src).mkdir(parents=True, exist_ok=True)
        for rec in dl.annotations:
            img_path = (Path(a.dataset_root)/"reference"/src/rec["image_path"])
            tgt = root/src/(img_path.stem+".npz")
            if tgt.exists():              # cached
                continue
            img = cv2.imread(str(img_path))
            masks = g.generate(img)
            boxes = np.array([m["bbox"] for m in masks], np.int32)        # x,y,w,h
            boxes[:,2:] += boxes[:,:2]                                     # → x1,y1,x2,y2
            iou   = np.array([m["predicted_iou"] for m in masks], np.float32)
            order = np.argsort(iou)[::-1]                                  # desc
            np.savez_compressed(tgt, boxes=boxes[order], iou=iou[order])
