"""
JeevaDrishti Unified Dataset Adapter Layer
==========================================
Provides a registry of dataset adapters that abstract
dataset-specific path resolution, annotation loading,
and task-type routing across all supported microscopy datasets.

Supported canonical dataset IDs:
    micro_od        - Micro-OD (existing benchmark)
    nih_nlm_malaria - NIH-NLM Thin Blood Smears Pf
    c_nmc_2019      - C-NMC 2019 Leukemia
    redtell_anemia  - RedTell Sickle Cell & Anemia
    sipakmed        - SIPaKMeD Cervical Cytology
"""

from app.services.datasets.registry import get_adapter, list_datasets, DATASET_REGISTRY
from app.services.datasets.base import DatasetAdapter, TaskType, ValidationResult

__all__ = [
    "get_adapter",
    "list_datasets",
    "DATASET_REGISTRY",
    "DatasetAdapter",
    "TaskType",
    "ValidationResult",
]
