"""
GoFlexi — Manual Nugen Inference Test Script

This script sends a single test message to the deployed Nugen aligned model
and prints the structured TravelIntentResult.

PREREQUISITES:
  - NUGEN_ENABLED=true in backend/.env
  - NUGEN_API_KEY set in backend/.env
  - NUGEN_MODEL_ID set to the deployed aligned model ID in backend/.env

DO NOT run this script with the current failed alignment projects.
DO NOT substitute another model.
DO NOT use this in automated CI.

Usage:
    cd backend
    py -3.14 scripts/test_nugen_inference.py
"""

import os
import sys
import asyncio
from pathlib import Path

# Ensure backend is importable
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv(backend_dir / ".env")


async def main():
    from app.services.nugen_service import (
        nugen_service,
        NugenDisabledError,
        NugenConfigurationError,
        NugenInferenceError,
    )

    print("=" * 60)
    print("GOFLEXI — NUGEN INFERENCE TEST")
    print("=" * 60)

    if not nugen_service.enabled:
        print("\nNUGEN_ENABLED is not true.")
        print("Set NUGEN_ENABLED=true in backend/.env to run this test.")
        sys.exit(1)

    if not nugen_service.model_id:
        print("\nNUGEN_MODEL_ID is not set.")
        print("Set NUGEN_MODEL_ID to the deployed aligned model ID in backend/.env.")
        sys.exit(1)

    print(f"\nBase URL:  {nugen_service.base_url}")
    print(f"Model ID:  {nugen_service.model_id}")
    print(f"API Key:   {'*' * (len(nugen_service.api_key) - 6)}{nugen_service.api_key[-6:]}")

    test_message = (
        "I want a relaxed 4 day trip to Kochi with my girlfriend under 30000"
    )

    print(f"\nTest message: \"{test_message}\"")
    print("-" * 60)

    try:
        result = await nugen_service.extract_travel_intent(test_message)
        print("\n✅ Nugen Inference Succeeded!")
        print(f"\nStructured Result:")
        print(result.model_dump_json(indent=2, exclude_none=True))

        from app.services.nugen_service import map_nugen_intent_to_copilot
        copilot_intent = map_nugen_intent_to_copilot(result.intent.value)
        print(f"\nMapped Co-Pilot Intent: {result.intent.value} → {copilot_intent}")

    except NugenDisabledError as e:
        print(f"\n❌ Nugen Disabled: {e}")
    except NugenConfigurationError as e:
        print(f"\n❌ Configuration Error: {e}")
    except NugenInferenceError as e:
        print(f"\n❌ Inference Error: {e}")
        if e.status_code:
            print(f"   HTTP Status: {e.status_code}")
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
