# ml-service/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    PORT = int(os.getenv('FLASK_PORT', 5000))
    CORS_ORIGIN = os.getenv('CORS_ORIGIN', 'http://localhost:5173')
    DEBUG = FLASK_ENV == 'development'
    
    # ML Model settings
    MIN_DATA_POINTS = 2
    CONFIDENCE_THRESHOLD_HIGH = 6
    CONFIDENCE_THRESHOLD_MEDIUM = 3
    ANOMALY_STD_MULTIPLIER = 1.5
