import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import os
import pickle

MODEL_FILE = "queue_wait_model.pkl"

class WaitTimePredictor:
    def __init__(self):
        self.model = None
        self.is_trained = False
        self._initialize_model()

    def _generate_synthetic_training_data(self, n_samples=500):
        """Generates realistic synthetic historical queue data for training the baseline ML model."""
        np.random.seed(42)
        
        people_ahead = np.random.randint(0, 30, size=n_samples)
        queue_length = people_ahead + np.random.randint(1, 15, size=n_samples)
        historical_avg_duration = np.random.choice([4.0, 5.0, 8.0, 10.0, 12.0, 15.0], size=n_samples)
        current_service_speed = np.random.uniform(0.7, 1.4, size=n_samples) # 1.0 = normal, 1.2 = faster, 0.8 = slower
        hour_of_day = np.random.randint(8, 18, size=n_samples) # 8 AM to 6 PM
        day_of_week = np.random.randint(0, 7, size=n_samples) # 0=Monday, 6=Sunday

        # Calculate target wait time with noise and peak-hour effects
        peak_factor = np.where((hour_of_day >= 10) & (hour_of_day <= 14), 1.2, 1.0)
        weekend_factor = np.where(day_of_week >= 5, 1.15, 1.0)

        # Base wait time formula + non-linear interaction noise
        actual_wait_time = (
            (people_ahead * historical_avg_duration / current_service_speed)
            * peak_factor
            * weekend_factor
            + np.random.normal(0, 1.5, size=n_samples)
        )
        actual_wait_time = np.maximum(0.5, actual_wait_time)

        df = pd.DataFrame({
            'people_ahead': people_ahead,
            'queue_length': queue_length,
            'historical_avg_duration': historical_avg_duration,
            'current_service_speed': current_service_speed,
            'hour_of_day': hour_of_day,
            'day_of_week': day_of_week,
            'actual_wait_time': actual_wait_time
        })
        return df

    def _initialize_model(self):
        """Initializes and trains model if pickle exists or trains baseline synthetic model."""
        if os.path.exists(MODEL_FILE):
            try:
                with open(MODEL_FILE, 'rb') as f:
                    self.model = pickle.load(f)
                    self.is_trained = True
                print("Loaded existing ML Wait Time Prediction Model.")
                return
            except Exception as e:
                print(f"Error loading model file: {e}. Re-training synthetic model.")

        # Train new model
        print("Training baseline RandomForest queue prediction model...")
        df = self._generate_synthetic_training_data()
        X = df[['people_ahead', 'queue_length', 'historical_avg_duration', 'current_service_speed', 'hour_of_day', 'day_of_week']]
        y = df['actual_wait_time']

        self.model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.model.fit(X, y)
        self.is_trained = True

        with open(MODEL_FILE, 'wb') as f:
            pickle.dump(self.model, f)
        print("ML Model initialized and saved successfully.")

    def predict(self, people_ahead: int, queue_length: int, historical_avg_duration: float, 
                current_service_speed: float, hour_of_day: int, day_of_week: int):
        
        if people_ahead <= 0:
            return {
                "predicted_wait_time_mins": 0.0,
                "confidence_score": 0.99,
                "model_type": "instant_serving",
                "factors": {
                    "people_ahead": 0,
                    "service_speed": current_service_speed
                }
            }

        # Format input vector
        input_data = pd.DataFrame([{
            'people_ahead': people_ahead,
            'queue_length': queue_length,
            'historical_avg_duration': historical_avg_duration,
            'current_service_speed': current_service_speed,
            'hour_of_day': hour_of_day,
            'day_of_week': day_of_week
        }])

        ml_prediction = float(self.model.predict(input_data)[0])

        # Rule-based calculation for validation/ensemble
        speed = max(0.5, current_service_speed)
        base_rule = (people_ahead * historical_avg_duration) / speed
        
        # Peak time multiplier (10am - 2pm is busiest)
        peak_multiplier = 1.2 if (10 <= hour_of_day <= 14) else 1.0
        rule_prediction = base_rule * peak_multiplier

        # Hybrid ensemble score (70% ML, 30% Rule Baseline)
        final_prediction = (0.7 * ml_prediction) + (0.3 * rule_prediction)
        final_prediction = max(1.0, round(final_prediction, 1))

        # Calculate confidence score based on feature stability
        confidence = 0.92 if people_ahead < 10 else (0.85 if people_ahead < 25 else 0.75)

        return {
            "predicted_wait_time_mins": final_prediction,
            "confidence_score": confidence,
            "model_type": "RandomForest_Hybrid_ML",
            "factors": {
                "people_ahead": people_ahead,
                "queue_length": queue_length,
                "historical_avg_duration_mins": historical_avg_duration,
                "current_service_speed": current_service_speed,
                "hour_of_day": hour_of_day,
                "peak_hour_active": (10 <= hour_of_day <= 14)
            }
        }

predictor = WaitTimePredictor()
