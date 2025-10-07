# Spam Email Detection - Machine Learning Project

## Overview
This project implements a spam email detection system using three machine learning models: **Logistic Regression**, **Naive Bayes**, and **Linear SVM**. The system processes email text data, extracts features, trains classification models, and provides predictions on new emails.

---

## Table of Contents
- [Environment Setup](#environment-setup)
- [Data Processing](#data-processing)
- [Model Training](#model-training)
- [Making Predictions](#making-predictions)
- [Project Files](#project-files)

---

## Environment Setup

### Prerequisites
- Anaconda or Miniconda installed
- Python 3.8 or higher

### Step 1: Create Conda Environment

Open your terminal/command prompt and run:

```bash
# Create new environment
conda create -n spam_detection python=3.10 -y

# Activate environment
conda activate spam_detection
```

### Step 2: Install Required Libraries

```bash
# Install data science libraries
conda install pandas numpy matplotlib -y

# Install scikit-learn
conda install scikit-learn -y

# Install joblib
conda install joblib -y
```

### Step 3: Verify Installation

```bash
python -c "import pandas, numpy, sklearn, joblib; print('All packages installed successfully!')"
```

---



## Configuration and Customization

Before running the project, you need to update several file paths in the code to match your system. Below are the specific lines that require modification:

### Files to Update: `Assignment2.py`

Open `Assignment2.py` and update the following lines:

#### **Line 18: Dataset Path**
```python
file_path = r"C:\Users\damia\Downloads\combined_data.csv"

Change to: Your actual path to the combined_data.csv file
file_path = r"C:\Users\YOUR_USERNAME\YOUR_FOLDER\combined_data.csv"
Line 84: Visualization Save Path (Optional)
Current:
plt.savefig(r'C:\Users\damia\Downloads\confusion_matrix_{model_name}.png')
Change to: Your desired location for saving plots (or remove this line if you don't want to save plots)
plt.savefig(r'C:\Users\YOUR_USERNAME\YOUR_FOLDER\confusion_matrix_{model_name}.png')
Line 160: Model Save Path
Current:
save_path = r"C:\Users\damia\Downloads\"
Change to: Your desired location for saving trained models
save_path = r"C:\Users\YOUR_USERNAME\YOUR_FOLDER\"
Files to Update: ML_Simulation.py
If you plan to use the prediction script, update these paths:
Line 6: Vectorizer Path
Current:
vectorizer = joblib.load('C:/Users/damia/Downloads/spam_vectorizer.pkl')
Change to: Path where your vectorizer was saved
vectorizer = joblib.load('C:/Users/YOUR_USERNAME/YOUR_FOLDER/spam_vectorizer.pkl')
Line 7: Model Path
Current:
model = joblib.load('C:/Users/damia/Downloads/spam_model_LogisticRegression.pkl')
Change to: Path where your model was saved
model = joblib.load('C:/Users/YOUR_USERNAME/YOUR_FOLDER/spam_model_LogisticRegression.pkl')
Line 20: Test Email CSV Path
Current:
emails_df = pd.read_csv('TestMLModel/emails_to_test.csv')
Change to: Path to your email test file
emails_df = pd.read_csv('YOUR_PATH/emails_to_test.csv')
Quick Setup Checklist

Update dataset path (Assignment2.py, line 18)
Update model save path (Assignment2.py, line 160)
Update plot save path if needed (Assignment2.py, line 84)
Update vectorizer load path (ML_Simulation.py, line 6)
Update model load path (ML_Simulation.py, line 7)
Update test email CSV path (ML_Simulation.py, line 20)

## Data Processing

### Dataset Requirements
- **File**: `combined_data.csv`
- **Location**: Update path in `Assignment2.py` 
- **Columns**: 
  - `text` - Email content
  - `label` - Classification (0 = Ham/Legitimate, 1 = Spam)

### Processing Steps

The `Assignment2.py` script performs the following data processing:

#### 1. Load Dataset
```python
file_path = r"C:\Users\damia\Downloads\combined_data.csv"
spam_df = pd.read_csv(file_path)
```

#### 2. Remove Duplicates
Removes duplicate emails based on the `text` column to ensure data quality.

#### 3. Feature Extraction
Creates 4 custom features from raw email text:
- **Total Words**: Word count in the email
- **Digit Count**: Number of digits present
- **Special Character Count**: Non-alphanumeric characters
- **Average Word Length**: Mean length of words

#### 4. Text Cleaning
The `clean_text()` function processes text by:
- Converting to lowercase
- Removing URLs (http/https links)
- Removing special characters and numbers
- Removing extra whitespace
- Stripping escape sequences

#### 5. Train/Test Split
- **Split ratio**: 20% training, 80% testing
- **Stratification**: Maintains class distribution
- **Random state**: 42 (for reproducibility)

#### 6. TF-IDF Vectorization
- **Stop words**: English
- **Max features**: 100
- Converts cleaned text into numerical features

---

## Model Training

### Run the Training Script

```bash
# Navigate to project directory
cd SpamML_COS30049/TestMLModel

# Run training script
python Assignment2.py
```

### What Happens During Training

The script trains **three models** simultaneously:

1. **Logistic Regression** (max_iter=500)
   - Best for probability-based predictions
   - Supports ROC/PR curves

2. **Naive Bayes** (MultinomialNB)
   - Fast and effective for text classification
   - Works well with TF-IDF features

3. **Linear SVM** (LinearSVC)
   - High accuracy for binary classification
   - Uses decision scores for evaluation

### Training Outputs

For each model, you'll see:
- Training progress messages
- **Accuracy score**
- **Classification report** (precision, recall, F1-score)
- **Visualization plots**:
  - Confusion Matrix
  - ROC Curve (with AUC score)
  - Precision-Recall Curve

### Saved Model Files

After training, the following files are saved to `C:\Users\damia\Downloads\`:

```

spam_model.pkl
spam_vectorizer.pkl
```

**Note**: Update the save path in `Assignment2.py` (line 160) if you want to save to a different location.

---

## Making Predictions

### Option 1: Predict on Bulk Emails (Recommended)

Use `ML_Simulation.py` to predict on multiple emails from a CSV file.

#### Step 1: Prepare Your Email CSV

Create a CSV file with a `text` column containing emails:

```csv
text
"Congratulations! You've won a free prize. Click here now!"
"Meeting scheduled for tomorrow at 3 PM."
"URGENT: Your account will be suspended. Verify now!"
```

Save as `emails_to_test.csv` in the `TestMLModel/` folder.

#### Step 2: Update File Paths

In `ML_Simulation.py`, ensure these paths are correct:
- Line 6: Path to vectorizer `.pkl` file
- Line 7: Path to model `.pkl` file  
- Line 20: Path to your email CSV file

#### Step 3: Run Predictions

```bash
python ML_Simulation.py
```

#### Output

- Displays first 20 predictions with:
  - Original email text
  - Predicted label (HAM/SPAM)
  - Spam probability (0-1)
- Saves all predictions to `emails_predictions.csv`

### Option 2: Predict Single Emails in Code

Create a new Python file or add to existing script:

```python
import joblib
import re
import pandas as pd

# Load saved model and vectorizer
vectorizer = joblib.load('TestMLModel/spam_vectorizer.pkl')
model = joblib.load('TestMLModel/spam_model_LogisticRegression.pkl')

# Clean text function
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'[^a-z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Predict on new email
new_email = "Congratulations! You've won $1000. Claim now!"
cleaned = clean_text(new_email)
vectorized = vectorizer.transform([cleaned])
prediction = model.predict(vectorized)[0]

result = "SPAM" if prediction == 1 else "HAM"
print(f"Prediction: {result}")
```

---

## Project Files

### Main Scripts

| File | Purpose |
|------|---------|
| `Assignment2.py` | **Main training script** - trains all 3 models with feature engineering and visualization |
| `ML_Simulation.py` | **Batch prediction script** - predicts on multiple emails from CSV |
| `3ModelTest.py` | Testing script - simplified version for quick model comparison |
| `FinalDraft.py` | Alternative training script (not used in final submission) |

### Data Files

| File | Description |
|------|-------------|
| `combined_data.csv` | Training dataset (text + labels) |
| `emails_to_test.csv` | Sample emails for prediction |
| `emails_predictions.csv` | Prediction results output |

### Model Files (Generated)

| File | Description |
|------|-------------|
| `spam_model_{name}.pkl` | Trained model for each algorithm |
| `spam_vectorizer.pkl` | TF-IDF vectorizer |

---

## Quick Start Guide

### 1. First Time Setup
```bash
# Create and activate environment
conda create -n spam_detection python=3.10 -y
conda activate spam_detection

# Install dependencies
conda install pandas numpy matplotlib scikit-learn joblib -y
```

### 2. Train Models
```bash
cd SpamML_COS30049/TestMLModel
python Assignment2.py
```

### 3. Make Predictions
```bash
# Prepare your emails_to_test.csv file
python ML_Simulation.py
```

---

## Troubleshooting

### Issue: `FileNotFoundError` when loading dataset
**Solution**: Update the `file_path` in `Assignment2.py` (line 18) to match your dataset location.

### Issue: `ModuleNotFoundError`
**Solution**: Ensure conda environment is activated:
```bash
conda activate spam_detection
```

### Issue: Model files not found during prediction
**Solution**: 
1. Run `Assignment2.py` first to train and save models
2. Check the save path in `Assignment2.py` (line 160)
3. Update load paths in `ML_Simulation.py` (lines 6-7) to match

### Issue: Import errors for sklearn
**Solution**: 
```bash
conda install scikit-learn -y
```

---

## Model Performance

After training, compare model accuracies from the final output:

```
MODEL COMPARISON
LogisticRegression: {acc:.4f}
NaiveBayes: {acc:.4f}
LinearSVM: {acc:.4f}
```

Choose the model with the highest accuracy for your predictions by loading the corresponding `.pkl` file.

---

## Notes

- **Dataset Characteristics**: The dataset uses lowercase text with sanitized URLs
- **Feature Engineering**: Custom features (word count, digit count, etc.) improve model performance
- **Model Selection**: All three models use different approaches:
  - Logistic Regression: probability-based
  - Naive Bayes: statistical approach
  - Linear SVM: margin-based classification
- **Visualization**: ROC and PR curves may not display for all models depending on their capabilities

---

## Contributors

COS30049 - Computing Technology Innovation Project  
Swinburne University of Technology

---

## License

COS30049 Assignment 2.