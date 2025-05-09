from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import nltk
import numpy as np
import torch
from titleSubjectivityClassifier.title_subj_classifier import TitleSubjectivityClassifier
from subjectivityClassifier.subj_classifier import SubjectivityClassifier
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import asyncio
import concurrent.futures
import joblib
from typing import List, Dict

nltk.download('punkt')

app = FastAPI()

title_subjectivity_classifier = None
subjectivity_classifier = None
political_classifier = None
tokenizer = None
reliability_model = None
reliability_scaler = None

executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)

@app.on_event("startup")
async def load_models():
    """ Load all models at startup """
    global title_subjectivity_classifier, subjectivity_classifier, political_classifier, tokenizer

    try:
        title_subjectivity_classifier = TitleSubjectivityClassifier(
            model_filename ="titleSubjectivityClassifier/subj-39.tf",
            word_filename ="titleSubjectivityClassifier/glove.6B.50d.word2vec.txt"
        )
        print("✅ Title Subjectivity Classifier Loaded")
    except Exception as e:
        print(f"❌ Error loading Subjectivity Classifier: {e}")

    try:
        subjectivity_classifier = SubjectivityClassifier(
            model_filename ="subjectivityClassifier/subj-49.tf",
            word_filename ="subjectivityClassifier/glove.6B.50d.word2vec.txt"
        )
        print("✅ Subjectivity Classifier Loaded")
    except Exception as e:
        print(f"❌ Error loading Subjectivity Classifier: {e}")

    try:
        MODEL_PATH = "politicalClassifier"
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        political_classifier = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
        political_classifier.eval()
        print("✅ Political Bias Classifier Loaded")
    except Exception as e:
        print(f"❌ Error loading Political Bias Model: {e}")

    try:
        global reliability_model, reliability_scaler
        reliability_model = joblib.load("mlp_model.joblib")
        reliability_scaler = joblib.load("scaler.joblib")
        print("✅ Reliability Model Loaded")
    except Exception as e:
        print(f"❌ Error loading Reliability Model: {e}")


class InputText(BaseModel):
    text: str


@app.get("/")
def read_root():
    return {"message": "FastAPI running with Title Subjectivity Classifier, Subjectivity Classifier, Sentence Transformer & Political Analyzer!"}


@app.post("/titleSubjectivity")
async def titleSubjectivity(input_data: InputText):
    """ Runs subjectivity classification asynchronously """
    if title_subjectivity_classifier is None:
        raise HTTPException(status_code=500, detail="Title subjectivity classifier not initialized")

    result = title_subjectivity_classifier.classify_sentences_in_text(input_data.text)

    return {
        "subjective_sentences": result.get("subjective", []),
        "objective_sentences": result.get("objective", []),
        "subjectivity_prob": result.get("subjectivity_prob", []),
        "objectivity_prob": result.get("objectivity_prob", []),
        "class_label": result.get("class_label", None),
    }


@app.post("/subjectivity")
async def subjectivity(input_data: InputText):
    """ Runs subjectivity classification asynchronously """
    if subjectivity_classifier is None:
        raise HTTPException(status_code=500, detail="Subjectivity classifier not initialized")

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, subjectivity_classifier.classify_sentences_in_text, input_data.text)

    return {
        "subjective_sentences": result.get("subjective", []),
        "objective_sentences": result.get("objective", []),
        "subjectivity_prob": result.get("subjectivity_prob", []),
        "objectivity_prob": result.get("objectivity_prob", []),
        "class_label": result.get("class_label", None),
    }


@app.post("/political")
async def political_bias(input_data: InputText):
    """ Classifies political bias of input text with probabilities """
    if political_classifier is None or tokenizer is None:
        raise HTTPException(status_code=500, detail="Political Bias Model not initialized")

    loop = asyncio.get_event_loop()
    prediction, probabilities = await loop.run_in_executor(executor, classify_political_bias, input_data.text)

    return {
        "prediction": prediction,
        "probabilities": probabilities  # Probabilities for Left, Center, Right
    }


def classify_political_bias(text: str):
    """Predicts political bias category and returns probabilities"""
    label_mapping = {0: "Left", 1: "Center", 2: "Right"}

    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)

    with torch.no_grad():
        outputs = political_classifier(**inputs)
        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits,
                                                    dim=1).squeeze().tolist()  # Convert to softmax probabilities

    predicted_label = torch.argmax(logits, dim=1).item()

    return label_mapping[predicted_label], {
        "Left": round(probabilities[0], 4),
        "Center": round(probabilities[1], 4),
        "Right": round(probabilities[2], 4)
}


class ReliabilityRequest(BaseModel):
    bias_probs: Dict[str, float]        # e.g. {"Left": 0.2, "Center": 0.6, "Right": 0.2}
    objectivity_score: float            # 0.0–1.0
    credibility_score: str              # "credible", "mixed", "uncredible"
    similarity_scores: List[float]      # list of 10 floats in [0,1]
    title_objectivity: float            # 0.0–1.0
    grammatical_error_rate: float       # 0.0–1.0

class ReliabilityResponse(BaseModel):
    reliability: float


@app.post("/reliability", response_model=ReliabilityResponse)
async def reliability_inference(input_data: ReliabilityRequest):
    """ Predicts reliability score based on bias, objectivity, credibility, and similarity """
    if reliability_model is None or reliability_scaler is None:
        raise HTTPException(status_code=500, detail="Reliability model not loaded")

    try:
        left   = input_data.bias_probs["Left"]
        right  = input_data.bias_probs["Right"]
    except KeyError:
        raise HTTPException(400, "bias_probs must contain Left and Right")

    extremism = abs(left - right)

    # credibility mapping
    cred_map = {"credible": 1.0, "mixed": 0.5, "uncredible": 0.0}
    cred_score = cred_map.get(input_data.credibility_score.lower())
    if cred_score is None:
        raise HTTPException(400, "Invalid credibility_score")

    sims = input_data.similarity_scores
    if not sims or not all(0 <= s <= 1 for s in sims):
        raise HTTPException(400, "similarity_scores must be a list of floats in [0,1]")

    sim_mean = float(np.mean(sims)) if sims else 0.0
    sim_max  = float(np.max(sims)) if sims else 0.0
    sim_min  = float(np.min(sims)) if sims else 0.0
    sim_std  = float(np.std(sims)) if sims else 0.0

    features = np.array([[
        left, right, extremism,
        input_data.objectivity_score, cred_score,
        sim_mean, sim_max, sim_min, sim_std,
        input_data.title_objectivity,
        input_data.grammatical_error_rate
    ]])

    features_scaled = reliability_scaler.transform(features)
    raw_score = float(reliability_model.predict(features_scaled)[0])
    score = max(0.0, min(1.0, raw_score))

    return ReliabilityResponse(reliability=round(score, 4))