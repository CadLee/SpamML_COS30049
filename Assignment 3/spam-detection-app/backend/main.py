from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from model import SpamDetector
from typing import List, Dict
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Spam Email Detection API",
    description="API for classifying emails as spam or ham using Linear SVM",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize spam detector
try:
    spam_detector = SpamDetector()
    logger.info("Spam detector initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize spam detector: {e}")
    spam_detector = None

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
    emails: List[str] = Field(..., min_items=1, max_items=100) # type: ignore

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
        "message": "Spam Email Detection API",
        "version": "1.0.0",
        "endpoints": {
            "POST /predict": "Classify a single email",
            "POST /predict-batch": "Classify multiple emails",
            "GET /model-info": "Get model performance metrics",
            "GET /health": "Health check"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if spam_detector is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {
        "status": "healthy",
        "model_loaded": True
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_email(email: EmailInput):
    """
    Classify a single email as spam or ham
    
    - **text**: Email content to classify
    
    Returns prediction with confidence score
    """
    if spam_detector is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
    
    try:
        # Validate input
        if not email.text.strip():
            raise HTTPException(status_code=400, detail="Email text cannot be empty")
        
        # Make prediction
        result = spam_detector.predict(email.text)
        
        logger.info(f"Prediction made: {result['prediction']} (confidence: {result['confidence_percentage']:.2f}%)")
        
        return result
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict-batch")
async def predict_batch(batch: BatchEmailInput):
    """
    Classify multiple emails at once
    
    - **emails**: List of email texts (max 100)
    
    Returns list of predictions
    """
    if spam_detector is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
    
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)