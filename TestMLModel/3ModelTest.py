import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.metrics import classification_report

# -------------------------
# 1. Load your dataset
# -------------------------
file_path = r"SpamDataset\combined_data.csv"
df = pd.read_csv(file_path)

X = df["text"]
y = df["label"]

# -------------------------
# 2. Split train/test
# -------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# -------------------------
# 3. Vectorization (TF-IDF with unigrams + bigrams)
# -------------------------
vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1,2), max_features=10000)
X_train_vect = vectorizer.fit_transform(X_train)
X_test_vect = vectorizer.transform(X_test)

# -------------------------
# 4. Define Models
# -------------------------
models = {
    "Naive Bayes": MultinomialNB(),
    "Logistic Regression": LogisticRegression(max_iter=1000),
    "Linear SVM": LinearSVC()
}

# -------------------------
# 5. Train & Evaluate
# -------------------------
for name, model in models.items():
    print("="*50)
    print(f"Training {name}...")
    model.fit(X_train_vect, y_train)
    y_pred = model.predict(X_test_vect)
    print(f"Results for {name}:\n")
    print(classification_report(y_test, y_pred, target_names=["Ham", "Spam"]))
