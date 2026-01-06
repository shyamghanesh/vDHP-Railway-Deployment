import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from pathlib import Path
import joblib

# Paths
BACKEND_DIR = Path(__file__).parent
CSV_PATH = BACKEND_DIR / "vitals.csv"
MODEL_PATH = BACKEND_DIR / "model.pkl"

# Load CSV
if not CSV_PATH.exists():
	raise FileNotFoundError(f"CSV not found at {CSV_PATH}")

df = pd.read_csv(CSV_PATH)

# Basic column resolution (expects these columns to exist)
required_cols = [
	"HeartRate_bpm",
	"BP_Systolic",
	"BP_Diastolic",
	"Temperature_F",
	"O2_Sat",
	"RiskLevel",
]
missing = [c for c in required_cols if c not in df.columns]
if missing:
	raise ValueError(f"Missing required columns: {missing}")

X = df[["HeartRate_bpm", "BP_Systolic", "BP_Diastolic", "Temperature_F", "O2_Sat"]]
y = df["RiskLevel"].astype(str)

# Split
X_train, X_test, y_train, y_test = train_test_split(
	X, y, test_size=0.2, random_state=42, stratify=y
)

# Train
model = RandomForestClassifier(
	n_estimators=400, max_depth=None, random_state=42, class_weight="balanced_subsample"
)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# Save bundle
bundle = {
	"model": model,
	"feature_names": list(X.columns),
	"classes_": list(model.classes_),
}
joblib.dump(bundle, MODEL_PATH)
print(f"Saved model to {MODEL_PATH.resolve()}")
