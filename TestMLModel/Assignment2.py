# IMPORT LIBRARIES
import pandas as pd
import re
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    roc_curve, auc, precision_recall_curve, average_precision_score
)
import joblib

# 1. LOAD DATASET
file_path = r"C:\Users\damia\Downloads\combined_data2.csv" #ENTER COMBINED DATA SET LOCATION HERE!
spam_df = pd.read_csv(file_path)

print("Columns:", spam_df.columns)
print(spam_df.head())
print("\nLabel distribution:\n", spam_df['label'].value_counts())

#remove duplicated + before and after
before = len(spam_df)
spam_df.drop_duplicates(subset=["text"], inplace=True)
after = len(spam_df)
removed = before - after
print("\n")
print(f"\nRemoved {removed} duplicate texts (from {before} → {after} rows)")

# 2. FEATURE ENGINEERING (on RAW dataset)

def extract_features(df):
    features = pd.DataFrame()
    texts = df["text"].astype(str)

    features["Total Characters"] = texts.apply(len)
    features["Total Words"] = texts.apply(lambda x: len(x.split()))
    features["Digit Count"] = texts.apply(lambda x: sum(c.isdigit() for c in x))
    features["Special Character Count"] = texts.apply(lambda x: sum(not c.isalnum() and not c.isspace() for c in x))
    features["Average Word Length (chars)"] = texts.apply(lambda x: np.mean([len(w) for w in x.split()]) if len(x.split()) > 0 else 0)

    return features

# Apply feature extraction
feature_df = extract_features(spam_df)
analysis_df = pd.concat([feature_df, spam_df["label"]], axis=1)


print("\nFEATURE ANALYSIS SUMMARY PER ROW")
print(analysis_df.groupby("label").mean().round(2))
overall_avg = feature_df.mean().round(2).to_frame("Overall Average")
print("\n")
print(overall_avg)
print(f"\nAverage email length: {feature_df['Total Characters'].mean():.0f} characters")

# 3. CLEAN TEXT (not strictly necessary but done to be sure)
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-z\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"escapenumber|escapelong", "", text)
    return text

spam_df["clean_text"] = spam_df["text"].apply(clean_text)

# 4. TRAIN/TEST SPLIT
X = spam_df["clean_text"]
y = spam_df["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.7, random_state=42, stratify=y
)

# 5. TF-IDF VECTORIZATION (fit once)
vectorizer = TfidfVectorizer(stop_words="english", max_features=20)
X_train_vect = vectorizer.fit_transform(X_train)
X_test_vect = vectorizer.transform(X_test)

#save vectorizer
vec_path = r"C:\Users\damia\Downloads\spam_vectorizer.pkl" #ENTER LOCATION TO SAVE VECTORIZER!
joblib.dump(vectorizer, vec_path)
print("\n")
print(f"Saved vectorizer: {vec_path}")

# 6. TRAIN THE MODELS + PREPARE PLOT & REPORT
models = {
    "LogisticRegression": LogisticRegression(max_iter=500),
    "NaiveBayes": MultinomialNB(),
    "LinearSVM": LinearSVC()
}

results = {}

for name, model in models.items():
    print(f"\nTraining {name}")
    model.fit(X_train_vect, y_train)
    y_pred = model.predict(X_test_vect)

    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}")
    print("Classification Report:\n", classification_report(y_test, y_pred))
    results[name] = acc

    # --- Plotting Confusion Matrix, ROC, PR Curve ---
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    fig.suptitle(f"Model Evaluation: {name}", fontsize=14, weight="bold")

    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    axes[0].imshow(cm, interpolation='nearest', cmap=plt.cm.Blues) # pyright: ignore[reportAttributeAccessIssue]
    axes[0].set_title("Confusion Matrix")
    axes[0].set_xticks([0, 1])
    axes[0].set_yticks([0, 1])
    axes[0].set_xticklabels(["HAM (0)", "SPAM (1)"])
    axes[0].set_yticklabels(["HAM (0)", "SPAM (1)"])
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            axes[0].text(j, i, cm[i, j], ha="center", va="center", color="black")
    axes[0].set_ylabel("True label")
    axes[0].set_xlabel("Predicted label")

    # ROC & PR Curves
    try:
        if hasattr(model, "predict_proba"):
            y_score = model.predict_proba(X_test_vect)[:, 1]
        else:
            y_score = model.decision_function(X_test_vect)

        # ROC
        fpr, tpr, _ = roc_curve(y_test, y_score)
        roc_auc = auc(fpr, tpr)
        axes[1].plot(fpr, tpr, color="blue", label=f"AUC = {roc_auc:.2f}")
        axes[1].plot([0, 1], [0, 1], color="gray", linestyle="--")
        axes[1].set_title("ROC Curve")
        axes[1].set_xlabel("False Positive Rate")
        axes[1].set_ylabel("True Positive Rate")
        axes[1].legend()

        # Precision-Recall
        precision, recall, _ = precision_recall_curve(y_test, y_score)
        avg_precision = average_precision_score(y_test, y_score)
        axes[2].plot(recall, precision, color="green", label=f"AP = {avg_precision:.2f}")
        axes[2].set_title("Precision-Recall Curve")
        axes[2].set_xlabel("Recall")
        axes[2].set_ylabel("Precision")
        axes[2].legend()
    except Exception as e:
        print(f"Could not plot ROC/PR for {name}: {e}")
        axes[1].set_visible(False)
        axes[2].set_visible(False)

    plt.tight_layout(rect=[0, 0.03, 1, 0.95]) # pyright: ignore[reportArgumentType]
    plt.show()

    # Save the model only
    model_path = fr"C:\Users\damia\Downloads\spam_model_{name}.pkl" #ENTER LOCATION TO SAVE MODELS!
    joblib.dump(model, model_path)
    print(f"Saved {name} model: {model_path}")

# 7. COMPARE MODEL ACCURACIES
print("\nMODEL COMPARISON")
for name, acc in results.items():
    print(f"{name}: {acc:.4f}")
