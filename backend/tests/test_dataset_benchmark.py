import pytest
from tests.conftest import client
from app.models.benchmark import BenchmarkResult


# 1. list datasets
def test_list_datasets():
    response = client.get("/api/v1/datasets")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 5
    names = [d["name"] for d in data]
    assert "Micro-OD" in names
    assert "BBBC" in names
    assert "BCCD" in names
    assert "LIVECell" in names
    assert "NIH-3T3" in names


# 2. get Micro-OD
def test_get_micro_od():
    response = client.get("/api/v1/datasets/Micro-OD")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Micro-OD"
    assert data["total_images"] == 252
    assert data["example_images"] == 40
    assert data["test_images"] == 212
    assert data["source_datasets_count"] == 4
    assert data["test_boxes"] == 5551
    assert data["status"] == "verified"
    assert len(data["source_datasets"]) == 4


# 3. get BBBC
def test_get_bbbc():
    response = client.get("/api/v1/datasets/BBBC")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "BBBC"
    assert data["test_images"] == 53
    assert data["test_boxes"] == 4000
    assert data["classes_count"] == 6
    assert len(data["classes"]) == 6
    assert data["status"] == "verified"


# 4. get BCCD
def test_get_bccd():
    response = client.get("/api/v1/datasets/BCCD")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "BCCD"
    assert data["test_images"] == 53
    assert data["test_boxes"] == 952
    assert data["classes_count"] == 3
    assert len(data["classes"]) == 3
    assert "Red Blood Cells" in data["classes"]
    assert "White Blood Cells" in data["classes"]
    assert "Platelets" in data["classes"]


# 5. get LIVECell
def test_get_livecell():
    response = client.get("/api/v1/datasets/LIVECell")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "LIVECell"
    assert data["test_images"] == 53
    assert data["test_boxes"] == 223
    assert data["classes_count"] == 3
    assert len(data["classes"]) == 3


# 6. get NIH-3T3
def test_get_nih_3t3():
    response = client.get("/api/v1/datasets/NIH-3T3")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "NIH-3T3"
    assert data["test_images"] == 53
    assert data["test_boxes"] == 376
    assert data["classes_count"] == 3
    assert len(data["classes"]) == 3


# 7. invalid dataset
def test_invalid_dataset():
    response = client.get("/api/v1/datasets/UnknownDatasetX")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "UnknownDatasetX" in data["detail"]


# 8. dataset classes
def test_dataset_classes():
    # Test BBBC classes
    response = client.get("/api/v1/datasets/BBBC/classes")
    assert response.status_code == 200
    data = response.json()
    assert data["dataset"] == "BBBC"
    assert data["total_classes"] == 6
    assert len(data["classes"]) == 6

    # Test BCCD classes
    response_bccd = client.get("/api/v1/datasets/BCCD/classes")
    assert response_bccd.status_code == 200
    data_bccd = response_bccd.json()
    assert data_bccd["dataset"] == "BCCD"
    assert data_bccd["total_classes"] == 3
    assert "Red Blood Cells" in data_bccd["classes"]


# 9. image pagination
def test_image_pagination():
    response = client.get("/api/v1/datasets/Micro-OD/images?split=test&page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert "total" in data
    assert "items" in data
    assert isinstance(data["items"], list)

    # Verify no filesystem paths are exposed
    for item in data["items"]:
        assert "image_id" in item
        assert "dataset" in item
        assert "split" in item
        assert "filename" in item
        assert "size_bytes" in item
        # Ensure no full system path in fields
        assert "/" not in item["filename"]
        assert "\\" not in item["filename"]

    # Test example split
    response_example = client.get("/api/v1/datasets/Micro-OD/images?split=example&page=1&page_size=20")
    assert response_example.status_code == 200
    data_example = response_example.json()
    assert data_example["page"] == 1

    # Test invalid split
    response_invalid = client.get("/api/v1/datasets/Micro-OD/images?split=invalid_split")
    assert response_invalid.status_code == 400


# 10. benchmark config
def test_benchmark_config():
    response = client.get("/api/v1/benchmark/config")
    assert response.status_code == 200
    data = response.json()
    assert "datasets" in data
    assert "shot_configs" in data
    assert "metrics" in data
    assert data["shot_configs"] == [0, 6]
    assert "Micro-OD" in data["datasets"]
    assert "mF1" in data["metrics"]
    assert "Precision" in data["metrics"]
    assert "Recall" in data["metrics"]
    assert "IoU" in data["metrics"]
    assert "Latency" in data["metrics"]
    assert "VLM Calls" in data["metrics"]


# 11. benchmark results when empty
def test_benchmark_results_when_empty():
    response = client.get("/api/v1/benchmark/results")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["status"] == "not_evaluated"


# 12. benchmark summary
def test_benchmark_summary():
    response = client.get("/api/v1/benchmark/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "not_evaluated"
    assert data["datasets"] in (4, 5)
    assert data["shot_configs"] == [0, 6]


# 13. invalid shot value
def test_invalid_shot_value():
    for bad_shot in [1, 3, 99]:
        response = client.get(f"/api/v1/benchmark/results?shots={bad_shot}")
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Unsupported shots filter" in data["detail"]


# Additional: BenchmarkResult model and query validation
def test_benchmark_results_stored(db_session):
    # Verify that BenchmarkResult allows nullable metrics
    res = BenchmarkResult(
        dataset="Micro-OD",
        shots=0,
        mf1=None,
        precision=None,
        recall=None,
        iou=None,
        latency=None,
        vlm_calls=None,
    )
    db_session.add(res)
    db_session.commit()
    db_session.refresh(res)

    response = client.get("/api/v1/benchmark/results?dataset=Micro-OD&shots=0")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["status"] == "evaluated"
    item = data["items"][0]
    assert item["dataset"] == "Micro-OD"
    assert item["shots"] == 0
    assert item["mf1"] is None
    assert item["precision"] is None
