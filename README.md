# 🔌 Utility Billing & Prediction System

A comprehensive web application for managing utility bills (Electricity & Water) with AI-powered usage predictions for Sri Lankan businesses. Built with React, Node.js, MongoDB, and a Flask ML service.

## 

## 📋 Table of Contents

  - [Features](https://www.google.com/search?q=%23-features)
  - [Tech Stack](https://www.google.com/search?q=%23-tech-stack)
  - [System Architecture](https://www.google.com/search?q=%23-system-architecture)
  - [Prerequisites](https://www.google.com/search?q=%23-prerequisites)
  - [Installation](https://www.google.com/search?q=%23-installation)
  - [Configuration](https://www.google.com/search?q=%23-configuration)
  - [Running the Application](https://www.google.com/search?q=%23-running-the-application)
  - [Usage Guide](https://www.google.com/search?q=%23-usage-guide)
  - [API Documentation](https://www.google.com/search?q=%23-api-documentation)
  - [ML Model Details](https://www.google.com/search?q=%23-ml-model-details)
  - [Screenshots](https://www.google.com/search?q=%23-screenshots)
  - [Contributing](https://www.google.com/search?q=%23-contributing)
  - [License](https://www.google.com/search?q=%23-license)

-----

## ✨ Features

### 📊 Core Features

  - **Multi-Branch Management** - Manage multiple business locations
  - **Bill Tracking** - Track electricity and water bills with status management
  - **Real-time Dashboard** - Overview of all utility expenses
  - **Advanced Reports** - Export data to Excel/CSV with detailed analytics
  - **Alert System** - Set usage thresholds and receive notifications

### 🤖 AI/ML Features

  - **Usage Prediction** - Machine learning-powered forecasting
  - **Trend Analysis** - Identify usage patterns and anomalies
  - **Cost Estimation** - Predict future bills based on historical data
  - **Anomaly Detection** - Automatic identification of unusual consumption
  - **Multi-Model Support** - Linear and polynomial regression models

### 📈 Analytics

  - Growth rate calculation
  - Seasonality detection
  - Branch-wise comparison
  - Historical trend visualization
  - Confidence scoring

### 📤 Data Management

  - CSV import/export
  - Excel reports with formatting
  - Manual data entry
  - Bulk upload support

-----

## 🛠 Tech Stack

### Frontend

  - **React 18** - UI framework
  - **React Router** - Navigation
  - **Recharts** - Data visualization
  - **Axios** - API communication
  - **Lucide React** - Icons
  - **Vite** - Build tool

### Backend

  - **Node.js** - Runtime environment
  - **Express.js** - Web framework
  - **MongoDB** - Database
  - **Mongoose** - ODM
  - **JWT** - Authentication
  - **Bcrypt** - Password hashing
  - **ExcelJS** - Excel generation
  - **CSV Writer** - CSV export
  - **Multer** - File upload

### ML Service

  - **Flask** - Python web framework
  - **NumPy** - Numerical computing
  - **Pandas** - Data manipulation
  - **Scikit-learn** - Machine learning
  - **Linear Regression** - Prediction model
  - **Polynomial Features** - Advanced modeling

-----

## 🏗 System Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │         │             │         │             │
│   React     │◄───────►│   Node.js   │◄───────►│   MongoDB   │
│  Frontend   │  HTTP   │   Backend   │  CRUD   │   Database  │
│             │         │             │         │             │
└─────────────┘         └──────┬──────┘         └─────────────┘
                               │
                               │ HTTP
                               ▼
                         ┌─────────────┐
                         │             │
                         │    Flask    │
                         │ ML Service  │
                         │             │
                         └─────────────┘
```

-----

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

  - **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
  - **Python** (v3.9 or higher) - [Download](https://www.python.org/)
  - **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
  - **npm** or **yarn** - Package manager
  - **Git** - Version control

-----

## 🚀 Installation

### 1\. Clone the Repository

```bash
git clone https://github.com/yourusername/utility-billing-system.git
cd utility-billing-system
```

### 2\. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3\. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4\. Setup ML Service

```bash
cd ../ml-service

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

-----

## ⚙️ Configuration

### Backend Configuration

Create `backend/.env`:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/utility_billing
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=development
```

### ML Service Configuration

Create `ml-service/.env`:

```env
FLASK_ENV=development
FLASK_PORT=5000
CORS_ORIGIN=http://localhost:5173
```

### Frontend Configuration

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_ML_API_URL=http://localhost:5000
```

-----

## 🎯 Running the Application

### Start Services in Order

#### Terminal 1: Start MongoDB

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Ubuntu
# sudo systemctl start mongod

# Windows
# Start MongoDB service from Services app or run: mongod
```

#### Terminal 2: Start Backend

```bash
cd backend
npm run dev
# Server running at http://localhost:4000
```

#### Terminal 3: Start ML Service

```bash
cd ml-service
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
# ML Service running at http://localhost:5000
```

#### Terminal 4: Start Frontend

```bash
cd frontend
npm run dev
# App running at http://localhost:5173
```

### Access the Application

Open your browser and navigate to:

  - **Frontend**: `http://localhost:5173`
  - **Backend API**: `http://localhost:4000/api/health`
  - **ML API**: `http://localhost:5000/health`

-----

## 📖 Usage Guide

### 1\. User Registration & Login

1.  Navigate to `http://localhost:5173/login`
2.  Click "Register" to create a new account
3.  Fill in your details (name, email, password)
4.  Login with your credentials

### 2\. Branch Management

1.  Go to **Branches** page
2.  Click **"Add Branch"**
3.  Enter branch name and location (e.g., "Colombo Main Office", "Fort, Colombo 01")
4.  Save the branch

### 3\. Bill Management

1.  Navigate to **Bills** page
2.  Click **"Add New Bill"**
3.  Fill in the form:
      - Select branch
      - Choose utility type (Electricity/Water)
      - Enter units consumed
      - Enter amount (or auto-calculate at Rs. 45/unit)
      - Select due date
4.  Click **"Create Bill"**

### 4\. Usage Predictions

#### Method 1: CSV Upload

1.  Go to **Predictions** page
2.  Select **"CSV Upload"** tab
3.  Download sample CSV format
4.  Prepare your CSV file:
    ```csv
    month,units,amount
    1,500,22500
    2,520,23400
    3,510,22950
    ```
5.  Upload the file
6.  Click **"Get Prediction"**

#### Method 2: Manual Entry

1.  Select **"Manual Entry"** tab
2.  Enter historical data for each month
3.  Add more rows as needed
4.  Click **"Get Prediction"**

#### Understanding Results

  - **Predicted Units**: Estimated usage for next month
  - **Predicted Amount**: Estimated cost in LKR
  - **Trend**: Usage direction (increasing/decreasing/stable)
  - **Confidence**: Model accuracy (low/medium/high)
  - **Growth Rate**: Percentage change
  - **Anomaly Detection**: Flags unusual patterns

### 5\. Reports & Analytics

1.  Go to **Reports** page
2.  View summary statistics:
      - Total bills
      - Total amount
      - Paid/Pending counts
3.  Export data:
      - **CSV Export**: Simple data export
      - **Excel Export**: Formatted with colors
      - **Summary Report**: Multi-sheet analysis

### 6\. Dashboard Overview

  - View total monthly consumption
  - See branch-wise breakdown
  - Check pending bills
  - Monitor usage trends

-----

## 🔌 API Documentation

### Authentication Endpoints

```http
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Branch Endpoints

```http
GET    /api/branches
POST   /api/branches
PUT    /api/branches/:id
DELETE /api/branches/:id
```

### Bill Endpoints

```http
GET    /api/bills
POST   /api/bills
PUT    /api/bills/:id
DELETE /api/bills/:id
GET    /api/bills/summary/monthly
```

### Prediction Endpoints

```http
POST   /api/predictions/upload         # CSV upload
POST   /api/predictions/from-bills     # From existing bills
GET    /api/predictions/batch          # All branches
```

### Export Endpoints

```http
GET    /api/exports/csv
GET    /api/exports/excel
GET    /api/exports/summary-excel
```

### ML Service Endpoints

```http
GET    /health                    # Health check
POST   /predict                   # Single prediction
POST   /predict/batch             # Batch predictions
POST   /analyze                   # Usage analysis
```

-----

## 🤖 ML Model Details

### Algorithm

The system uses **Scikit-learn's Linear Regression** with optional polynomial features for non-linear trends.

### Training Process

1.  **Data Collection**: Historical usage data (min 2 months)
2.  **Feature Extraction**: Month number, units, amounts
3.  **Model Training**: Linear or polynomial regression
4.  **Prediction**: Forecast next period usage
5.  **Validation**: R² score calculation

### Model Selection

  - **Linear Regression**: Used for 2-3 data points
  - **Polynomial Regression**: Used for 4+ data points (better accuracy)

### Confidence Levels

  - **High**: 6+ months of data ($R^2 > 0.9$)
  - **Medium**: 3-5 months of data ($R^2 > 0.7$)
  - **Low**: 2 months of data ($R^2 < 0.7$)

### Anomaly Detection

Uses **Z-score method** with 1.5 standard deviations threshold to detect outliers.

-----

## 📸 Screenshots

### Dashboard

*Overview of utility consumption and expenses*

### Bill Management

*Track and manage all utility bills*

### Branch Management

*Manage multiple business locations*

### AI Predictions

*ML-powered usage forecasting with trend analysis*

### Reports & Analytics

*Detailed reports with export capabilities*

### Login Screen

*Secure authentication system*

-----

## 📁 Project Structure

```
utility-billing-system/
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   └── App.jsx             # Main app component
│   └── package.json
│
├── backend/                    # Node.js API
│   ├── config/                 # Configuration files
│   ├── models/                 # MongoDB models
│   ├── routes/                 # API routes
│   ├── middleware/             # Auth middleware
│   ├── server.js               # Entry point
│   └── package.json
│
├── ml-service/                 # Flask ML service
│   ├── models/                 # ML models
│   ├── utils/                  # Helper functions
│   ├── app.py                  # Flask app
│   └── requirements.txt
│
├── screenshots/                # App screenshots
└── README.md                   # This file
```

-----

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### ML Service Tests

```bash
cd ml-service
pytest
```

-----

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
# brew services start mongodb-community  # macOS
# sudo systemctl start mongod            # Linux
```

### Port Already in Use

```bash
# Find process using port
lsof -ti:4000  # Backend
lsof -ti:5000  # ML Service
lsof -ti:5173  # Frontend

# Kill process
kill -9 <PID>
```

### Python Dependencies Error

```bash
# Upgrade pip
pip install --upgrade pip

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### CORS Error

Ensure `frontend/.env` has correct API URLs and the backend has CORS enabled for `http://localhost:5173`.

-----

## 🤝 Contributing

Contributions are welcome\! Please follow these steps:

1.  Fork the repository
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

### Code Style

  - **Frontend**: ESLint + Prettier
  - **Backend**: ESLint
  - **Python**: PEP 8

-----

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

-----

## 👥 Authors

  - **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

-----

## 🙏 Acknowledgments

  - React community for excellent documentation
  - Scikit-learn for ML capabilities
  - MongoDB for flexible database
  - All contributors who helped with this project

-----

## 📞 Support

For support, email `support@yourapp.com` or open an issue on GitHub.

-----

## 🗺 Roadmap

  - [ ] Email notifications for bill reminders
  - [ ] SMS alerts for usage thresholds
  - [ ] Mobile app (React Native)
  - [ ] Multi-currency support
  - [ ] Invoice generation
  - [ ] Payment gateway integration
  - [ ] Advanced ML models (LSTM, ARIMA)
  - [ ] Real-time usage monitoring
  - [ ] Multi-tenant support

-----

## 📊 Database Schema

### User Collection

```json
{
  "email": "String",
  "password": "String (hashed)",
  "name": "String",
  "role": "String",
  "createdAt": "Date"
}
```

### Branch Collection

```json
{
  "name": "String",
  "location": "String",
  "userId": "ObjectId",
  "createdAt": "Date"
}
```

### Bill Collection

```json
{
  "branchId": "ObjectId",
  "userId": "ObjectId",
  "type": "String",
  "units": "Number",
  "amount": "Number",
  "dueDate": "Date",
  "status": "String",
  "periodStart": "Date",
  "createdAt": "Date"
}
```

-----

## 🔒 Security

  - Passwords are hashed using bcrypt
  - JWT tokens for authentication
  - Environment variables for sensitive data
  - Input validation on all endpoints
  - CORS protection
  - Rate limiting (recommended for production)

-----

## 🚀 Deployment

### Frontend (Vercel/Netlify)

```bash
cd frontend
npm run build
# Deploy dist folder
```

### Backend (Heroku/Railway)

```bash
cd backend
# Add Procfile: web: node server.js
git push heroku main
```

### ML Service (Render/Railway)

```bash
cd ml-service
# Use gunicorn for production
gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

-----

## 📈 Performance

  - **Frontend**: Lazy loading, code splitting
  - **Backend**: Connection pooling, caching
  - **ML**: Model caching, batch processing
  - **Database**: Indexed queries

-----

## **Made with ❤️ for Sri Lankan businesses**

### ⭐ Star this repo if you find it helpful\!

### HOW TO ADD SCREENSHOTS

#### 1\. Create Screenshots Folder

```bash
mkdir screenshots
```

#### 2\. Take Screenshots

Use these tools to capture high-quality screenshots:

  - **macOS**: `Cmd + Shift + 4`
  - **Windows**: `Win + Shift + S`
  - **Linux**: Flameshot / GNOME Screenshot

#### 3\. Name Your Screenshots

Save them with these exact names in the `screenshots/` folder:

```
screenshots/
├── dashboard.png       # Main dashboard view
├── login.png           # Login/Register screen
├── bills.png           # Bill management page
├── branches.png        # Branch management page
├── predictions.png     # ML predictions page
├── reports.png         # Reports & analytics page
└── architecture.png    # System architecture diagram (optional)
```

#### 4\. Optimize Images

Use tools like:

  - **TinyPNG** - `https://tinypng.com/`
  - **ImageOptim** (macOS)
  - **OptiPNG** (CLI)
    *Target size: \< 500KB per image*

#### 5\. Update Image Links

If using a different path, update all `![Alt Text](path/to/image.png)` references in `README.md`

#### OPTIONAL: Create Logo

Create `logo.png` (512x512) and add at the top of README:

```html
<p align="center">
  <img src="logo.png" alt="Logo" width="200"/>
</p>
<h1 align="center">Utility Billing & Prediction System</h1>
```

### GIT COMMIT

```bash
git add screenshots/
git add README.md
git commit -m "docs: Add comprehensive README with screenshots"
git push origin main
```

Your professional README is ready for GitHub\! 📚✨
