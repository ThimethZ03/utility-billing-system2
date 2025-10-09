// services/predictionAPI.js
import axios from 'axios';

const ML_BASE_URL = import.meta.env.VITE_ML_BASE_URL || 'http://localhost:5000';

const ml = axios.create({
  baseURL: ML_BASE_URL,
});

// Advanced client-side prediction with trend analysis
const predictClientSide = (series) => {
  if (series.length < 2) return null;

  // Linear regression
  const n = series.length;
  const sumX = series.reduce((sum, _, i) => sum + (i + 1), 0);
  const sumY = series.reduce((sum, s) => sum + s.units, 0);
  const sumXY = series.reduce((sum, s, i) => sum + (i + 1) * s.units, 0);
  const sumX2 = series.reduce((sum, _, i) => sum + (i + 1) ** 2, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  const intercept = (sumY - slope * sumX) / n;

  const predictedUnits = Math.round(slope * (n + 1) + intercept);
  
  // Calculate growth rate
  const growthRate = series.length > 1 
    ? ((series[series.length - 1].units - series[0].units) / series[0].units) * 100 
    : 0;

  // Calculate average cost per unit
  const avgCostPerUnit = series.reduce((sum, s) => sum + (s.amount / s.units), 0) / n;
  const predictedAmount = Math.round(predictedUnits * avgCostPerUnit);

  // Detect anomalies (usage spike > 30% from average)
  const avgUnits = sumY / n;
  const stdDev = Math.sqrt(
    series.reduce((sum, s) => sum + Math.pow(s.units - avgUnits, 2), 0) / n
  );
  const lastMonth = series[series.length - 1].units;
  const isAnomaly = Math.abs(lastMonth - avgUnits) > stdDev * 1.5;

  return {
    predicted_units: Math.max(0, predictedUnits),
    predicted_amount: Math.max(0, predictedAmount),
    growth_rate: growthRate.toFixed(2),
    trend: slope > 5 ? 'increasing' : slope < -5 ? 'decreasing' : 'stable',
    confidence: series.length >= 6 ? 'high' : series.length >= 3 ? 'medium' : 'low',
    anomaly_detected: isAnomaly,
    avg_cost_per_unit: avgCostPerUnit.toFixed(2),
  };
};

export const getUnitsPrediction = async (series) => {
  // Try ML API first
  try {
    const { data } = await ml.post('/predict', { data: series });
    return data;
  } catch (err) {
    console.log('ML API unavailable, using client-side prediction');
    // Fallback to advanced client-side prediction
    return predictClientSide(series);
  }
};

// Predict by branch
export const getBranchPredictions = async (billsByBranch) => {
  const predictions = {};
  
  for (const [branchId, bills] of Object.entries(billsByBranch)) {
    if (bills.length >= 2) {
      const series = bills
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map((b, idx) => ({
          month: idx + 1,
          units: b.units,
          amount: b.amount,
        }));
      
      predictions[branchId] = await getUnitsPrediction(series);
    }
  }
  
  return predictions;
};
