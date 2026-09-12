"""
JeevaDrishti Benchmark Package
================================
Real Micro-OD evaluation pipeline: SAM proposals → VLM classification → IoU matching → metrics.

Sub-modules:
  metrics.py        — IoU, box matching, per-class P/R/F1, macro mF1
  experiment.py     — ExperimentConfig / ExperimentResult dataclasses
  dataset_loader.py — Deterministic Micro-OD annotation / image loader
  evaluator.py      — Per-image inference and evaluation
  runner.py         — Orchestration, CLI entrypoint, DB persistence
"""
