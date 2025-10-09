# ⚡ Smart Branch Utility Monitoring & Prediction System

A full-stack web application designed to help organizations **monitor, manage, and predict** their branch-wise **electricity and water usage** using **Machine Learning (ML)** for monthly consumption prediction and cost forecasting.

---

## 🧱 1. Project Overview

**System Name:** Smart Branch Utility Monitoring & Prediction System  
**Purpose:** To track and predict utility expenses (electricity and water) across multiple branches with real-time data visualization and ML-based forecasting.

### 🎯 Core Objectives
- Monitor and manage branch-wise utility usage.  
- Predict next month’s consumption and cost using ML.  
- Visualize trends and usage patterns.  
- Send reminders for due bills or abnormal usage.  

---

## ⚙️ 2. Functional Requirements

### 👩‍💼 Admin Features
- Login to admin dashboard.  
- Add, edit, or delete branch details.  
- Enter utility information:
  - Type (Electricity/Water)
  - Units Consumed
  - Amount (Rs)
  - Due Date
  - Status (Paid / Pending / Overdue)
- View monthly and yearly summaries.  
- Export data (CSV / PDF).  
- View ML-predicted usage and cost.  

### ⚡ Branch Utility Monitoring
- Track utility data for each branch.  
- Graph usage vs. cost per month.  
- Detect abnormal increases.  
- Filter by branch or utility type.  

### 📈 ML-Based Prediction
- Uses **Linear Regression (scikit-learn)** trained on past data.
- Predicts next month’s:
  - Units consumed
  - Bill amount
- Visualizes predictions on charts.

### 🔔 Alerts & Notifications
- Overdue bill highlights.  
- Due date reminders.  
- Smart insights like:
  > "Electricity usage increased by 12% this month."

---

## 🧠 3. Machine Learning Component

### 🧮 Model: Linear Regression

**Example Training Data:**

| Month | Units | Bill (Rs) |
|-------|--------|------------|
| June | 250 | 11250 |
| July | 270 | 12150 |
| August | 290 | 13050 |
| 🔮 September | Predicted | Predicted |

### Example Flask API
```python
from flask import Flask, request, jsonify
from sklearn.linear_model import LinearRegression
import pandas as pd

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json['data']
    df = pd.DataFrame(data)
    X = df[['month']]
    y = df['units']
    model = LinearRegression()
    model.fit(X, y)
    next_month = [[len(X) + 1]]
    prediction = model.predict(next_month)[0]
    return jsonify({"predicted_units": round(prediction, 2)})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
