# --- IMPORT LIBRARIES ---
import pandas as pd
import re
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix, ConfusionMatrixDisplay,
    roc_curve, auc, precision_recall_curve, average_precision_score
)
import joblib

# --- 1. LOAD DATASET ---
file_path = r"C:\Users\damia\Downloads\combined_data.csv"
spam_df = pd.read_csv(file_path)

print("Columns:", spam_df.columns)
print(spam_df.head())
print("\nLabel distribution:\n", spam_df['label'].value_counts())

# ============================================================================================
# --- 2. FEATURE ANALYSIS (on RAW text) ---
# ============================================================================================

def extract_features(df):
    features = pd.DataFrame()
    features["length_chars"] = df["text"].apply(lambda x: len(str(x)))
    features["length_words"] = df["text"].apply(lambda x: len(str(x).split()))

    # Ratio of uppercase letters to total characters
    features["upper_ratio"] = df["text"].apply(
        lambda x: sum(1 for c in str(x) if c.isupper()) / max(1, len(str(x)))
    )

    # Number of links (raw text)
    features["num_links"] = df["text"].apply(lambda x: len(re.findall(r"http\S+", str(x))))

    # Repetitive words (e.g., repeated within message)
    def count_repeated_words(text):
        words = re.findall(r'\b\w+\b', str(text).lower())
        return sum(words.count(w) > 1 for w in set(words))
    features["repeated_words"] = df["text"].apply(count_repeated_words)

    # Extract top frequent words from spam messages
    spam_texts = df[df["label"] == 1]["text"]
    common_spam_words = (
        pd.Series(" ".join(spam_texts).split())
        .value_counts()
        .head(30)
        .index.tolist()
    )

    # Count suspicious words
    features["suspicious_word_count"] = df["text"].apply(
        lambda x: sum(word in str(x).split() for word in common_spam_words)
    )
    return features

# Apply feature extraction
feature_df = extract_features(spam_df)
analysis_df = pd.concat([feature_df, spam_df["label"]], axis=1)

print("\n--- FEATURE ANALYSIS SUMMARY ---")
print(analysis_df.groupby("label").mean().round(2))
print("\nOverall averages:\n", feature_df.mean().round(2))
print(f"\nAverage email length: {feature_df['length_chars'].mean():.0f} characters")

# ============================================================================================
# --- 3. CLEAN TEXT (for ML models) ---
# ============================================================================================

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-z\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"escapenumber|escapelong", "", text)
    return text

spam_df["clean_text"] = spam_df["text"].apply(clean_text)

# ============================================================================================
# --- 4. TRAIN/TEST SPLIT ---
# ============================================================================================

X = spam_df["clean_text"]
y = spam_df["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.7,
    random_state=42,
    stratify=y
)

# ============================================================================================
# --- 5. TF-IDF VECTORIZATION ---
# ============================================================================================

vectorizer = TfidfVectorizer(stop_words="english", max_features=20)
X_train_vect = vectorizer.fit_transform(X_train)
X_test_vect = vectorizer.transform(X_test)

# ============================================================================================
# --- 6. TRAIN MULTIPLE MODELS IN A LOOP ---
# ============================================================================================

models = {
    "LogisticRegression": LogisticRegression(max_iter=500),
    "NaiveBayes": MultinomialNB(),
    "LinearSVM": LinearSVC()
}

results = {}

for name, model in models.items():
    print(f"\n=== Training {name} ===")
    model.fit(X_train_vect, y_train)
    y_pred = model.predict(X_test_vect)

    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}")
    print("Classification Report:\n", classification_report(y_test, y_pred))

    results[name] = acc

    # Save model and vectorizer
    model_path = fr"C:\Users\damia\Downloads\spam_model_{name}.pkl"
    vec_path = fr"C:\Users\damia\Downloads\spam_vectorizer_{name}.pkl"
    joblib.dump(model, model_path)
    joblib.dump(vectorizer, vec_path)
    print(f"✅ Saved {name} model → {model_path}")
    print(f"✅ Saved vectorizer → {vec_path}")

# ============================================================================================
# --- 7. COMPARE MODEL ACCURACIES ---
# ============================================================================================

print("\n=== MODEL COMPARISON ===")
for name, acc in results.items():
    print(f"{name}: {acc:.4f}")

# ============================================================================================
# --- 8. OPTIONAL: VISUALIZE ROC / PRECISION-RECALL FOR LOGISTIC REGRESSION ---
# ============================================================================================

log_model = models["LogisticRegression"]
y_prob = log_model.predict_proba(X_test_vect)[:, 1]

fpr, tpr, _ = roc_curve(y_test, y_prob)
roc_auc = auc(fpr, tpr)

plt.figure(figsize=(6, 6))
plt.plot(fpr, tpr, color="blue", label=f"ROC Curve (AUC = {roc_auc:.2f})")
plt.plot([0, 1], [0, 1], color="gray", linestyle="--")
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve - Logistic Regression")
plt.legend()
plt.show()

precision, recall, _ = precision_recall_curve(y_test, y_prob)
avg_precision = average_precision_score(y_test, y_prob)

plt.figure(figsize=(6, 6))
plt.plot(recall, precision, color="green", label=f"AP = {avg_precision:.2f}")
plt.xlabel("Recall")
plt.ylabel("Precision")
plt.title("Precision-Recall Curve - Logistic Regression")
plt.legend()
plt.show()
