import os
import pandas as pd
import pickle
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

# --- Model Training Function ---
def train_models(file_path, model_dir='models'):
    df = pd.read_csv(file_path)

    if 'target' not in df.columns:
        raise ValueError("The dataset must contain a 'target' column.")

    X = df.drop('target', axis=1)
    y = df['target']

    models = {
        "logistic_regression": LogisticRegression(max_iter=1000),
        "decision_tree": DecisionTreeClassifier(),
        "random_forest": RandomForestClassifier()
    }

    if not os.path.exists(model_dir):
        os.makedirs(model_dir)

    results = {}
    for name, model in models.items():
        model.fit(X, y)
        model_path = os.path.join(model_dir, f'{name}.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        results[name] = round(model.score(X, y), 4)  # Return accuracy rounded

    return results

# --- Prediction Function ---
def predict_with_model(answers, model_name, model_dir='models'):
    model_path = os.path.join(model_dir, f'{model_name}.pkl')
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model '{model_name}' not found at {model_path}.")

    with open(model_path, 'rb') as f:
        model = pickle.load(f)

    # Convert string answers to numerical values
    mapping = {
        "Yes": 1,
        "No": 0,
        "Sometimes": 0.5
    }

    numeric_answers = {}
    for key, value in answers.items():
        try:
            numeric_answers[key] = float(value)
        except (ValueError, TypeError):
            numeric_answers[key] = mapping.get(value.strip().capitalize(), 0)

    df = pd.DataFrame([numeric_answers])
    prediction = model.predict(df)[0]
    return int(prediction)
