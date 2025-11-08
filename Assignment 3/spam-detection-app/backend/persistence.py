import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class PredictionDatabase:
    """
    Manages persistent storage of email classification predictions
    Stores data in JSON format for easy access and backup
    """
    
    def __init__(self, filepath: str = "predictions_database.json"):
        self.filepath = Path(filepath)
        self.init_database()
    
    def init_database(self):
        """Initialize database file if it doesn't exist"""
        if not self.filepath.exists():
            initial_data = {
                "metadata": {
                    "created_at": datetime.utcnow().isoformat() + "Z",
                    "last_updated": datetime.utcnow().isoformat() + "Z",
                    "version": "1.0",
                    "total_predictions": 0,
                    "total_spam": 0,
                    "total_ham": 0,
                    "average_confidence": 0.0
                },
                "predictions": []
            }
            self._write_database(initial_data)
            logger.info(f"Initialized database at {self.filepath}")
    
    def _read_database(self) -> Dict[str, Any]:
        """Read database from JSON file"""
        try:
            with open(self.filepath, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            self.init_database()
            return self._read_database()
        except json.JSONDecodeError:
            logger.error(f"Corrupted database file at {self.filepath}")
            return {"metadata": {}, "predictions": []}
    
    def _write_database(self, data: Dict[str, Any]):
        """Write database to JSON file"""
        try:
            with open(self.filepath, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info("Database saved successfully")
        except IOError as e:
            logger.error(f"Failed to write database: {e}")
    
    def add_prediction(self, prediction: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a new prediction to the database
        
        Args:
            prediction: Dictionary containing prediction data
            
        Returns:
            Updated prediction with ID and timestamp
        """
        db = self._read_database()
        
        # Generate unique ID
        pred_id = f"pred_{len(db['predictions']) + 1:06d}"
        
        # Create prediction record
        record = {
            "id": pred_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "email_text": prediction.get("text", "")[:200],  # Store first 200 chars
            "prediction": prediction.get("prediction", "Unknown"),
            "label": prediction.get("label", -1),
            "confidence": prediction.get("confidence", 0.0),
            "confidence_percentage": prediction.get("confidence_percentage", 0.0),
            "raw_score": prediction.get("raw_score", 0.0)
        }
        
        # Add to database
        db["predictions"].append(record)
        
        # Update metadata
        db["metadata"]["last_updated"] = datetime.utcnow().isoformat() + "Z"
        db["metadata"]["total_predictions"] = len(db["predictions"])
        db["metadata"]["total_spam"] = sum(
            1 for p in db["predictions"] if p["prediction"] == "Spam"
        )
        db["metadata"]["total_ham"] = sum(
            1 for p in db["predictions"] if p["prediction"] == "Ham"
        )
        
        # Calculate average confidence
        if db["predictions"]:
            avg_confidence = sum(
                p["confidence_percentage"] for p in db["predictions"]
            ) / len(db["predictions"])
            db["metadata"]["average_confidence"] = round(avg_confidence, 2)
        
        # Save database
        self._write_database(db)
        
        logger.info(f"Prediction {pred_id} added successfully")
        return record
    
    def get_all_predictions(self) -> List[Dict[str, Any]]:
        """Get all predictions from database"""
        db = self._read_database()
        return db["predictions"]
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get database metadata"""
        db = self._read_database()
        return db["metadata"]
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Calculate and return comprehensive statistics
        
        Returns:
            Dictionary with statistics for dashboard display
        """
        db = self._read_database()
        predictions = db["predictions"]
        
        if not predictions:
            return {
                "total_predictions": 0,
                "spam_count": 0,
                "ham_count": 0,
                "spam_percentage": 0.0,
                "average_confidence": 0.0,
                "max_confidence": 0.0,
                "min_confidence": 0.0
            }
        
        spam_count = sum(1 for p in predictions if p["prediction"] == "Spam")
        ham_count = len(predictions) - spam_count
        
        confidences = [p["confidence_percentage"] for p in predictions]
        
        return {
            "total_predictions": len(predictions),
            "spam_count": spam_count,
            "ham_count": ham_count,
            "spam_percentage": round((spam_count / len(predictions)) * 100, 2),
            "ham_percentage": round((ham_count / len(predictions)) * 100, 2),
            "average_confidence": round(sum(confidences) / len(confidences), 2),
            "max_confidence": round(max(confidences), 2),
            "min_confidence": round(min(confidences), 2)
        }
    
    def delete_all_predictions(self) -> bool:
        """Clear all predictions from database"""
        try:
            self.init_database()  # Reset to empty database
            logger.warning("All predictions deleted")
            return True
        except Exception as e:
            logger.error(f"Failed to delete predictions: {e}")
            return False
    
    def export_as_csv(self) -> str:
        """Export all predictions as CSV format"""
        predictions = self.get_all_predictions()
        
        if not predictions:
            return ""
        
        # Create CSV header
        csv_lines = ["ID,Timestamp,Prediction,Confidence %,Label"]
        
        # Add data rows
        for pred in predictions:
            csv_lines.append(
                f"{pred['id']},"
                f"{pred['timestamp']},"
                f"{pred['prediction']},"
                f"{pred['confidence_percentage']:.2f},"
                f"{pred['label']}"
            )
        
        return "\n".join(csv_lines)
    
    def get_predictions_by_date_range(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Get predictions within a date range
        
        Args:
            start_date: ISO format date string
            end_date: ISO format date string
            
        Returns:
            List of predictions within date range
        """
        db = self._read_database()
        predictions = db["predictions"]
        
        filtered = [
            p for p in predictions
            if start_date <= p["timestamp"] <= end_date
        ]
        
        return filtered
