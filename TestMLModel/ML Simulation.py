# --- BULK EMAIL SPAM PREDICTION FROM CSV ---
import pandas as pd
import joblib
import re

# Load saved vectorizer and model
vectorizer = joblib.load(r"C:\Users\damia\OneDrive\COS30049-Technology Innovation Project\Assignment2\TestMLModel\spam_vectorizer.pkl")
model = joblib.load(r"C:\Users\damia\OneDrive\COS30049-Technology Innovation Project\Assignment2\TestMLModel\spam_model.pkl")

# Text cleaning function
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'[^a-z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# --- 1. LOAD EMAILS FROM CSV ---
# CSV should have a column named 'text' containing the email content
file_path = r"C:\Users\damia\OneDrive\COS30049-Technology Innovation Project\Assignment2\TestMLModel\emails_to_test.csv"
emails_df = pd.read_csv(file_path)

# Clean emails
emails_df['clean_text'] = emails_df['text'].apply(clean_text)

# Vectorize
emails_vect = vectorizer.transform(emails_df['clean_text'])

# Predict labels and probabilities
emails_df['pred_label'] = model.predict(emails_vect)
emails_df['spam_prob'] = model.predict_proba(emails_vect)[:, 1]  # probability of being spam

# Map numeric label to readable
emails_df['label'] = emails_df['pred_label'].map({0: 'HAM', 1: 'SPAM'})

# --- 2. SAVE OR DISPLAY RESULTS ---
# Print first few results
print(emails_df[['text', 'label', 'spam_prob']].head(20))

# Optional: save predictions to a new CSV
emails_df.to_csv(r"C:\Users\damia\OneDrive\COS30049-Technology Innovation Project\Assignment2\TestMLModel\emails_predictions.csv", index=False)
