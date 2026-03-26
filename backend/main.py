# backend/main.py
"""
Pravhatattva API v4.0 — FastAPI + WebSocket + TimescaleDB
REST endpoints serve live station data from PostgreSQL.
WebSocket endpoint pushes real-time updates via Redis pub/sub.
ML prediction endpoints retained from v3.0.
"""
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio, json, os, math
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Pravhatattva API",
    description="Flood Intelligence Engine v4.0 — Built by Satwik Laxmikamalakar Udupi",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Database (lazy init — works both with and without Docker) ────────────────
_engine = None

def get_engine():
    global _engine
    if _engine is None:
        db_url = os.getenv('DATABASE_URL')
        if db_url:
            from sqlalchemy import create_engine
            _engine = create_engine(db_url)
    return _engine

# ── Redis (lazy init) ────────────────────────────────────────────────────────
_redis = None

async def get_redis():
    global _redis
    if _redis is None:
        redis_url = os.getenv('REDIS_URL')
        if redis_url:
            import redis.asyncio as aioredis
            _redis = aioredis.from_url(redis_url)
    return _redis


# ─── INPUT SCHEMAS ─────────────────────────────────────────────────────────

class HydrologicalParams(BaseModel):
    rainfall_24h_mm:          float
    river_level_m:            float
    danger_level_m:           float
    soil_moisture_index:      float  # 0.0 dry → 1.0 saturated
    elevation_m:              float
    rainfall_intensity_mmphr: float = 0.0


class SCSCNRequest(BaseModel):
    rainfall_mm:    float
    cn_ii:          float
    api_5day_mm:    float


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
    api_proxy = params.soil_moisture_index * 80
    amc       = compute_amc_class(api_proxy)
    scscn     = scs_cn_runoff(params.rainfall_24h_mm, 78.0, amc)

    level_ratio    = params.river_level_m / params.danger_level_m \
                     if params.danger_level_m > 0 else 0
    runoff_factor  = (scscn["runoff_Q_mm"] / 200.0)
    topo_factor    = max(0, 1 - (params.elevation_m / 800.0))
    intensity_fac  = min(1, params.rainfall_intensity_mmphr / 50.0)

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
        "model": "HydroLogit-v4.0 (SCS-CN enhanced)",
    }


# ─── ROUTES ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status":  "online",
        "version": "4.0.0",
        "models":  ["HydroLogit-SCSCNv4"],
        "service": "Pravhatattva API",
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
    amc    = compute_amc_class(req.api_5day_mm)
    result = scs_cn_runoff(req.rainfall_mm, req.cn_ii, amc)
    return {"status": "success", "scscn": result}


# ── REST: live stations from database ───────────────────────────────────────
@app.get("/api/stations")
async def get_stations():
    engine = get_engine()
    if engine:
        from sqlalchemy import text
        with engine.connect() as conn:
            rows = conn.execute(text('''
              SELECT s.*, w.level_m, w.trend, w.time as last_reading
              FROM stations s
              LEFT JOIN LATERAL (
                SELECT level_m, trend, time FROM water_levels
                WHERE station_code = s.station_code
                ORDER BY time DESC LIMIT 1
              ) w ON TRUE
            ''')).mappings().all()
        return [dict(r) for r in rows]
    else:
        # Fallback to mock JSON when running without Docker/DB
        mock_path = Path(os.getenv("MOCK_OUTPUT_DIR", "frontend/public/mock")) \
                    / "cwc_stations.json"
        if mock_path.exists():
            return json.loads(mock_path.read_text())
        raise HTTPException(status_code=503, detail="Station data not yet available")


# ── REST: 72-hour hydrograph for one station ─────────────────────────────────
@app.get("/api/stations/{code}/hydrograph")
async def get_hydrograph(code: str):
    engine = get_engine()
    if not engine:
        raise HTTPException(status_code=503, detail="Database not configured")
    from sqlalchemy import text
    with engine.connect() as conn:
        rows = conn.execute(text('''
          SELECT time, level_m, trend FROM water_levels
          WHERE station_code = :code
            AND time > NOW() - INTERVAL '72 hours'
          ORDER BY time ASC
        '''), {'code': code}).mappings().all()
    return [dict(r) for r in rows]


# ── REST: IMD warnings ──────────────────────────────────────────────────────
@app.get("/api/warnings")
async def get_warnings():
    engine = get_engine()
    if engine:
        from sqlalchemy import text
        with engine.connect() as conn:
            rows = conn.execute(text('''
              SELECT * FROM imd_warnings
              WHERE is_stale = FALSE
              ORDER BY issued_at DESC
              LIMIT 50
            ''')).mappings().all()
        return [dict(r) for r in rows]
    else:
        mock_path = Path(os.getenv("MOCK_OUTPUT_DIR", "frontend/public/mock")) \
                    / "imd_district_warnings.json"
        if mock_path.exists():
            return json.loads(mock_path.read_text())
        return []


# ── REST: Radar metadata from Redis cache ────────────────────────────────────
@app.get("/api/radar")
async def get_radar():
    redis = await get_redis()
    if redis:
        data = await redis.get('radar_metadata')
        if data:
            return json.loads(data)
    return {"radar": {"past": [], "nowcast": []}}


# ── WebSocket: push data to browser in real time ─────────────────────────────
@app.websocket("/ws/telemetry")
async def ws_telemetry(ws: WebSocket):
    await ws.accept()
    redis = await get_redis()
    if not redis:
        await ws.close(code=1011, reason="Redis not configured")
        return

    pubsub = redis.pubsub()
    await pubsub.subscribe('cwc_update', 'imd_update')
    try:
        async for msg in pubsub.listen():
            if msg['type'] == 'message':
                await ws.send_text(msg['data'].decode() if isinstance(msg['data'], bytes) else msg['data'])
    except WebSocketDisconnect:
        await pubsub.unsubscribe()
    except Exception:
        await pubsub.unsubscribe()


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
