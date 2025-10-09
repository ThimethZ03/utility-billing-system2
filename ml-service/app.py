# ml-service/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from config import Config
from models.predictor import BillPredictor, UsageAnalyzer
from utils.data_processor import DataProcessor

app = Flask(__name__)
CORS(app, origins=Config.CORS_ORIGIN)

# Initialize data processor and analyzer
data_processor = DataProcessor()
analyzer = UsageAnalyzer()


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'ML Prediction Service',
        'version': '1.0.0',
        'environment': Config.FLASK_ENV
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict next month's usage
    
    Input:
    {
        "data": [
            {"month": 1, "units": 500, "amount": 22500},
            {"month": 2, "units": 520, "amount": 23400},
            ...
        ]
    }
    
    Output:
    {
        "predicted_units": 540,
        "predicted_amount": 24300,
        "growth_rate": 4.0,
        "trend": "increasing",
        "confidence": "high",
        "anomaly_detected": false,
        "avg_cost_per_unit": 45.0,
        "model_score": 0.985
    }
    """
    try:
        # Get input data
        input_data = request.json
        data = input_data.get('data', [])
        
        # Validate input
        data_processor.validate_input(data)
        
        # Extract features
        months, units, amounts = data_processor.extract_features(data)
        
        # Train predictor
        predictor = BillPredictor()
        use_polynomial = len(data) >= 4  # Use polynomial for 4+ data points
        predictor.train(months, units, use_polynomial=use_polynomial)
        
        # Predict next month
        next_month = len(data) + 1
        predicted_units = predictor.predict(next_month)
        
        # Calculate cost per unit and predicted amount
        avg_cost_per_unit = data_processor.calculate_cost_per_unit(units, amounts)
        predicted_amount = int(predicted_units * avg_cost_per_unit)
        
        # Calculate metrics
        growth_rate = analyzer.calculate_growth_rate(units)
        trend = predictor.get_trend()
        confidence = analyzer.get_confidence_level(len(data))
        anomaly_detected = analyzer.detect_anomaly(units, Config.ANOMALY_STD_MULTIPLIER)
        model_score = predictor.score(months, units)
        
        # Detect seasonality (if enough data)
        seasonality = analyzer.calculate_seasonality(units) if len(units) >= 12 else None
        
        # Prepare response
        response = {
            'predicted_units': predicted_units,
            'predicted_amount': predicted_amount,
            'growth_rate': growth_rate,
            'trend': trend,
            'confidence': confidence,
            'anomaly_detected': anomaly_detected,
            'avg_cost_per_unit': round(avg_cost_per_unit, 2),
            'model_score': round(model_score, 3),
            'data_points': len(data),
            'model_type': 'polynomial' if use_polynomial else 'linear'
        }
        
        if seasonality:
            response['seasonality'] = seasonality
        
        return jsonify(response)
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        app.logger.error(f'Prediction error: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """
    Predict for multiple branches
    
    Input:
    {
        "branches": {
            "br1": [{"month": 1, "units": 500}, ...],
            "br2": [{"month": 1, "units": 450}, ...],
            ...
        }
    }
    
    Output:
    {
        "br1": {"predicted_units": 540, ...},
        "br2": {"predicted_units": 470, ...},
        ...
    }
    """
    try:
        input_data = request.json
        branches_data = input_data.get('branches', {})
        
        if not isinstance(branches_data, dict):
            return jsonify({'error': 'Invalid input format'}), 400
        
        predictions = {}
        errors = {}
        
        for branch_id, data in branches_data.items():
            try:
                if len(data) < 2:
                    errors[branch_id] = 'Insufficient data points'
                    continue
                
                # Extract features
                months, units, amounts = data_processor.extract_features(data)
                
                # Train and predict
                predictor = BillPredictor()
                predictor.train(months, units)
                
                next_month = len(data) + 1
                predicted_units = predictor.predict(next_month)
                
                avg_cost_per_unit = data_processor.calculate_cost_per_unit(units, amounts)
                predicted_amount = int(predicted_units * avg_cost_per_unit)
                
                predictions[branch_id] = {
                    'predicted_units': predicted_units,
                    'predicted_amount': predicted_amount,
                    'trend': predictor.get_trend(),
                    'confidence': analyzer.get_confidence_level(len(data))
                }
                
            except Exception as e:
                errors[branch_id] = str(e)
        
        response = {'predictions': predictions}
        if errors:
            response['errors'] = errors
        
        return jsonify(response)
        
    except Exception as e:
        app.logger.error(f'Batch prediction error: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Analyze usage patterns without prediction
    
    Input:
    {
        "data": [{"month": 1, "units": 500, "amount": 22500}, ...]
    }
    
    Output:
    {
        "total_units": 3000,
        "total_amount": 135000,
        "avg_units": 500,
        "avg_amount": 22500,
        "growth_rate": 4.5,
        "anomaly_detected": false,
        "trend": "increasing",
        "min_usage": 450,
        "max_usage": 610,
        "std_deviation": 45.2
    }
    """
    try:
        input_data = request.json
        data = input_data.get('data', [])
        
        data_processor.validate_input(data)
        
        months, units, amounts = data_processor.extract_features(data)
        
        analysis = {
            'total_units': int(np.sum(units)),
            'total_amount': int(np.sum(amounts)),
            'avg_units': int(np.mean(units)),
            'avg_amount': int(np.mean(amounts)),
            'growth_rate': analyzer.calculate_growth_rate(units),
            'anomaly_detected': analyzer.detect_anomaly(units),
            'min_usage': int(np.min(units)),
            'max_usage': int(np.max(units)),
            'std_deviation': round(float(np.std(units)), 2),
            'data_points': len(data)
        }
        
        # Add trend if possible
        if len(data) >= 2:
            predictor = BillPredictor()
            predictor.train(months, units)
            analysis['trend'] = predictor.get_trend()
        
        return jsonify(analysis)
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        app.logger.error(f'Analysis error: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f'Server error: {str(error)}')
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    print(f'🚀 ML Service starting on http://0.0.0.0:{Config.PORT}')
    print(f'📊 Environment: {Config.FLASK_ENV}')
    print(f'🔧 Debug mode: {Config.DEBUG}')
    
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=Config.DEBUG
    )
