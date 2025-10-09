# ml-service/models/predictor.py
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import r2_score

class BillPredictor:
    """ML model for predicting utility bill usage"""
    
    def __init__(self):
        self.model = None
        self.poly_features = None
        self.use_polynomial = False
        
    def train(self, months, units, use_polynomial=False):
        """
        Train the prediction model
        
        Args:
            months: Array of month numbers
            units: Array of unit values
            use_polynomial: Whether to use polynomial regression
        """
        months = np.array(months).reshape(-1, 1)
        units = np.array(units)
        
        self.use_polynomial = use_polynomial
        
        if use_polynomial and len(months) >= 4:
            # Use polynomial regression for non-linear trends
            self.poly_features = PolynomialFeatures(degree=2)
            months_poly = self.poly_features.fit_transform(months)
            self.model = LinearRegression()
            self.model.fit(months_poly, units)
        else:
            # Use simple linear regression
            self.model = LinearRegression()
            self.model.fit(months, units)
            
        return self
    
    def predict(self, next_month):
        """Predict units for next month"""
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        next_month = np.array([[next_month]])
        
        if self.use_polynomial and self.poly_features:
            next_month = self.poly_features.transform(next_month)
            
        prediction = self.model.predict(next_month)[0]
        return max(0, int(prediction))
    
    def score(self, months, units):
        """Calculate R² score for model accuracy"""
        if self.model is None:
            return 0
        
        months = np.array(months).reshape(-1, 1)
        
        if self.use_polynomial and self.poly_features:
            months = self.poly_features.transform(months)
            
        predictions = self.model.predict(months)
        return r2_score(units, predictions)
    
    def get_trend(self):
        """Get trend direction from model coefficients"""
        if self.model is None:
            return 'unknown'
        
        if self.use_polynomial:
            slope = self.model.coef_[1]  # Linear coefficient
        else:
            slope = self.model.coef_[0]
        
        if slope > 5:
            return 'increasing'
        elif slope < -5:
            return 'decreasing'
        else:
            return 'stable'


class UsageAnalyzer:
    """Analyze usage patterns and detect anomalies"""
    
    @staticmethod
    def calculate_growth_rate(units):
        """Calculate growth rate from first to last period"""
        if len(units) < 2 or units[0] == 0:
            return 0.0
        
        growth = ((units[-1] - units[0]) / units[0]) * 100
        return round(growth, 2)
    
    @staticmethod
    def detect_anomaly(units, std_multiplier=1.5):
        """Detect if last value is an anomaly"""
        if len(units) < 3:
            return False
        
        mean = np.mean(units)
        std = np.std(units)
        last_value = units[-1]
        
        return abs(last_value - mean) > (std * std_multiplier)
    
    @staticmethod
    def calculate_seasonality(units):
        """Detect seasonal patterns (if enough data)"""
        if len(units) < 12:
            return None
        
        # Simple seasonal decomposition
        monthly_avg = np.mean(units)
        seasonal_indices = [u / monthly_avg for u in units]
        
        return {
            'has_seasonality': max(seasonal_indices) - min(seasonal_indices) > 0.2,
            'peak_months': [i for i, si in enumerate(seasonal_indices) if si > 1.2],
            'low_months': [i for i, si in enumerate(seasonal_indices) if si < 0.8]
        }
    
    @staticmethod
    def get_confidence_level(data_points):
        """Determine prediction confidence based on data points"""
        if data_points >= 6:
            return 'high'
        elif data_points >= 3:
            return 'medium'
        else:
            return 'low'
