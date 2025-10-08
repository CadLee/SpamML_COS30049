# Spam Email Detection - Machine Learning Project

## Overview
This project creates an three machine learning models to detect spam emails: **Logistic Regression**, **Naive Bayes**, and **Linear SVM**. The system processes email text data, extracts features, trains classification models.

---

## Table of Contents
- [Environment Setup](#environment-setup)
- [Model Training](#model-training)
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

Update dataset path (Assignment2.py, line 18)
Update model save path (Assignment2.py, line 160)
Update plot save path if needed (Assignment2.py, line 84)

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
cd <your directory>

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


## Project Files

### Main Scripts

| File | Purpose |
|------|---------|
| `Assignment2.py` | **Main training script** - trains all 3 models with feature engineering and 

### Data Files

| File | Description |
|------|-------------|
| `combined_data.csv` | Training dataset (text + labels) |

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
python Assignment2.py
```

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

## Model for Prediction

Once you have chosen your desired models `.pkl` you now deploy it along with the vectorizer to analyse spam emails in your programs.

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