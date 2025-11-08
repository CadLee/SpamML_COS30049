from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from model import SpamDetector
from persistence import PredictionDatabase
from typing import List, Dict
import logging
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Spam Email Detection API by CoastGuard",
    description="API for classifying emails and storing predictions in JSON database",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize spam detector and database
try:
    spam_detector = SpamDetector()
    logger.info("Spam detector initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize spam detector: {e}")
    spam_detector = None

try:
    db = PredictionDatabase()
    logger.info("Prediction database initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize database: {e}")
    db = None

# Request models
class EmailInput(BaseModel):
    text: str = Field(..., min_length=1, description="Email text content")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "Congratulations! You've won a free iPhone. Click here to claim now!"
            }
        }

class BatchEmailInput(BaseModel):
    emails: List[str] = Field(..., min_items=1, max_items=100)

# Response models
class PredictionResponse(BaseModel):
    prediction: str
    label: int
    confidence: float
    confidence_percentage: float
    raw_score: float

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "Spam Email Detection API by CoastGuard",
        "version": "1.0.0",
        "endpoints": {
            "POST /predict": "Classify a single email and save",
            "POST /predict-batch": "Classify multiple emails",
            "GET /model-info": "Get model performance metrics",
            "GET /predictions": "Get all saved predictions",
            "GET /statistics": "Get aggregate statistics",
            "GET /export/csv": "Download predictions as CSV",
            "DELETE /predictions": "Clear all predictions",
            "GET /health": "Health check"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if spam_detector is None or db is None:
        raise HTTPException(status_code=503, detail="Services not initialized")
    return {
        "status": "healthy",
        "model_loaded": True,
        "database_ready": True
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_email(email: EmailInput):
    """
    Classify a single email as spam or ham and save to database
    
    - **text**: Email content to classify
    
    Returns prediction with confidence score and saves to JSON database
    """
    if spam_detector is None or db is None:
        raise HTTPException(status_code=503, detail="Services not initialized")
    
    try:
        # Validate input
        if not email.text.strip():
            raise HTTPException(status_code=400, detail="Email text cannot be empty")
        
        # Make prediction
        result = spam_detector.predict(email.text)
        
        # Save to database
        db.add_prediction({
            "text": email.text,
            **result
        })
        
        logger.info(f"Prediction made: {result['prediction']} (confidence: {result['confidence_percentage']:.2f}%)")
        
        return result
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict-batch")
async def predict_batch(batch: BatchEmailInput):
    """
    Classify multiple emails at once and save all to database
    
    - **emails**: List of email texts (max 100)
    
    Returns list of predictions and saves all to JSON database
    """
    if spam_detector is None or db is None:
        raise HTTPException(status_code=503, detail="Services not initialized")
    
    try:
        results = []
        for idx, email_text in enumerate(batch.emails):
            if not email_text.strip():
                results.append({
                    "index": idx,
                    "error": "Empty email text"
                })
            else:
                prediction = spam_detector.predict(email_text)
                # Save to database
                db.add_prediction({
                    "text": email_text,
                    **prediction
                })
                prediction["index"] = idx
                results.append(prediction)
        
        spam_count = sum(1 for r in results if r.get("prediction") == "Spam")
        ham_count = len(results) - spam_count
        
        return {
            "total": len(results),
            "spam_count": spam_count,
            "ham_count": ham_count,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

@app.get("/model-info")
async def get_model_info():
    """
    Get information about the trained model
    
    Returns model type and performance metrics from Assignment 2
    """
    if spam_detector is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
    
    return spam_detector.get_model_info()

@app.get("/predictions")
async def get_predictions(limit: int = None):
    """
    Get all saved predictions from database
    
    - **limit**: Optional - return only last N predictions
    
    Returns list of all classification predictions stored in JSON
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
    
    try:
        predictions = db.get_all_predictions()
        
        if limit:
            predictions = predictions[-limit:]
        
        return {
            "total": len(predictions),
            "predictions": predictions
        }
    except Exception as e:
        logger.error(f"Failed to retrieve predictions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve predictions")

@app.get("/statistics")
async def get_statistics():
    """
    Get aggregate statistics from all predictions
    
    Returns total predictions, spam/ham counts, averages, etc.
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
    
    try:
        stats = db.get_statistics()
        metadata = db.get_metadata()
        
        return {
            "statistics": stats,
            "metadata": metadata
        }
    except Exception as e:
        logger.error(f"Failed to get statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")

@app.get("/export/csv")
async def export_predictions_csv():
    """
    Export all predictions as CSV file
    
    Returns CSV file for download
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
    
    try:
        csv_content = db.export_as_csv()
        
        if not csv_content:
            raise HTTPException(status_code=400, detail="No predictions to export")
        
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=predictions.csv"}
        )
    except Exception as e:
        logger.error(f"Failed to export CSV: {e}")
        raise HTTPException(status_code=500, detail="Failed to export CSV")

@app.get("/export/json")
async def export_predictions_json():
    """
    Export all predictions as JSON file
    
    Returns JSON file for download
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
    
    try:
        predictions = db.get_all_predictions()
        
        if not predictions:
            raise HTTPException(status_code=400, detail="No predictions to export")
        
        return StreamingResponse(
            iter([json.dumps({"predictions": predictions}, indent=2)]),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=predictions.json"}
        )
    except Exception as e:
        logger.error(f"Failed to export JSON: {e}")
        raise HTTPException(status_code=500, detail="Failed to export JSON")

@app.delete("/predictions")
async def clear_predictions():
    """
    Clear all predictions from database
    
    WARNING: This action cannot be undone. All prediction history will be deleted.
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
    
    try:
        success = db.delete_all_predictions()
        
        if success:
            logger.warning("All predictions cleared by user")
            return {
                "message": "All predictions have been cleared",
                "status": "success"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to clear predictions")
    except Exception as e:
        logger.error(f"Failed to clear predictions: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear predictions")

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "error": exc.detail,
        "status_code": exc.status_code
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled error: {str(exc)}")
    return {
        "error": "Internal server error",
        "detail": str(exc),
        "status_code": 500
    }

import json

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
