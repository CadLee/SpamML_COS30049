# Assignment 3 - Full-Stack Email Spam Classification Application
## Complete ReadMe Guide

## Table of Contents

1. [Project Information](#Project-Information)
2. [Installation](#Prerequisites)
3. [Running the Application](#Running-the-Application)
4. [Usage](#Usage)
8. [Project Structure](#Project-Structure)
9. [Development Notes](#Development-Notes)
10. [Troubleshooting](#Troubleshooting)
11. [License](#License)
12. [Acknowledgements](#Acknowledgments)

## Project Information
- **Course**: COS30049 - Computing Technology Innovation Project
- **Group**: Coast Guard - Group 1
- **Team Members**:
  - Damian Moisidis (104887896)
  - Mufid Kadli (104225535)
  - Pratham Kumar (104668538)

## Overview
This web application classifies emails as spam or ham (legitimate) using a trained Linear SVM machine learning model. The system features a React frontend with Material-UI components and a FastAPI backend.

## Model Performance
- **Model**: Linear Support Vector Machine (SVM)
- **Accuracy**: 90.50%
- **Precision (Ham/Spam)**: 0.94 / 0.88
- **Recall (Ham/Spam)**: 0.87 / 0.94
- **F1-Score (Ham/Spam)**: 0.90 / 0.91

## Features
- Real-time email classification
- Confidence score visualization
- Interactive charts (Pie, Bar charts, Boxplot, Heatmap)
- Model performance metrics display
- Responsive Material-UI design
- Error handling and input validation

### Installation

## Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

## Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

## Frontend Setup
```bash
cd frontend
npm install
```

### Running the Application

## Start Backend Server
```bash
cd backend
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

## Start Frontend Server
```bash
cd frontend
npm start
```
Frontend runs at: `http://localhost:3000`

### Usage

1. Open the web application in your browser
2. Enter or paste email text in the input field
3. Click "Classify Email" to get prediction
4. View the classification result with confidence score
5. Check the visualization charts for analysis

### Project Structure
```
spam-detection-app/
├── backend/
│   ├── main.py                         # FastAPI server
│   ├── model.py                        # ML model wrapper
|   ├── persistance.py                  # Read Write to database
|   ├── predictions_database.json       # JSON Database
│   ├── requirements.txt                # Python dependencies
│   ├── spam_model_LinearSVM.pkl        # Trained model
│   └── spam_vectorizer.pkl             # TF-IDF vectorizer
├── frontend/
│   ├── src/
│   │   ├── App.js                      # Main React component
│   │   ├── components/
│   │   │   ├── EmailClassifier.js      # Email input component
│   │   │   |── Charts.js               # Visualization component
│   │   │   |── ConfusionMatrixD3.js    # Heatmap D3 chart componet
|   |   |   |── D3BoxPlot.js            # BoxPlot D3 chart componet
|   |   |   |── PredictionHistory.js    # Export CSV & JSON component
|   |   |   └── Statistics.js           # Summary of metrics component
│   │   └── index.js                    # React entry point
│   └── package.json                    # Node dependencies
└── README.md
```

### Development Notes

## Data Preprocessing
The model uses the same text cleaning pipeline from Assignment 2:
- Lowercase conversion
- URL removal
- Special character filtering
- Whitespace normalization

## Model Integration
The Linear SVM model from Assignment 2 is loaded using joblib and integrated with the FastAPI backend. Predictions are made in real-time as users submit emails.

### Troubleshooting

## Backend Issues
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check that model files (.pkl) are in the backend directory
- Verify port 8000 is not in use

## Frontend Issues
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check CORS configuration if API calls fail

## CORS Errors
If you encounter CORS errors, ensure:
1. Backend CORS middleware allows `http://localhost:3000`
2. Frontend proxy is set in package.json

### License
This project is for educational purposes as part of COS30049 coursework.

### Acknowledgments
- Dataset: Combined Kaggle spam datasets and course-provided data
- Libraries: Scikit-learn, FastAPI, React, Material-UI, Chart.js, D3
```