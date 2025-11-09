import joblib
import re
import numpy as np
from pathlib import Path

class SpamDetector:
    def __init__(self):
        # Load the trained model and vectorizer
        model_path = Path(__file__).parent / "spam_model_LinearSVM.pkl"
        vectorizer_path = Path(__file__).parent / "spam_vectorizer.pkl"
        
        self.model = joblib.load(model_path)
        self.vectorizer = joblib.load(vectorizer_path)
        
        print("✓ Model and vectorizer loaded successfully!")
    
    def clean_text(self, text):
        """
        Clean and preprocess email text
        Same preprocessing used in Assignment 2
        """
        text = str(text).lower()
        text = re.sub(r'http\S+', '', text)  # Remove URLs
        text = re.sub(r'[^a-z\s]', '', text)  # Remove non-alphabetic characters
        text = re.sub(r'\s+', ' ', text).strip()  # Remove extra whitespace
        return text
    
    def predict(self, email_text):
        """
        Predict if an email is spam or ham
        
        Args:
            email_text (str): Raw email text
            
        Returns:
            dict: Prediction results with label and confidence
        """
        # Clean the text
        cleaned_text = self.clean_text(email_text)
        
        # Vectorize using TF-IDF
        vectorized_text = self.vectorizer.transform([cleaned_text])
        
        # Make prediction
        prediction = self.model.predict(vectorized_text)[0]
        
        # Get confidence score (decision function for SVM)
        confidence_score = self.model.decision_function(vectorized_text)[0]
        
        # Convert to probability-like score (0-1 range)
        # For SVM, positive values = spam, negative = ham
        confidence = abs(confidence_score)
        normalized_confidence = min(1.0, confidence / 3.0)  # Normalize to 0-1
        
        result = {
            "prediction": "Spam" if prediction == 1 else "Ham",
            "label": int(prediction),
            "confidence": float(normalized_confidence),
            "confidence_percentage": float(normalized_confidence * 100),
            "raw_score": float(confidence_score)
        }
        
        return result
    
    def get_model_info(self):
        """
        Return information about the model
        """
        return {
            "model_type": "Linear SVM",
            "accuracy": 90.50,
            "precision_ham": 0.94,
            "precision_spam": 0.88,
            "recall_ham": 0.87,
            "recall_spam": 0.94,
            "f1_ham": 0.90,
            "f1_spam": 0.91,
            "TN": 30374,
            "FP": 4717,
            "FN": 2055,
            "TP": 34166
        }