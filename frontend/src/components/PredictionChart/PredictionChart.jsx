// components/PredictionChart.jsx
import React from 'react';
import './PredictionChart.css';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function PredictionChart({ data }) {
  // data: [{ monthLabel: 'Jun', actualUnits: 250, actualAmount: 11250, predictedUnits?: 270, predictedAmount?: 12150 }]
  return (
    <div className="card predict__wrap">
      <div className="predict__head">
        <div>
          <div className="predict__title">Usage & Cost Trend</div>
          <div className="predict__sub">Actual vs Predicted next month</div>
        </div>
      </div>

      <div className="predict__chart">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthLabel" />
            <YAxis yAxisId="left" label={{ value: 'Units', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Amount', angle: -90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="actualUnits" stroke="#4f8cff" name="Actual Units" dot />
            <Line yAxisId="left" type="monotone" dataKey="predictedUnits" stroke="#93c5fd" name="Predicted Units" strokeDasharray="4 4" />
            <Line yAxisId="right" type="monotone" dataKey="actualAmount" stroke="#22c55e" name="Actual Amount" dot />
            <Line yAxisId="right" type="monotone" dataKey="predictedAmount" stroke="#86efac" name="Predicted Amount" strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
