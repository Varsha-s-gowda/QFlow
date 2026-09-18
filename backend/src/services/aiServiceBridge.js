const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const getPredictedWaitTime = async (params) => {
  const {
    peopleAhead,
    queueLength,
    servicePrefix = 'GEN',
    historicalAvgDuration = 5.0,
    currentServiceSpeed = 1.0
  } = params;

  if (peopleAhead <= 0) {
    return {
      predictedWaitTimeMins: 0,
      confidenceScore: 0.99,
      expectedCompletionTime: 'Instant',
      modelType: 'Instant Serving',
      isAIPowered: true
    };
  }

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/predict-wait-time`, {
      people_ahead: peopleAhead,
      queue_length: queueLength || peopleAhead + 1,
      service_prefix: servicePrefix,
      historical_avg_duration: historicalAvgDuration,
      current_service_speed: currentServiceSpeed,
      hour_of_day: new Date().getHours(),
      day_of_week: new Date().getDay()
    }, { timeout: 3000 });

    return {
      predictedWaitTimeMins: response.data.predicted_wait_time_mins,
      confidenceScore: response.data.confidence_score,
      expectedCompletionTime: response.data.expected_completion_time,
      modelType: response.data.model_type,
      isAIPowered: true,
      factors: response.data.factors
    };
  } catch (error) {
    console.log(`[AI Service Bridge] Python AI microservice unavailable or timed out (${error.message}). Using baseline heuristic engine.`);
    
    // Baseline Rule Fallback
    const baseWait = (peopleAhead * historicalAvgDuration) / currentServiceSpeed;
    const now = new Date();
    const estTime = new Date(now.getTime() + baseWait * 60000);
    
    return {
      predictedWaitTimeMins: Math.round(baseWait * 10) / 10,
      confidenceScore: 0.80,
      expectedCompletionTime: estTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelType: 'Baseline Heuristic Engine',
      isAIPowered: false,
      factors: {
        people_ahead: peopleAhead,
        historical_avg_duration_mins: historicalAvgDuration
      }
    };
  }
};

module.exports = {
  getPredictedWaitTime
};
