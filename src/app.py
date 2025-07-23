import os
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from src.analysis import train_models, predict_with_model

# --- Setup ---
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')
STATIC = os.path.join(BASE_DIR, 'static')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
MODEL_FOLDER = os.path.join(BASE_DIR, 'models')

app = Flask(__name__, template_folder=TEMPLATE_DIR, static_folder=STATIC)
CORS(app)

# Ensure necessary folders exist
for folder in [UPLOAD_FOLDER, MODEL_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global variable to store metrics
trained_model_metrics = {}

# --- Routes ---

@app.route('/')
def home():
    return render_template('index.html')  # templates/index.html must exist

@app.route('/upload', methods=['POST'])
def upload_file():
    global trained_model_metrics
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and file.filename.endswith('.csv'):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            results = train_models(filepath, model_dir=MODEL_FOLDER)
            trained_model_metrics = results  # Save for graph view
            return jsonify({"message": "Models trained", "accuracy": results})
        except Exception as e:
            return jsonify({"error": f"Training failed: {str(e)}"}), 500

    return jsonify({"error": "Invalid file format. Only CSV allowed."}), 400

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data or 'answers' not in data or 'model' not in data:
            return jsonify({"error": "Invalid request format"}), 400

        answers = data['answers']
        model_name = data['model']

        print("Received answers:", answers)
        print("Using model:", model_name)

        prediction = predict_with_model(answers, model_name, model_dir=MODEL_FOLDER)
        return jsonify({"prediction": prediction})

    except Exception as e:  
        print("Error in /predict:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/metrics', methods=['GET'])
def get_metrics():
    if not trained_model_metrics:
        return jsonify({"error": "No metrics found. Train models first."}), 400
    return jsonify(trained_model_metrics)

# --- Run ---
if __name__ == '__main__':
    app.run(debug=True)
