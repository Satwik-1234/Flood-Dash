from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn, os, math, json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Pravhatattva ML Intelligence API",
    description="Flood prediction engine for Pravhatattva · Built by Satwik Laxmikamalakar Udupi",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://satwik-1234.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── INPUT SCHEMAS ─────────────────────────────────────────────────────────

class HydrologicalParams(BaseModel):
    rainfall_24h_mm:          float
    river_level_m:            float
    danger_level_m:           float
    soil_moisture_index:      float  # 0.0 dry → 1.0 saturated
    elevation_m:              float
    rainfall_intensity_mmphr: float = 0.0  # Peak 1-hour intensity


class SCSCNRequest(BaseModel):
    rainfall_mm:    float
    cn_ii:          float  # Base curve number (AMC-II)
    api_5day_mm:    float  # 5-day antecedent precipitation index


# ─── SCS-CN PHYSICS ENGINE ─────────────────────────────────────────────────

def compute_amc_class(api_5day: float) -> str:
    if api_5day < 36: return 'I'
    if api_5day < 53: return 'II'
    return 'III'

def adjust_cn_for_amc(cn_ii: float, amc: str) -> float:
    if amc == 'I':   return (4.2 * cn_ii) / (10 - 0.058 * cn_ii)
    if amc == 'III': return (23 * cn_ii)  / (10 + 0.13 * cn_ii)
    return cn_ii

def scs_cn_runoff(rainfall_mm: float, cn_ii: float, amc: str) -> dict:
    cn  = max(1, min(99, adjust_cn_for_amc(cn_ii, amc)))
    S   = (25400 / cn) - 254
    Ia  = 0.2 * S
    Q   = max(0, ((rainfall_mm - Ia) ** 2) / (rainfall_mm + 0.8 * S)) \
          if rainfall_mm > Ia else 0
    ratio = Q / rainfall_mm if rainfall_mm > 0 else 0
    return {
        "cn_ii":         round(cn_ii, 1),
        "cn_adjusted":   round(cn, 1),
        "amc_class":     amc,
        "S_mm":          round(S, 1),
        "rainfall_P_mm": round(rainfall_mm, 1),
        "runoff_Q_mm":   round(Q, 1),
        "runoff_ratio":  round(ratio, 3),
    }


# ─── ML PREDICTION ENGINE ──────────────────────────────────────────────────

def flood_inference(params: HydrologicalParams) -> dict:
    """
    Logistic flood risk predictor.
    Feature engineering mirrors the XGBoost feature set from Pravhatattva v3 spec.
    When ONNX models are available, replace this function body with onnxruntime call.
    """
    # Compute SCS-CN effective runoff as primary rainfall feature
    # Approximate AMC from soil moisture index (0→I, 0.5→II, 1.0→III)
    api_proxy = params.soil_moisture_index * 80  # rough API proxy from SMI
    amc       = compute_amc_class(api_proxy)
    scscn     = scs_cn_runoff(params.rainfall_24h_mm, 78.0, amc)  # CN=78 default

    level_ratio    = params.river_level_m / params.danger_level_m \
                     if params.danger_level_m > 0 else 0
    runoff_factor  = (scscn["runoff_Q_mm"] / 200.0)  # Use Q not raw P
    topo_factor    = max(0, 1 - (params.elevation_m / 800.0))
    intensity_fac  = min(1, params.rainfall_intensity_mmphr / 50.0)

    # Logistic regression with calibrated weights
    z = (4.5 * level_ratio) + (3.5 * runoff_factor) \
      + (1.5 * topo_factor)  + (2.0 * intensity_fac) - 4.0

    prob    = 1.0 / (1.0 + math.exp(-z))
    prob_pct = round(prob * 100, 2)

    if prob_pct > 85: level, label = 5, "EMERGENCY"
    elif prob_pct > 65: level, label = 4, "ALERT"
    elif prob_pct > 40: level, label = 3, "WARNING"
    elif prob_pct > 20: level, label = 2, "WATCH"
    else:               level, label = 1, "NORMAL"

    return {
        "probability_pct": prob_pct,
        "risk_level":      level,
        "risk_label":      label,
        "scscn":           scscn,
        "factors": {
            "river_saturation_pct":      round(level_ratio * 100, 1),
            "runoff_intensity_pct":      round(runoff_factor * 100, 1),
            "topography_susceptibility": round(topo_factor * 100, 1),
            "intensity_compound_pct":    round(intensity_fac * 100, 1),
        },
        "model": "HydroLogit-v3.0 (SCS-CN enhanced)",
    }


# ─── ROUTES ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status":  "online",
        "version": "3.0.0",
        "models":  ["HydroLogit-SCSCNv3"],
        "service": "Pravhatattva ML API",
        "author":  "Satwik Laxmikamalakar Udupi",
    }


@app.post("/api/predict")
async def predict(params: HydrologicalParams):
    try:
        if params.rainfall_24h_mm < 0 or params.river_level_m < 0:
            raise ValueError("Physical parameters cannot be negative.")
        result = flood_inference(params)
        return {"status": "success", "prediction": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/scscn")
async def scscn_endpoint(req: SCSCNRequest):
    """Standalone SCS-CN runoff calculation endpoint."""
    amc    = compute_amc_class(req.api_5day_mm)
    result = scs_cn_runoff(req.rainfall_mm, req.cn_ii, amc)
    return {"status": "success", "scscn": result}


@app.get("/api/stations")
async def get_stations():
    """
    Serve the latest CWC station data from the mock output directory.
    In production this reads from the scraper output path.
    """
    mock_path = Path(os.getenv("MOCK_OUTPUT_DIR", "frontend/public/mock")) \
                / "cwc_stations.json"
    if mock_path.exists():
        return json.loads(mock_path.read_text())
    raise HTTPException(status_code=503, detail="Station data not yet available")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
