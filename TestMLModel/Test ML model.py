# --- IMPORT LIBRARIES ---
import pandas as pd
import re
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import (
    confusion_matrix, ConfusionMatrixDisplay,
    roc_curve, auc,
    precision_recall_curve, average_precision_score
)

# --- 1. LOAD DATASET ---
file_path = r"C:\Users\damia\OneDrive\COS30049-Technology Innovation Project\Assignment2\Assignment Datasets\KaggleData\combined_data.csv"
spam_df = pd.read_csv(file_path)

# Inspect dataset
print("Columns:", spam_df.columns)
print(spam_df.head())
print("\nLabel distribution:\n", spam_df['label'].value_counts())  # 0=ham, 1=spam

# --- 2. CLEAN TEXT --- 
def clean_text(text):
    text = str(text).lower()                     # lowercase
    text = re.sub(r'http\S+', '', text)          # remove URLs
    text = re.sub(r'[^a-z\s]', '', text)        # remove non-letter chars
    text = re.sub(r'\s+', ' ', text).strip()    # remove extra spaces
    text = re.sub(r'escapenumber|escapelong', '', text) # remove escapenumber & escapelong
    return text

spam_df['clean_text'] = spam_df['text'].apply(clean_text)  # <-- use 'text' column

# --- 3. SPLIT FEATURES AND LABELS ---
X = spam_df['clean_text']
y = spam_df['label']

# --- 4. TRAIN/TEST SPLIT ---
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.25,
    random_state=42,
    stratify=y
)

# --- 5. VECTORIZE TEXT ---
vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
X_train_vect = vectorizer.fit_transform(X_train)
X_test_vect = vectorizer.transform(X_test)

# --- 6. TRAIN LOGISTIC REGRESSION ---
model = LogisticRegression(max_iter=500)
model.fit(X_train_vect, y_train)

# --- 7. EVALUATE MODEL ---
y_pred = model.predict(X_test_vect)
print("Test Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n", classification_report(y_test, y_pred))

# --- 8. TOP WORDS INDICATING SPAM ---
feature_names = vectorizer.get_feature_names_out()
coefs = model.coef_[0]

# Top 20 words most associated with spam
top_spam_idx = np.argsort(coefs)[-20:][::-1]
top_spam_words = [(feature_names[i], coefs[i]) for i in top_spam_idx]

print("\nTop predictive words for spam:")
for word, coef in top_spam_words:
    print(f"{word}: {coef:.3f}")


# --- CONFUSION MATRIX ---
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["HAM (0)", "SPAM (1)"])
disp.plot(cmap=plt.cm.Blues, values_format='d')
plt.title("Confusion Matrix")
plt.show()

# --- ROC CURVE ---
y_prob = model.predict_proba(X_test_vect)[:, 1]  # probability of spam (class 1)
fpr, tpr, thresholds = roc_curve(y_test, y_prob)
roc_auc = auc(fpr, tpr)

plt.figure(figsize=(6,6))
plt.plot(fpr, tpr, color="blue", label=f"ROC Curve (AUC = {roc_auc:.2f})")
plt.plot([0,1],[0,1], color="gray", linestyle="--")
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate (Recall)")
plt.title("ROC Curve")
plt.legend()
plt.show()

# --- PRECISION-RECALL CURVE ---
precision, recall, thresholds = precision_recall_curve(y_test, y_prob)
avg_precision = average_precision_score(y_test, y_prob)

plt.figure(figsize=(6,6))
plt.plot(recall, precision, color="green", label=f"AP = {avg_precision:.2f}")
plt.xlabel("Recall")
plt.ylabel("Precision")
plt.title("Precision-Recall Curve")
plt.legend()
plt.show()

# --- 1. SAVE MODEL AND VECTORIZER ---
#import joblib

# Save vectorizer
#joblib.dump(vectorizer, r"C:\Users\damia\spam_vectorizer.pkl")

# Save model
#joblib.dump(model, r"C:\Users\damia\spam_model.pkl")

#print("Model and vectorizer saved successfully!")
