"""
Error Class 8: Async/Sync Confusion

Python/pandas has no async-aware DataFrame operations. Mixing async
functions into DataFrame workflows requires manual await handling.
There is no type-level distinction between sync and async transforms.
"""
import pandas as pd
import asyncio

meds = pd.read_csv("fixtures/medications.csv")


async def lookup_drug_interaction(drug_name: str) -> str:
    """Simulates an async API call."""
    return f"No interactions found for {drug_name}"


# ── PROBLEM 8a: No async support in pandas ──────────────────────────────
# pandas .apply() does not support async functions. If you pass one,
# it returns a column of coroutine objects — not the actual results.
meds["interaction"] = meds["medication_name"].apply(lookup_drug_interaction)
print(meds["interaction"].iloc[0])
# Prints: <coroutine object lookup_drug_interaction at 0x...>
# No error, no warning — just wrong data silently stored.

# ── PROBLEM 8b: Manual async loop required ──────────────────────────────
# To actually run async functions, you must manually manage the event loop.
# This is error-prone and has no type-level guardrails.
async def process_meds():
    results = []
    for _, row in meds.iterrows():
        result = await lookup_drug_interaction(row["medication_name"])
        results.append(result)
    meds["interaction"] = results

asyncio.run(process_meds())
