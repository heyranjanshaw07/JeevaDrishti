from __future__ import annotations

"""Few‑shot data loader for the curated cell‑image detection dataset.

Directory layout (root::Path):
    ├── reference
    │   └── <SOURCE>
    │       ├── images/
    │       ├── annotation.jsonl
    │       └── stat.txt
    └── support
        └── <SOURCE>
            ├── images/
            ├── annotation.jsonl
            └── stat.txt

The class returns, on demand, a random *reference* image plus *N* cropped
support images for a requested class label.  All images are returned as
``PIL.Image.Image`` instances.
"""

from pathlib import Path
from typing import Dict, List, Tuple, Sequence, Mapping, Any
import json
import random

from PIL import Image

__all__ = ["FewShotDataset"]


class FewShotDataset:
    """Utility class to create few‑shot episodes.

    Parameters
    ----------
    root : str | Path
        Path to the dataset root (the directory that contains the ``reference``
        and ``support`` sub‑directories).
    source : str
        One of ``{"BCCD", "malaria", "NIH-3T3", "RatC6"}``.
    rng : random.Random | None, default ``None``
        Optional random‑number generator for reproducible sampling.  If *None*,
        the global :pymod:`random` module is used.
    """

    _SPLITS = ("reference", "support")

    # ---------------------------------------------------------------------
    # Construction helpers
    # ---------------------------------------------------------------------

    def __init__(self, root: str | Path, source: str, *, rng: random.Random | None = None) -> None:
        self.root = Path(root).expanduser().resolve()
        self.source = source
        self.rng = rng or random

        self._check_structure()
        # Lazily populated caches
        self._support_annotations: Dict[str, Any] | None = None
        self._reference_images: List[Path] | None = None
        self._classes: List[str] | None = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def sample_episode(self, class_label: str, n_shots: int) -> Tuple[Image.Image, List[Image.Image]]:
        """Return one reference image and *n_shots* cropped support patches.

        Parameters
        ----------
        class_label : str
            Target class from which to sample the support crops.
        n_shots : int
            Number of support crops to return.  Must not exceed the number of
            available bounding boxes for *class_label*; otherwise, a
            :class:`ValueError` is raised.

        Returns
        -------
        reference_img : PIL.Image.Image
            A randomly chosen image from the *reference* split.
        crops : list[PIL.Image.Image]
            A list of *n_shots* cropped patches, extracted from images in the
            *support* split according to the dataset annotations.
        """
        # Select reference image
        ref_path = self._random_reference_image()
        reference_img = Image.open(ref_path).convert("RGB")

        # Build support annotations cache on first use
        if self._support_annotations is None:
            self._support_annotations = self._load_annotations(split="support")

        # Gather all boxes for the desired class label
        boxes: List[Tuple[Path, Tuple[int, int, int, int]]] = []
        for img_path, ann in self._support_annotations.items():
            for tlbr in ann.get(class_label, []):
                (x1, y1), (x2, y2) = tlbr  # top‑left, bottom‑right
                boxes.append((img_path, (x1, y1, x2, y2)))

        if len(boxes) < n_shots:
            raise ValueError(
                f"Requested {n_shots} shots for class '{class_label}', but only {len(boxes)} available."
            )

        selected_boxes = self.rng.sample(boxes, k=n_shots)
        crops: List[Image.Image] = []
        for img_path, (x1, y1, x2, y2) in selected_boxes:
            img = Image.open(img_path).convert("RGB")
            crop = img.crop((x1, y1, x2, y2))
            crops.append(crop)

        return reference_img, crops

    # ------------------------------------------------------------------
    # Utility helpers
    # ------------------------------------------------------------------

    def get_classes(self) -> List[str]:
        """Return the set of class labels present in *this* source.

        The result is cached after the first computation.
        """
        if self._classes is None:
            anno = self._load_annotations(split="support")  # either split has same label space
            labels: set[str] = set()
            for ann in anno.values():
                labels.update(ann.keys())
            self._classes = sorted(labels)
        return list(self._classes)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _check_structure(self) -> None:
        """Verify that the expected directory tree exists."""
        missing = []
        for split in self._SPLITS:
            split_dir = self.root / split / self.source
            if not split_dir.is_dir():
                missing.append(str(split_dir))
            else:
                # must have images dir and annotation file
                if not (split_dir / "images").is_dir():
                    missing.append(str(split_dir / "images"))
                if not (split_dir / "annotation.jsonl").is_file():
                    missing.append(str(split_dir / "annotation.jsonl"))
        if missing:
            raise FileNotFoundError(
                "Dataset structure is incomplete; missing the following paths:\n" + "\n".join(missing)
            )

    def _random_reference_image(self) -> Path:
        """Return the path to a randomly chosen reference image."""
        if self._reference_images is None:
            images_dir = self.root / "reference" / self.source / "images"
            self._reference_images = sorted(images_dir.glob("*"))
            if not self._reference_images:
                raise RuntimeError("No reference images found in " + str(images_dir))
        return self.rng.choice(self._reference_images)

    def _load_annotations(self, *, split: str) -> Dict[Path, Mapping[str, Sequence[Sequence[Sequence[int]]]]]:
        """Load annotations for a given split.

        Returns
        -------
        dict
            Maps *absolute* image paths to the parsed JSON entry (dict with
            \"bbox\" mapping).
        """
        ann_file = self.root / split / self.source / "annotation.jsonl"
        annotations: Dict[Path, Mapping[str, Sequence[Sequence[Sequence[int]]]]] = {}
        with ann_file.open() as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                record = json.loads(line)
                image_rel = record["image_path"]  # e.g. "images/foo.jpg"
                img_path = self.root / split / self.source / image_rel
                annotations[img_path] = record["bbox"]
        return annotations

    # ------------------------------------------------------------------
    # Convenience dunder methods
    # ------------------------------------------------------------------

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"{self.__class__.__name__}(root='{self.root}', source='{self.source}', "
            f"n_ref_imgs={len(self._reference_images) if self._reference_images else 'unknown'})"
        )
