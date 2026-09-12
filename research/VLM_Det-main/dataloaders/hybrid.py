"""
hybrid_dataloader.py
--------------------
Split-aware loader that mimics the FewShotDataset API while
returning OpenCV (BGR) or PIL images, so both the OwL-ViT and
hybrid pipelines share a unified interface.
"""
from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Dict, Generator, List, Tuple, Union

import cv2
from PIL import Image


class HybridDataLoader:
    # Map short names → canonical folder names
    DATASET_MAP = {
        "NIH": "NIH-3T3",
        "NIH-3T3": "NIH-3T3",
        "RatC6": "RatC6",
        "malaria": "malaria",
        "BCCD": "BCCD",
    }

    def __init__(
        self,
        root: Path | str,
        source: str,
        *,
        as_pil: bool = False,
        seed: int = 42,
    ) -> None:
        """
        Parameters
        ----------
        root
            Dataset root that contains the ``reference/`` and ``support/`` folders.
        source
            Dataset name or alias (e.g. "NIH", "RatC6", …).
        as_pil
            If ``True`` return ``PIL.Image.Image`` objects; otherwise return
            OpenCV ``np.ndarray`` (BGR).
        seed
            RNG seed for deterministic support-sample selection.
        """
        self.as_pil = as_pil
        self.rng = random.Random(seed)

        source = self.DATASET_MAP.get(source, source)  # alias → canonical
        root = Path(root)

        self.ref_dir = root / "reference" / source
        self.sup_dir = root / "support" / source

        if not (self.ref_dir / "annotation.jsonl").is_file():
            raise FileNotFoundError(
                f"annotation.jsonl not found in {self.ref_dir}"
            )
        if not (self.sup_dir / "annotation.jsonl").is_file():
            raise FileNotFoundError(
                f"annotation.jsonl not found in {self.sup_dir}"
            )

        # ------------------------------------------------------------------ #
        #                      Load annotations into memory                   #
        # ------------------------------------------------------------------ #
        self.ref_annots = self._read_jsonl(self.ref_dir / "annotation.jsonl")
        self.sup_annots = self._read_jsonl(self.sup_dir / "annotation.jsonl")
        self.annotations  = self.ref_annots
        self.dataset_path = str(self.ref_dir)

        # Collect unique class names once
        cls = set()
        for entry in (*self.ref_annots, *self.sup_annots):
            cls.update(entry["bbox"].keys())
        self._class_names = sorted(cls)

    # ------------------------------------------------------------------ #
    #                             Internals                              #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _read_jsonl(path: Path) -> List[Dict]:
        with open(path, "r") as f:
            return [json.loads(line) for line in f]

    def _load_image(self, base: Path, rel_path: str):
        img_path = base / rel_path
        img = cv2.imread(str(img_path))
        if img is None:
            raise FileNotFoundError(img_path)

        if self.as_pil:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            return Image.fromarray(img)
        return img  # OpenCV BGR

    @staticmethod
    def _flatten(bbox_dict: Dict) -> List[Tuple[List[int], str]]:
        """Convert {label: [[[x1,y1],[x2,y2]], …]} → [(box, label), …]"""
        flat = []
        for label, boxes in bbox_dict.items():
            for box in boxes:
                flat.append(
                    (
                        [box[0][0], box[0][1], box[1][0], box[1][1]],
                        label,
                    )
                )
        return flat

    @staticmethod
    def _nested(bbox_dict: Dict) -> List[Tuple[List[List[int]], str]]:
        """Return boxes in their original 2-point form."""
        pairs = []
        for label, boxes in bbox_dict.items():
            for box in boxes:          #  [[x1,y1],[x2,y2]]
                pairs.append((box, label))
        return pairs


    # ------------------------------------------------------------------ #
    #                             Public API                             #
    # ------------------------------------------------------------------ #

    def __len__(self) -> int:
        """Number of **reference** images available."""
        return len(self.ref_annots)

    def __getitem__(
        self, idx_n: Union[int, Tuple[int, int]]
    ) -> Tuple:
        """
        Returns
        -------
        reference_img
            The image from the *reference* split.
        ref_annotations
            List of ``(box, label)`` pairs for that image.
        extras
            List of ``extra_n`` tuples ``(support_img, support_annotations)``.
        """
        idx, extra_n = (idx_n if isinstance(idx_n, tuple) else (idx_n, 0))

        ref_entry = self.ref_annots[idx]
        ref_img = self._load_image(self.ref_dir, ref_entry["image_path"])
        ref_labels = self._flatten(ref_entry["bbox"])

        extras = []
        if extra_n > 0 and self.sup_annots:
            sup_indices = list(range(len(self.sup_annots)))
            self.rng.shuffle(sup_indices)
            for sid in sup_indices[:extra_n]:
                sup_entry = self.sup_annots[sid]
                sup_img = self._load_image(self.sup_dir, sup_entry["image_path"])
                sup_labels = self._nested(sup_entry["bbox"])
                extras.append((sup_img, sup_labels))

        return ref_img, ref_labels, extras

    def generator(
            self,
            extra_n: int = 0,
            *,
            extra_N: int | None = None,   # ← compatibility alias
    ) -> Generator:
        """
        Iterate over the reference split.

        Parameters
        ----------
        extra_n / extra_N
            Number of support samples to attach to each reference image.
            Both names are accepted so existing code can pass ``extra_N``.
        """
        if extra_N is not None:
            extra_n = extra_N          # harmonise the two spellings

        for i in range(len(self)):
            yield self[(i, extra_n)]

    # ------------------------------------------------------------------ #
    #                         Helper functions                           #
    # ------------------------------------------------------------------ #

    def get_class_names(self) -> List[str]:
        """Canonical, sorted list of class labels."""
        return self._class_names
