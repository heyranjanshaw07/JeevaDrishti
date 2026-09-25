"""
Tests for unified dataset adapters.
=====================================
Validates all 5 dataset adapters across:
- validate() returns correct structure
- list_images() returns > 0 images where dataset is present
- task_type is correct for each adapter
- get_support_examples() returns <= shots items
- IoU metrics are null (cell_classification); Accuracy is null (object_detection)
- Classes match expected lists

These tests run in two modes:
1. DATASET_AVAILABLE mode: dataset present on disk → validate() must be True
2. DATASET_ABSENT mode: dataset not present → validate() must be False, no exception
"""

from __future__ import annotations

import pytest
from pathlib import Path
from typing import List

from app.services.datasets.base import TaskType
from app.services.datasets.registry import (
    DATASET_REGISTRY,
    get_adapter,
    get_adapter_safe,
    list_datasets,
    get_benchmark_dataset_ids,
    get_datasets_by_task,
)
from app.services.datasets.adapters.micro_od import MicroODAdapter
from app.services.datasets.adapters.nih_nlm_malaria import NihNlmMalariaAdapter
from app.services.datasets.adapters.c_nmc_2019 import CNmc2019Adapter
from app.services.datasets.adapters.redtell_anemia import RedtellAnemiaAdapter
from app.services.datasets.adapters.sipakmed import SipakmedAdapter


# ---------------------------------------------------------------------------
# Registry tests (always run — don't depend on physical data)
# ---------------------------------------------------------------------------

class TestRegistry:
    """Ensure registry contains all 5 expected datasets."""

    EXPECTED_IDS = {
        "micro_od",
        "nih_nlm_malaria",
        "c_nmc_2019",
        "redtell_anemia",
        "sipakmed",
    }

    def test_all_ids_registered(self):
        assert set(DATASET_REGISTRY.keys()) == self.EXPECTED_IDS

    def test_get_adapter_returns_correct_type(self):
        adapter = get_adapter("micro_od")
        assert isinstance(adapter, MicroODAdapter)

    def test_get_adapter_safe_returns_none_for_unknown(self):
        result = get_adapter_safe("nonexistent_dataset_xyz")
        assert result is None

    def test_list_datasets_returns_5_entries(self):
        entries = list_datasets()
        assert len(entries) == 5

    def test_list_datasets_has_required_fields(self):
        entries = list_datasets()
        for entry in entries:
            assert "id" in entry
            assert "display_name" in entry
            assert "task_type" in entry
            assert "classes" in entry
            assert "supported_shots" in entry
            assert entry["supported_shots"] == [0, 6], (
                f"supported_shots must be [0, 6], got {entry['supported_shots']} for {entry['id']}"
            )

    def test_get_benchmark_dataset_ids(self):
        ids = get_benchmark_dataset_ids()
        assert len(ids) == 5
        assert "micro_od" in ids
        assert "c_nmc_2019" in ids

    def test_get_datasets_by_task_detection(self):
        detection = get_datasets_by_task(TaskType.OBJECT_DETECTION)
        ids = {a.dataset_id for a in detection}
        assert "micro_od" in ids
        assert "nih_nlm_malaria" in ids
        # Classification datasets must NOT appear
        assert "c_nmc_2019" not in ids
        assert "redtell_anemia" not in ids
        assert "sipakmed" not in ids

    def test_get_datasets_by_task_classification(self):
        classification = get_datasets_by_task(TaskType.CELL_CLASSIFICATION)
        ids = {a.dataset_id for a in classification}
        assert "c_nmc_2019" in ids
        assert "redtell_anemia" in ids
        assert "sipakmed" in ids
        # Detection datasets must NOT appear
        assert "micro_od" not in ids
        assert "nih_nlm_malaria" not in ids


# ---------------------------------------------------------------------------
# Adapter property tests (always run — don't depend on physical data)
# ---------------------------------------------------------------------------

class TestAdapterProperties:
    """Verify adapter metadata properties without requiring data on disk."""

    @pytest.mark.parametrize("dataset_id,expected_task", [
        ("micro_od", TaskType.OBJECT_DETECTION),
        ("nih_nlm_malaria", TaskType.OBJECT_DETECTION),
        ("c_nmc_2019", TaskType.CELL_CLASSIFICATION),
        ("redtell_anemia", TaskType.CELL_CLASSIFICATION),
        ("sipakmed", TaskType.CELL_CLASSIFICATION),
    ])
    def test_task_type(self, dataset_id, expected_task):
        adapter = DATASET_REGISTRY[dataset_id]
        assert adapter.task_type == expected_task, (
            f"{dataset_id}: expected {expected_task}, got {adapter.task_type}"
        )

    @pytest.mark.parametrize("dataset_id,expected_classes", [
        ("micro_od", [
            "Gametocyte Cells", "Platelets", "Polygonal Cells",
            "Red Blood Cells", "Ring Cells", "Round Cells",
            "Schizont Cells", "Spindle Cells", "Trophozoite Cells", "White Blood Cells",
        ]),
        ("nih_nlm_malaria", ["Infected RBC", "Uninfected RBC"]),
        ("c_nmc_2019", ["ALL Blast", "Healthy Hematopoietic"]),
        ("redtell_anemia", ["Healthy Control", "Sickle Cell Disease", "Thalassemia"]),
        ("sipakmed", [
            "Dyskeratotic", "Koilocytotic", "Metaplastic",
            "Parabasal", "Superficial-Intermediate",
        ]),
    ])
    def test_classes(self, dataset_id, expected_classes):
        adapter = DATASET_REGISTRY[dataset_id]
        assert sorted(adapter.classes) == sorted(expected_classes), (
            f"{dataset_id}: class mismatch"
        )

    @pytest.mark.parametrize("dataset_id", list(DATASET_REGISTRY.keys()))
    def test_supported_shots_is_0_and_6_only(self, dataset_id):
        adapter = DATASET_REGISTRY[dataset_id]
        assert adapter.supported_shots == [0, 6], (
            f"{dataset_id}: supported_shots must be [0, 6]"
        )

    @pytest.mark.parametrize("dataset_id", list(DATASET_REGISTRY.keys()))
    def test_valid_metric_lists(self, dataset_id):
        adapter = DATASET_REGISTRY[dataset_id]
        valid = adapter.get_valid_metrics()
        null = adapter.get_null_metrics()
        # Verify no overlap
        overlap = set(valid) & set(null)
        assert not overlap, f"{dataset_id}: metric appears in both valid and null: {overlap}"

    def test_detection_adapters_have_null_accuracy(self):
        for adapter in get_datasets_by_task(TaskType.OBJECT_DETECTION):
            null_metrics = adapter.get_null_metrics()
            assert "accuracy" in null_metrics, (
                f"{adapter.dataset_id}: OBJECT_DETECTION must have 'accuracy' in null metrics"
            )

    def test_classification_adapters_have_null_iou(self):
        for adapter in get_datasets_by_task(TaskType.CELL_CLASSIFICATION):
            null_metrics = adapter.get_null_metrics()
            assert "iou" in null_metrics, (
                f"{adapter.dataset_id}: CELL_CLASSIFICATION must have 'iou' in null metrics"
            )

    @pytest.mark.parametrize("dataset_id", list(DATASET_REGISTRY.keys()))
    def test_get_support_examples_zero_shot(self, dataset_id):
        adapter = DATASET_REGISTRY[dataset_id]
        examples = adapter.get_support_examples(0)
        assert examples == [], f"{dataset_id}: 0-shot must return empty list"

    @pytest.mark.parametrize("dataset_id", list(DATASET_REGISTRY.keys()))
    def test_adapter_repr(self, dataset_id):
        adapter = DATASET_REGISTRY[dataset_id]
        r = repr(adapter)
        assert dataset_id in r
        assert adapter.task_type.value in r

    @pytest.mark.parametrize("dataset_id", list(DATASET_REGISTRY.keys()))
    def test_prompt_context_zero_shot(self, dataset_id):
        adapter = DATASET_REGISTRY[dataset_id]
        ctx = adapter.get_prompt_context(shots=0)
        assert ctx.dataset_id == dataset_id
        assert ctx.task_type == adapter.task_type
        assert ctx.classes == adapter.classes
        assert ctx.support_examples == []


# ---------------------------------------------------------------------------
# Disk-dependent tests (only run if dataset path exists)
# ---------------------------------------------------------------------------

def _skip_if_absent(dataset_id: str, message: str):
    """Skip test with reason if the dataset root is not available."""
    adapter = DATASET_REGISTRY[dataset_id]
    root = adapter.get_dataset_root()
    if not root.exists():
        pytest.skip(f"Dataset not available on disk: {root} — {message}")


class TestMicroODDisk:
    """Tests requiring Micro-OD data on disk."""

    def test_validate_succeeds(self):
        _skip_if_absent("micro_od", "Micro-OD dataset root not found")
        adapter = DATASET_REGISTRY["micro_od"]
        result = adapter.validate()
        assert result.is_valid, f"Validation failed: {result.errors}"

    def test_list_images_nonzero(self):
        _skip_if_absent("micro_od", "Micro-OD dataset root not found")
        adapter = DATASET_REGISTRY["micro_od"]
        images = adapter.list_images(limit=5)
        assert len(images) > 0
        for img in images:
            assert img.path.exists()

    def test_list_images_with_limit(self):
        _skip_if_absent("micro_od", "Micro-OD dataset root not found")
        adapter = DATASET_REGISTRY["micro_od"]
        images = adapter.list_images(limit=3)
        assert len(images) <= 3

    def test_support_examples_six_shot(self):
        _skip_if_absent("micro_od", "Micro-OD dataset root not found")
        adapter = DATASET_REGISTRY["micro_od"]
        examples = adapter.get_support_examples(6)
        assert len(examples) <= 6
        for ex in examples:
            assert ex.image_path.exists()
            assert ex.class_label in adapter.classes


class TestMalariaDisk:
    """Tests requiring Malaria Polygon Set data on disk."""

    def test_validate(self):
        _skip_if_absent("nih_nlm_malaria", "Malaria dataset not found")
        adapter = DATASET_REGISTRY["nih_nlm_malaria"]
        result = adapter.validate()
        assert result.is_valid, f"Validation failed: {result.errors}"

    def test_list_images_nonzero(self):
        _skip_if_absent("nih_nlm_malaria", "Malaria dataset not found")
        adapter = DATASET_REGISTRY["nih_nlm_malaria"]
        images = adapter.list_images(limit=5)
        assert len(images) > 0

    def test_load_annotations_returns_bboxes(self):
        _skip_if_absent("nih_nlm_malaria", "Malaria dataset not found")
        adapter = DATASET_REGISTRY["nih_nlm_malaria"]
        images = adapter.list_images(limit=3)
        for img in images:
            ann = adapter.load_annotations(img.image_id)
            assert ann.task_type == TaskType.OBJECT_DETECTION
            # Each bbox must be valid [x1,y1,x2,y2] with x2>x1, y2>y1
            for a in ann.annotations:
                if "bbox" in a:
                    x1, y1, x2, y2 = a["bbox"]
                    assert x2 > x1 and y2 > y1


class TestCNmcDisk:
    """Tests requiring C-NMC 2019 data on disk."""

    def test_validate(self):
        _skip_if_absent("c_nmc_2019", "C-NMC dataset not found")
        adapter = DATASET_REGISTRY["c_nmc_2019"]
        result = adapter.validate()
        assert result.is_valid, f"Validation failed: {result.errors}"

    def test_list_images_has_correct_labels(self):
        _skip_if_absent("c_nmc_2019", "C-NMC dataset not found")
        adapter = DATASET_REGISTRY["c_nmc_2019"]
        images = adapter.list_images(limit=10)
        assert len(images) > 0
        valid_labels = set(adapter.classes)
        for img in images:
            assert img.class_label in valid_labels

    def test_load_annotations_no_iou_fields(self):
        _skip_if_absent("c_nmc_2019", "C-NMC dataset not found")
        adapter = DATASET_REGISTRY["c_nmc_2019"]
        images = adapter.list_images(limit=2)
        for img in images:
            ann = adapter.load_annotations(img.image_id)
            assert ann.task_type == TaskType.CELL_CLASSIFICATION
            for a in ann.annotations:
                # Annotation should have label but NO bbox
                assert "label" in a
                assert "bbox" not in a, "CELL_CLASSIFICATION annotation must not have bbox"


class TestRedtellDisk:
    """Tests requiring RedTell data on disk."""

    def test_validate(self):
        _skip_if_absent("redtell_anemia", "RedTell dataset not found")
        adapter = DATASET_REGISTRY["redtell_anemia"]
        result = adapter.validate()
        assert result.is_valid, f"Validation failed: {result.errors}"

    def test_three_classes_found(self):
        _skip_if_absent("redtell_anemia", "RedTell dataset not found")
        adapter = DATASET_REGISTRY["redtell_anemia"]
        images = adapter.list_images(limit=20)
        found_classes = {img.class_label for img in images}
        assert len(found_classes) == 3, f"Expected 3 classes, found: {found_classes}"


class TestSipakmedDisk:
    """Tests requiring SIPaKMeD data on disk."""

    def test_validate(self):
        _skip_if_absent("sipakmed", "SIPaKMeD dataset not found")
        adapter = DATASET_REGISTRY["sipakmed"]
        result = adapter.validate()
        assert result.is_valid, f"Validation failed: {result.errors}"

    def test_five_classes_found(self):
        _skip_if_absent("sipakmed", "SIPaKMeD dataset not found")
        adapter = DATASET_REGISTRY["sipakmed"]
        images = adapter.list_images(limit=50)
        found_classes = {img.class_label for img in images}
        assert len(found_classes) == 5, f"Expected 5 classes, found: {found_classes}"

    def test_double_nested_path_resolution(self):
        """Verify that the double-nested im_*/im_*/ structure is resolved correctly."""
        _skip_if_absent("sipakmed", "SIPaKMeD dataset not found")
        from app.services.datasets.adapters.sipakmed import SipakmedAdapter, _FOLDER_TO_CLASS
        adapter = SipakmedAdapter()
        for outer_folder in _FOLDER_TO_CLASS.keys():
            inner_dir = adapter._get_class_image_dir(outer_folder)
            assert inner_dir.exists(), f"Double-nested path not found: {inner_dir}"


# ---------------------------------------------------------------------------
# Absent dataset validation (always run — validate graceful failure)
# ---------------------------------------------------------------------------

class TestValidationAbsent:
    """Verify adapters return is_valid=False without crashing when data is absent."""

    def _test_validate_returns_false_when_absent(self, dataset_id: str):
        adapter = DATASET_REGISTRY[dataset_id]
        root = adapter.get_dataset_root()
        if root.exists():
            pytest.skip(f"Dataset IS present at {root}, cannot test absent behavior")
        result = adapter.validate()
        assert result.is_valid is False
        assert len(result.errors) > 0

    def test_validate_graceful_when_absent_cnmc(self):
        self._test_validate_returns_false_when_absent("c_nmc_2019")

    def test_validate_graceful_when_absent_redtell(self):
        self._test_validate_returns_false_when_absent("redtell_anemia")

    def test_validate_graceful_when_absent_sipakmed(self):
        self._test_validate_returns_false_when_absent("sipakmed")

    def test_validate_graceful_when_absent_malaria(self):
        self._test_validate_returns_false_when_absent("nih_nlm_malaria")
