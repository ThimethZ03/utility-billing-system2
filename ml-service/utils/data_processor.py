# ml-service/utils/data_processor.py
import numpy as np
import pandas as pd

class DataProcessor:
    """Utility class for data preprocessing and validation"""
    
    @staticmethod
    def validate_input(data):
        """
        Validate input data structure
        
        Expected format:
        [
            {"month": 1, "units": 500, "amount": 22500},
            {"month": 2, "units": 520, "amount": 23400},
            ...
        ]
        """
        if not isinstance(data, list):
            raise ValueError("Data must be a list of objects")
        
        if len(data) < 2:
            raise ValueError("At least 2 data points required")
        
        required_fields = ['month', 'units']
        
        for item in data:
            if not all(field in item for field in required_fields):
                raise ValueError(f"Each item must contain: {required_fields}")
            
            if not isinstance(item['units'], (int, float)) or item['units'] < 0:
                raise ValueError("Units must be a non-negative number")
        
        return True
    
    @staticmethod
    def extract_features(data):
        """Extract features from input data"""
        months = [item['month'] for item in data]
        units = [item['units'] for item in data]
        amounts = [item.get('amount', 0) for item in data]
        
        return np.array(months), np.array(units), np.array(amounts)
    
    @staticmethod
    def calculate_cost_per_unit(units, amounts):
        """Calculate average cost per unit"""
        valid_indices = units > 0
        if not np.any(valid_indices):
            return 0
        
        cost_per_unit = amounts[valid_indices] / units[valid_indices]
        return np.mean(cost_per_unit)
    
    @staticmethod
    def fill_missing_values(data):
        """Fill missing values using forward fill"""
        df = pd.DataFrame(data)
        df = df.fillna(method='ffill').fillna(method='bfill')
        return df.to_dict('records')
    
    @staticmethod
    def remove_outliers(units, threshold=3):
        """Remove outliers using z-score method"""
        if len(units) < 4:
            return units
        
        z_scores = np.abs((units - np.mean(units)) / np.std(units))
        return units[z_scores < threshold]
