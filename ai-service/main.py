from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from model import predictor

app = FastAPI(
    title="SmartQ AI Waiting-Time Prediction Service",
    description="Machine Learning service powered by scikit-learn for predicting queue wait times",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueuePredictionRequest(BaseModel):
    people_ahead: int = Field(..., ge=0, description="Number of tokens waiting ahead of user")
    queue_length: int = Field(default=1, ge=0, description="Total active queue length for service")
    service_prefix: Optional[str] = Field(default="GEN", description="Service prefix code")
    historical_avg_duration: float = Field(default=5.0, gt=0, description="Historical avg minutes per customer")
    current_service_speed: float = Field(default=1.0, gt=0, description="Serving speed multiplier")
    hour_of_day: Optional[int] = Field(default=None, ge=0, le=23)
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)

class PredictionResponse(BaseModel):
    predicted_wait_time_mins: float
    confidence_score: float
    expected_completion_time: str
    model_type: str
    factors: dict

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "SmartQ AI Prediction Engine",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict-wait-time", response_model=PredictionResponse)
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

        return PredictionResponse(
            predicted_wait_time_mins=wait_mins,
            confidence_score=result["confidence_score"],
            expected_completion_time=expected_time_str,
            model_type=result["model_type"],
            factors=result["factors"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
