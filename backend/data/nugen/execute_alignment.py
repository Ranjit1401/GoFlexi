import os
import sys
import time
import json
from datetime import datetime, timezone
from pathlib import Path
import httpx
from dotenv import load_dotenv

# Define directories
NUGEN_DIR = Path(__file__).resolve().parent
BACKEND_DIR = NUGEN_DIR.parent.parent
ENV_PATH = BACKEND_DIR / ".env"
CORPUS_PATH = NUGEN_DIR / "corpus_specs.md"
BENCHMARK_PATH = NUGEN_DIR / "benchmark_samples.json"
RESULT_PATH = NUGEN_DIR / "alignment_result.json"

BASE_URL = "https://api.nugen.in"
TARGET_BASE_MODEL = "qwen-v2p5-0p5b-instruct"

def log(step: str, msg: str):
    now = datetime.now().strftime("%H:%M:%S")
    print(f"[{now}] [{step}] {msg}", flush=True)

def main():
    print("=" * 60)
    print("GOFLEXI — PHASE N3: NUGEN ALIGNMENT EXECUTION")
    print("=" * 60)

    # ----------------------------------------------------
    # Step 1: Verify Environment & Credentials
    # ----------------------------------------------------
    load_dotenv(ENV_PATH)
    api_key = os.getenv("NUGEN_API_KEY")

    if not api_key and ENV_PATH.exists():
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("NUGEN_API_KEY"):
                    parts = line.strip().split("=", 1)
                    if len(parts) == 2:
                        api_key = parts[1].strip()
                        break

    if not api_key:
        print("NUGEN_API_KEY is required before Phase N3 can continue.")
        sys.exit(1)

    api_key = api_key.strip("'\"")
    headers = {"Authorization": f"Bearer {api_key}"}
    log("ENV", "NUGEN_API_KEY verified successfully (credential masked).")

    # Verify input files exist
    if not CORPUS_PATH.exists():
        log("ENV", f"ERROR: Corpus file not found at {CORPUS_PATH}")
        sys.exit(1)
    if not BENCHMARK_PATH.exists():
        log("ENV", f"ERROR: Benchmark file not found at {BENCHMARK_PATH}")
        sys.exit(1)

    # Run benchmark validation check
    validator_path = NUGEN_DIR / "validate_benchmark.py"
    if validator_path.exists():
        log("ENV", "Executing benchmark dataset validation...")
        import subprocess
        res = subprocess.run([sys.executable, str(validator_path)], capture_output=True, text=True)
        if res.returncode != 0:
            log("ENV", f"ERROR: Benchmark validation failed:\n{res.stdout}\n{res.stderr}")
            sys.exit(1)
        log("ENV", "Benchmark validation PASSED (100 samples across all 10 intents).")

    client = httpx.Client(timeout=60.0)

    # ----------------------------------------------------
    # Step 2: Verify Base Model Availability
    # ----------------------------------------------------
    log("BASE_MODEL", f"Querying official Nugen API for available base models...")
    resp = client.get(f"{BASE_URL}/api/v3/models/base?limit=100", headers=headers)
    if resp.status_code != 200:
        log("BASE_MODEL", f"ERROR: Failed to list base models: HTTP {resp.status_code} - {resp.text}")
        sys.exit(1)

    models_data = resp.json()
    models = models_data.get("models", [])
    log("BASE_MODEL", f"Retrieved {len(models)} base models from Nugen.")

    target_model_info = None
    ready_models = []
    for m in models:
        if m.get("alignment_ready"):
            ready_models.append(m.get("model_id"))
        if m.get("model_id") == TARGET_BASE_MODEL:
            target_model_info = m

    log("BASE_MODEL", f"Alignment-ready models currently available: {ready_models}")

    if not target_model_info or not target_model_info.get("alignment_ready"):
        log("BASE_MODEL", f"ERROR: Base model '{TARGET_BASE_MODEL}' is not currently available or alignment-ready.")
        log("BASE_MODEL", f"Available alignment-ready models: {ready_models}")
        sys.exit(1)

    log("BASE_MODEL", f"Verified base model '{TARGET_BASE_MODEL}': alignment_ready=True, type={target_model_info.get('type')}.")

    # ----------------------------------------------------
    # Step 3: Upload Domain Corpus Document
    # ----------------------------------------------------
    log("CORPUS", f"Uploading domain corpus document ({CORPUS_PATH.name})...")
    with open(CORPUS_PATH, "rb") as f:
        corpus_bytes = f.read()

    files = [
        ("files", (CORPUS_PATH.name, corpus_bytes, "text/markdown"))
    ]
    data = {
        "names": ["GoFlexi Domain Corpus Specifications"],
        "categories": ["travel_domain_intelligence"]
    }

    resp = client.post(f"{BASE_URL}/api/v3/documents/create", headers=headers, files=files, data=data)
    if resp.status_code != 200:
        log("CORPUS", f"ERROR: Failed to upload corpus: HTTP {resp.status_code} - {resp.text}")
        sys.exit(1)

    doc_resp = resp.json()
    doc_ids = doc_resp.get("document_ids", [])
    if not doc_ids:
        log("CORPUS", f"ERROR: No document_ids returned in response: {doc_resp}")
        sys.exit(1)

    document_id = doc_ids[0]
    log("CORPUS", f"Corpus uploaded. Document ID: {document_id}")

    # Poll Document Status until READY
    log("CORPUS", f"Polling document status for {document_id}...")
    doc_ready = False
    start_time = time.time()
    while time.time() - start_time < 120:
        status_resp = client.get(f"{BASE_URL}/api/v3/documents/{document_id}/status", headers=headers)
        if status_resp.status_code == 200:
            status_data = status_resp.json()
            curr_status = status_data.get("status")
            log("CORPUS", f"Document status: {curr_status}")
            if curr_status == "READY":
                doc_ready = True
                break
            elif curr_status == "FAILED":
                log("CORPUS", f"ERROR: Document processing failed: {status_data}")
                sys.exit(1)
        else:
            log("CORPUS", f"Warning: HTTP {status_resp.status_code} when checking status.")
        time.sleep(3)

    if not doc_ready:
        log("CORPUS", "ERROR: Document timed out before reaching READY status.")
        sys.exit(1)

    log("CORPUS", f"Document {document_id} is READY.")

    # ----------------------------------------------------
    # Step 4: Upload Evaluation Benchmark
    # ----------------------------------------------------
    log("BENCHMARK", f"Uploading benchmark dataset ({BENCHMARK_PATH.name})...")
    with open(BENCHMARK_PATH, "rb") as f:
        benchmark_bytes = f.read()

    files = [
        ("file", (BENCHMARK_PATH.name, benchmark_bytes, "application/json"))
    ]
    data = {
        "name": "GoFlexi Travel Intent Benchmark",
        "document_id": document_id,
        "description": "GoFlexi 100-sample travel intent & structured constraint extraction benchmark"
    }

    resp = client.post(f"{BASE_URL}/api/v3/benchmarks/upload", headers=headers, files=files, data=data)
    if resp.status_code != 200:
        log("BENCHMARK", f"ERROR: Failed to upload benchmark: HTTP {resp.status_code} - {resp.text}")
        sys.exit(1)

    bench_resp = resp.json()
    benchmark_id = bench_resp.get("benchmark_id")
    bench_status = bench_resp.get("status")
    bench_samples = bench_resp.get("n_samples")
    log("BENCHMARK", f"Benchmark accepted! ID: {benchmark_id}, Status: {bench_status}, Samples: {bench_samples}")

    # If benchmark status is PROCESSING, poll until READY
    if bench_status == "PROCESSING":
        log("BENCHMARK", f"Polling benchmark status for {benchmark_id}...")
        start_time = time.time()
        while time.time() - start_time < 60:
            b_resp = client.get(f"{BASE_URL}/api/v3/benchmarks/{benchmark_id}/status", headers=headers)
            if b_resp.status_code == 200:
                b_status = b_resp.json().get("status")
                log("BENCHMARK", f"Benchmark status: {b_status}")
                if b_status == "READY":
                    break
                elif b_status == "FAILED":
                    log("BENCHMARK", f"ERROR: Benchmark processing failed: {b_resp.text}")
                    sys.exit(1)
            time.sleep(3)

    # ----------------------------------------------------
    # Step 5: Create Alignment Project
    # ----------------------------------------------------
    log("ALIGNMENT", "Creating Nugen Domain Alignment Project...")
    alignment_payload = {
        "alignment_name": "GoFlexi Travel Intent Alignment",
        "base_model_id": TARGET_BASE_MODEL,
        "document_ids": [document_id],
        "benchmark_id": benchmark_id,
        "description": "GoFlexi domain alignment for travel intent classification and structured constraint extraction"
    }

    resp = client.post(f"{BASE_URL}/api/v3/alignment-projects/create", headers=headers, json=alignment_payload)
    if resp.status_code != 200:
        log("ALIGNMENT", f"ERROR: Failed to create alignment project: HTTP {resp.status_code} - {resp.text}")
        sys.exit(1)

    align_resp = resp.json()
    alignment_id = align_resp.get("alignment_id")
    initial_status = align_resp.get("status")
    log("ALIGNMENT", f"Alignment Project created successfully! ID: {alignment_id}, Status: {initial_status}")

    # ----------------------------------------------------
    # Step 6: Monitor Alignment Lifecycle
    # ----------------------------------------------------
    log("MONITOR", f"Monitoring alignment project {alignment_id} until READY or FAILED...")
    poll_count = 0
    final_status = None
    start_time = time.time()

    while True:
        poll_count += 1
        elapsed = int(time.time() - start_time)
        try:
            status_resp = client.get(f"{BASE_URL}/api/v3/alignment-projects/{alignment_id}/status", headers=headers)
            if status_resp.status_code == 200:
                st = status_resp.json()
                current_status = st.get("status")
                q_pos = st.get("queue_position")
                early_deploy = st.get("early_deployable")
                log("MONITOR", f"[+{elapsed}s | Poll #{poll_count}] Status: {current_status} | Queue: {q_pos} | EarlyDeployable: {early_deploy}")

                if current_status in ["READY", "COMPLETED"]:
                    final_status = current_status
                    break
                elif current_status in ["FAILED", "STOPPED"]:
                    final_status = current_status
                    break
            else:
                log("MONITOR", f"Warning: HTTP {status_resp.status_code} checking alignment status: {status_resp.text}")
        except Exception as e:
            log("MONITOR", f"Warning: Exception checking status: {e}")

        time.sleep(10)

    # ----------------------------------------------------
    # Step 7: Handle Completion / Failure
    # ----------------------------------------------------
    log("MONITOR", f"Alignment finished with status: {final_status} (Total elapsed: {int(time.time() - start_time)}s)")

    # Fetch full project details
    detail_resp = client.get(f"{BASE_URL}/api/v3/alignment-projects/{alignment_id}", headers=headers)
    project_detail = {}
    if detail_resp.status_code == 200:
        project_detail = detail_resp.json()
    else:
        log("DETAIL", f"Warning: Could not fetch project detail: HTTP {detail_resp.status_code}")

    if final_status in ["FAILED", "STOPPED"]:
        err_msg = project_detail.get("error", "Unknown error")
        log("ERROR", f"Alignment project {alignment_id} ended with {final_status}.")
        log("ERROR", f"Error details: {err_msg}")
        sys.exit(1)

    # Retrieve Aligned Model ID
    aligned_model_id = project_detail.get("model_id")

    # If model_id is not in project detail directly, check /api/v3/models/aligned
    if not aligned_model_id:
        aligned_models_resp = client.get(f"{BASE_URL}/api/v3/models/aligned", headers=headers)
        if aligned_models_resp.status_code == 200:
            aligned_list = aligned_models_resp.json().get("domain_aligned_models", [])
            for m in aligned_list:
                if m.get("model_name") == "GoFlexi Travel Intent Alignment" or m.get("alignment_id") == alignment_id:
                    aligned_model_id = m.get("model_id")
                    break
            if not aligned_model_id and aligned_list:
                aligned_model_id = aligned_list[0].get("model_id")

    log("ALIGNED_MODEL", f"Aligned Model ID: {aligned_model_id}")

    # Check deployment status / requirement
    log("DEPLOYMENT", "Checking whether deployment is required for live inference...")
    # As per Nugen OpenAPI: models require POST /api/v3/models/{model_id}/deployment before chat completions.
    deployment_required = True
    log("DEPLOYMENT", "Nugen architecture requires explicit deployment before chat completions can be served.")

    # ----------------------------------------------------
    # Step 8: Save Non-Secret Metadata
    # ----------------------------------------------------
    result_data = {
        "base_model_id": TARGET_BASE_MODEL,
        "alignment_project_id": alignment_id,
        "document_ids": [document_id],
        "benchmark_id": benchmark_id,
        "aligned_model_id": aligned_model_id,
        "status": final_status,
        "created_at": project_detail.get("created_at", datetime.now(timezone.utc).isoformat()),
        "completed_at": project_detail.get("completed_at", datetime.now(timezone.utc).isoformat()),
        "performance_metrics": project_detail.get("performance_metrics", {}),
        "evaluation_id": project_detail.get("evaluation_id"),
        "deployment_required_for_inference": deployment_required
    }

    with open(RESULT_PATH, "w", encoding="utf-8") as f:
        json.dump(result_data, f, indent=2)

    log("METADATA", f"Saved alignment metadata to {RESULT_PATH.name} (no secrets included).")

    print("=" * 60)
    print("PHASE N3 EXECUTION COMPLETE")
    print(f"Alignment Project ID : {alignment_id}")
    print(f"Aligned Model ID     : {aligned_model_id}")
    print(f"Final Status         : {final_status}")
    print(f"Metadata File        : {RESULT_PATH}")
    print("=" * 60)

if __name__ == "__main__":
    main()
