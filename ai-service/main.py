from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from model import predictor
from cv_detector import cv_detector
from simulation import queue_simulator

app = FastAPI(
    title="SmartQ AI, CV & Queue Simulation Microservice",
    description="Machine Learning, OpenCV Physical Queue Detection, and Monte Carlo Queue Simulation Engine",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueuePredictionRequest(BaseModel):
    people_ahead: int = Field(..., ge=0)
    queue_length: int = Field(default=1, ge=0)
    service_prefix: Optional[str] = Field(default="GEN")
    historical_avg_duration: float = Field(default=5.0, gt=0)
    current_service_speed: float = Field(default=1.0, gt=0)
    hour_of_day: Optional[int] = Field(default=None, ge=0, le=23)
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)

class SimulationRequest(BaseModel):
    current_waiting: int = Field(..., ge=0)
    active_counters: int = Field(default=1, ge=1)
    additional_counters: int = Field(default=1, ge=0)
    avg_service_time_mins: float = Field(default=5.0, gt=0)
    arrival_surge_pct: float = Field(default=0.0)

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "SmartQ AI, CV & Simulation Suite",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict-wait-time")
def predict_wait_time(request: QueuePredictionRequest):
    try:
        now = datetime.now()
        hour = request.hour_of_day if request.hour_of_day is not None else now.hour
        day = request.day_of_week if request.day_of_week is not None else now.weekday()

        result = predictor.predict(
            people_ahead=request.people_ahead,
            queue_length=request.queue_length,
            historical_avg_duration=request.historical_avg_duration,
            current_service_speed=request.current_service_speed,
            hour_of_day=hour,
            day_of_week=day
        )

        wait_mins = result["predicted_wait_time_mins"]
        expected_time = datetime.fromtimestamp(now.timestamp() + (wait_mins * 60))
        expected_time_str = expected_time.strftime("%I:%M %p")

        return {
            "predicted_wait_time_mins": wait_mins,
            "confidence_score": result["confidence_score"],
            "expected_completion_time": expected_time_str,
            "model_type": result["model_type"],
            "factors": result["factors"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate-queue")
def simulate_queue_scenario(request: SimulationRequest):
    try:
        res = queue_simulator.simulate_scenario(
            current_waiting=request.current_waiting,
            active_counters=request.active_counters,
            additional_counters=request.additional_counters,
            avg_service_time_mins=request.avg_service_time_mins,
            arrival_surge_pct=request.arrival_surge_pct
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect-physical-queue")
async def detect_physical_queue(
    file: Optional[UploadFile] = File(None),
    digital_queue_count: int = Form(0)
):
    try:
        if file:
            image_bytes = await file.read()
            return cv_detector.detect_people_from_image_bytes(image_bytes, digital_queue_count)
        else:
            return cv_detector._generate_simulated_detection(digital_queue_count, reason="No file uploaded - using camera simulator")
    except Exception as e:
        return cv_detector._generate_simulated_detection(digital_queue_count, reason=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
