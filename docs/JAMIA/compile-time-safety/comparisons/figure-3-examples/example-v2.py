import pandas as pd

labs = pd.DataFrame({
    "patient_id": ["A", "B", "C"],
    "result": [5.2, "MISSING", 7.1],
})

labs["doubled"] = labs["result"] * 2

print(labs)
