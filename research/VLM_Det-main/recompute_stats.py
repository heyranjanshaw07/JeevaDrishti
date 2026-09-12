#!/usr/bin/env python3
"""
build_overall_stats.py  (v2)
----------------------------
Create one hierarchical JSON file (`overall_stat.json`) that holds

  • per-source  → per-class  → per-shot   metrics
  • per-source  → "__overall" per-shot macro
  • "GLOBAL"    → per-shot macro over *all* classes, all sources

Run:
python build_overall_stats.py \
        --dataset_root /path/to/dataset_53_v1 \
        --results_dir  /path/to/hybrid_results
"""
from __future__ import annotations
import argparse, json, math, re, itertools
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple

# ---------------- label canon ------------------------------------------------
_CANON = {
    r"^rbc$|red\W*blood(\W*cell)?s?$":      "Red Blood Cells",
    r"^wbc$|white\W*blood(\W*cell)?s?$":    "White Blood Cells",
    r"^plate(let)?s?$":                     "Platelets",
    r"^ring$":                              "Ring Cells",
    r"trophozoite":                         "Trophozoite Cells",
    r"schizont":                            "Schizont Cells",
    r"gametocyte":                          "Gametocyte Cells",
    r"leukocyte":                           "White Blood Cells",
    r"^round$":                             "Round Cells",
    r"^spindle$":                           "Spindle Cells",
    r"^polygonal$":                         "Polygonal Cells",
}
def canon(lbl: str) -> str:
    n = lbl.lower().strip()
    for p,t in _CANON.items():
        if re.fullmatch(p,n): return t
    return lbl.strip()

# ---------------- IoU + AP helpers ------------------------------------------
def iou(a,b): # a-> pred, b-> gt
    xa1,ya1,xa2,ya2 = a; xb1,yb1,xb2,yb2 = b
    ix1,iy1 = max(xa1,xb1),max(ya1,yb1)
    ix2,iy2 = min(xa2,xb2),min(ya2,yb2)
    iw,ih   = max(0,ix2-ix1),max(0,iy2-iy1)
    if iw==0 or ih==0: return 0.0
    ia,ib = (xa2-xa1)*(ya2-ya1),(xb2-xb1)*(yb2-yb1)
    return (iw*ih)/(ia+ib-iw*ih+1e-9)

def ap_fixed_iou(preds,gts,thr):
    if not preds: return 0.,0.,0.
    preds = sorted(preds,key=lambda x:x[1],reverse=True)
    tp=fp=0; prec=[]; rec=[]
    matched={img:[False]*len(bs) for img,bs in gts.items()}
    for img,s,pb in preds:
        best, jb = 0.,-1
        for j,gt in enumerate(gts.get(img,[])):
            cur=iou(pb,gt)
            if cur>best: best,jb=cur,j
        ok = best>=thr and jb>=0 and not matched[img][jb]
        tp+=ok; fp+= (not ok)
        if ok: matched[img][jb]=True
        prec.append(tp/(tp+fp+1e-6))
        rec.append(tp/(sum(len(v) for v in gts.values())+1e-6))
    ap=sum(max((p for p,r in zip(prec,rec) if r>=t),default=0) for t in [i/10 for i in range(11)])/11
    return ap,prec[-1] if prec else 0.,rec[-1] if rec else 0.

# ------------- flexible JSONL reader ----------------------------------------
def jload(p): return [json.loads(l) for l in p.open()]

def load_preds(rec):
    if "predictions" in rec:
        return ([p["box"] for p in rec["predictions"]],
                [p["label"] for p in rec["predictions"]],
                [p.get("score",1.0) for p in rec["predictions"]])
    if "class_label" in rec:
        boxes= rec.get("boxes") or rec.get("bbox") or rec.get("bboxes") or []
        return (boxes, [rec["class_label"]]*len(boxes),
                rec.get("scores") or [1.0]*len(boxes))
    if "boxes" in rec and "labels" in rec:
        return (rec["boxes"],rec["labels"],rec.get("scores") or [1.0]*len(rec["boxes"]))
    raise ValueError("unknown schema")

# --------------------------------------------------------------------------- #
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--dataset_root",required=True,type=Path)
    ap.add_argument("--results_dir", required=True,type=Path)
    args=ap.parse_args()

    AP_THS=(0.10,0.25,0.50)
    overall_json=defaultdict(dict)

    # containers for global aggregation
    global_sum  = defaultdict(lambda: defaultdict(float))  # shot -> metric -> sum
    global_seen = defaultdict(int)                         # shot -> class count

    for pf in sorted(args.results_dir.rglob("predictions_*shot.jsonl")):
        src   = pf.parent.name
        shot  = pf.stem.split("_")[1][:-4]   # "3" from "3shot"
        ann   = args.dataset_root/"reference"/src/"annotation.jsonl"
        if not ann.exists(): continue

        # -------- GT ----------
        gt=defaultdict(lambda:defaultdict(list))
        for r in jload(ann):
            img=Path(r["image_path"]).stem
            for cls,bs in r["bbox"].items():
                gt[cls][img].extend([[b[0][0],b[0][1],b[1][0],b[1][1]] for b in bs])

        # -------- preds -------
        pr=defaultdict(list)
        for r in jload(pf):
            img=Path(r["image_path"]).stem
            try: boxes,lbls,scores=load_preds(r)
            except ValueError: continue
            for b,l,s in zip(boxes,lbls,scores):
                pr[canon(l)].append((img,float(s),[int(x) for x in b]))

        # -------- per-class metrics ------
        src_macro=defaultdict(float)
        cls_metrics={}
        classes=set(gt)|set(pr)
        for cls in classes:
            gts, preds = gt.get(cls,{}), pr.get(cls,[])
            ious=[max((iou(pb,gtb) for gtb in gts.get(img,[])),default=0) for img,_,pb in preds]
            m={"IoU": sum(ious)/len(ious) if ious else 0.}
            for thr in AP_THS:
                ap,prc,rec = ap_fixed_iou(preds,gts,thr)
                m[f"mAP@{int(thr*100):02d}"]=ap
                if thr==0.50: m["Precision"],m["Recall"]=prc,rec
            cls_metrics[cls]=m
            for k,v in m.items(): src_macro[k]+=v

            # -------- accumulate to GLOBAL -------
            for k,v in m.items(): global_sum[shot][k]+=v
        global_seen[shot]+=len(classes)

        denom=max(1,len(classes))
        cls_metrics["__overall__"]={k:v/denom for k,v in src_macro.items()}
        overall_json[src].setdefault("__overall__",{}).update({shot:cls_metrics["__overall__"]})
        for c,met in cls_metrics.items():
            if c!="__overall__":
                overall_json[src].setdefault(c,{}).update({shot:met})
        print(f"[✓] processed {src}/{shot}shot")

    # --------------- GLOBAL ----------------
    global_metrics={}
    for shot,metric_sum in global_sum.items():
        cnt=global_seen[shot]
        global_metrics[shot]={k:v/cnt for k,v in metric_sum.items()}
    overall_json["GLOBAL"]=global_metrics

    out=args.results_dir/"overall_stat.json"
    json.dump(overall_json,out.open("w"),indent=2)
    print(f"[✓] overall_stat.json written with GLOBAL section → {out}")

if __name__=="__main__":
    main()
