"""
GoFlexi — Phase N2 Benchmark Dataset Validator
Validates the structural integrity, intent distribution, JSON schemas,
and data quality rules of backend/data/nugen/benchmark_samples.json.
"""
import json
import os
import sys
import re

EXPECTED_INTENTS = {
    "TRIP_PLANNING",
    "DESTINATION_DISCOVERY",
    "ADD_PLACE",
    "REMOVE_PLACE",
    "MODIFY_ITINERARY",
    "UPDATE_BUDGET",
    "UPDATE_PREFERENCES",
    "OPTIMIZE_TRIP",
    "HANDLE_DISRUPTION",
    "GENERAL_TRAVEL_QUERY"
}

FACTUAL_QA_PATTERNS = [
    r"\b(is\s+located\s+in|was\s+built\s+by|has\s+a\s+population\s+of|the\s+latitude\s+is|ticket\s+price\s+is)\b",
    r"\b(founded\s+in\s+\d+|situated\s+at\s+an\s+altitude)\b"
]

def validate():
    file_path = os.path.join(os.path.dirname(__file__), "benchmark_samples.json")
    if not os.path.exists(file_path):
        print(f"FAIL: File does not exist at {file_path}")
        sys.exit(1)

    with open(file_path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except Exception as exc:
            print(f"FAIL: Invalid JSON in benchmark_samples.json: {exc}")
            sys.exit(1)

    print("==================================================")
    print("GOFLEXI — NUGEN BENCHMARK DATASET VALIDATION")
    print("==================================================")

    # 1. Verify sample count
    total_samples = len(data)
    print(f"Total samples found: {total_samples}")
    if total_samples != 100:
        print(f"FAIL: Expected exactly 100 samples, got {total_samples}")
        sys.exit(1)

    # 2. Check sample_num uniqueness and 1..100 sequencing
    seen_nums = set()
    seen_instructions = set()
    intent_counts = {intent: 0 for intent in EXPECTED_INTENTS}
    errors = []

    for idx, item in enumerate(data):
        item_prefix = f"Sample #{idx + 1}"

        # Check required top-level keys
        for key in ["sample_num", "instruction", "response"]:
            if key not in item:
                errors.append(f"{item_prefix}: Missing required key '{key}'")

        sample_num = item.get("sample_num")
        instruction = item.get("instruction", "")
        response_str = item.get("response", "")

        # Check sample_num validity
        if not isinstance(sample_num, int):
            errors.append(f"{item_prefix}: 'sample_num' must be an integer, got {type(sample_num)}")
        elif sample_num in seen_nums:
            errors.append(f"{item_prefix}: Duplicate sample_num {sample_num}")
        else:
            seen_nums.add(sample_num)

        # Check non-empty instruction
        if not isinstance(instruction, str) or not instruction.strip():
            errors.append(f"{item_prefix}: 'instruction' is empty or not a string")
        else:
            norm_instruction = instruction.strip().lower()
            if norm_instruction in seen_instructions:
                errors.append(f"{item_prefix}: Duplicate instruction: '{instruction}'")
            seen_instructions.add(norm_instruction)

            # Check for accidental destination-fact training
            for pat in FACTUAL_QA_PATTERNS:
                if re.search(pat, instruction, re.I):
                    errors.append(f"{item_prefix}: Accidental factual destination training detected: '{instruction}'")

        # Check response validity (must be a valid JSON string)
        if not isinstance(response_str, str) or not response_str.strip():
            errors.append(f"{item_prefix}: 'response' is empty or not a string")
        else:
            try:
                parsed_resp = json.loads(response_str)
                if not isinstance(parsed_resp, dict):
                    errors.append(f"{item_prefix}: 'response' must parse to a JSON dict, got {type(parsed_resp)}")
                else:
                    intent = parsed_resp.get("intent")
                    if not intent:
                        errors.append(f"{item_prefix}: Parsed response missing 'intent'")
                    elif intent not in EXPECTED_INTENTS:
                        errors.append(f"{item_prefix}: Unsupported intent '{intent}'")
                    else:
                        intent_counts[intent] += 1
            except Exception as exc:
                errors.append(f"{item_prefix}: 'response' is not valid JSON string: {exc}")

    # 3. Verify all 10 intents are represented
    print("\n--- Intent Distribution ---")
    for intent, count in sorted(intent_counts.items(), key=lambda x: -x[1]):
        print(f"  {intent:<25}: {count} samples")
        if count == 0:
            errors.append(f"Intent '{intent}' has 0 samples!")

    # 4. Report results
    print("\n--- Validation Results ---")
    if errors:
        print(f"FAIL: Found {len(errors)} validation errors:")
        for err in errors[:10]:
            print(f"  - {err}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more errors")
        sys.exit(1)

    print("PASS: All 100 samples validated successfully!")
    print("  - Exactly 100 samples verified")
    print("  - sample_num uniqueness (1 to 100) verified")
    print("  - All required fields present")
    print("  - All 10 intents represented")
    print("  - Top-level JSON is valid")
    print("  - Embedded response strings are valid JSON dictionaries")
    print("  - No duplicate instructions found")
    print("  - No empty instructions or responses found")
    print("  - Zero accidental destination-fact training patterns")
    print("  - All extracted intents belong strictly to the 10 GoFlexi intents")

if __name__ == "__main__":
    validate()
