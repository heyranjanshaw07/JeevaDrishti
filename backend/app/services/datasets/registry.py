"""
Dataset Adapter Registry
========================
Central registry that maps canonical dataset IDs to adapter instances.
All inference, benchmark, and API code should use get_adapter() rather
than importing adapters directly.

Usage:
    from app.services.datasets.registry import get_adapter, list_datasets

    adapter = get_adapter("c_nmc_2019")
    print(adapter.task_type)   # TaskType.CELL_CLASSIFICATION
    print(adapter.classes)     # ["ALL Blast", "Healthy Hematopoietic"]

    all_datasets = list_datasets()  # List[dict] with UI-ready metadata
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status

from app.services.datasets.base import DatasetAdapter, TaskType
from app.services.datasets.adapters.micro_od import MicroODAdapter
from app.services.datasets.adapters.nih_nlm_malaria import NihNlmMalariaAdapter
from app.services.datasets.adapters.c_nmc_2019 import CNmc2019Adapter
from app.services.datasets.adapters.redtell_anemia import RedtellAnemiaAdapter
from app.services.datasets.adapters.sipakmed import SipakmedAdapter


# ---------------------------------------------------------------------------
# Registry construction — singleton instances
# ---------------------------------------------------------------------------

DATASET_REGISTRY: Dict[str, DatasetAdapter] = {
    "micro_od": MicroODAdapter(),
    "nih_nlm_malaria": NihNlmMalariaAdapter(),
    "c_nmc_2019": CNmc2019Adapter(),
    "redtell_anemia": RedtellAnemiaAdapter(),
    "sipakmed": SipakmedAdapter(),
}


# ---------------------------------------------------------------------------
# Registry access helpers
# ---------------------------------------------------------------------------

def get_adapter(dataset_id: str) -> DatasetAdapter:
    """
    Return the adapter for the given canonical dataset ID.
    Raises HTTP 404 if the ID is not registered.
    """
    adapter = DATASET_REGISTRY.get(dataset_id)
    if adapter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Unknown dataset '{dataset_id}'. "
                f"Registered datasets: {', '.join(DATASET_REGISTRY.keys())}"
            ),
        )
    return adapter


def get_adapter_safe(dataset_id: str) -> Optional[DatasetAdapter]:
    """
    Return the adapter or None (no exception). Useful for background tasks.
    """
    return DATASET_REGISTRY.get(dataset_id)


def list_datasets() -> List[Dict[str, Any]]:
    """
    Return UI-ready metadata for all registered datasets.
    Each entry contains the fields needed by the frontend Dataset page
    and AnalysisConfig selector.
    """
    result = []
    for adapter in DATASET_REGISTRY.values():
        result.append({
            "id": adapter.dataset_id,
            "display_name": adapter.display_name,
            "description": adapter.description,
            "modality": adapter.modality,
            "domain": adapter.domain,
            "task_type": adapter.task_type.value,
            "annotation_type": adapter.annotation_type,
            "classes": adapter.classes,
            "class_count": len(adapter.classes),
            "supported_shots": adapter.supported_shots,
        })
    return result


def get_benchmark_dataset_ids() -> List[str]:
    """Return all canonical dataset IDs in the registry (for benchmark config)."""
    return list(DATASET_REGISTRY.keys())


def get_datasets_by_task(task_type: TaskType) -> List[DatasetAdapter]:
    """Return all adapters matching the given task type."""
    return [a for a in DATASET_REGISTRY.values() if a.task_type == task_type]
