from nltk.tokenize import sent_tokenize


from gensim.models import KeyedVectors
from gensim.scripts.glove2word2vec import glove2word2vec

import tensorflow as tf

from titleSubjectivityClassifier.title_subj_utils import convert_text_into_vector_sequence, pad_sentence_vectors

class TitleSubjectivityClassifier:
    EXPECTED_SEQ_LENGTH = 120

    def __init__(self, model_filename: str, word_filename: str):
        # Load GloVe→word2vec embeddings
        self._word_model = KeyedVectors.load_word2vec_format(word_filename)

        # Try loading as a Keras model, else wrap in a TFSMLayer for legacy SavedModel

        self._subj_model = tf.keras.models.load_model(model_filename)


    def classify_sentences_in_text(self, text: str) -> dict:
        # Split into sentences (fallback to simple '.' split on LookupError)
        raw = self._sanitize(text)
        try:
            sentences = sent_tokenize(raw)
        except (LookupError, Exception):
            sentences = [s.strip() for s in raw.split('.') if s.strip()]

        subj_sents, obj_sents = [], []
        subj_probs, obj_probs = [], []

        for s in sentences:
            s_clean = self._clean(s)
            if not s_clean:
                continue

            # Vectorize & pad
            vecs = convert_text_into_vector_sequence(self._word_model, s_clean)
            if not vecs:
                continue

            batch = pad_sentence_vectors([vecs], max_len=self.EXPECTED_SEQ_LENGTH)

            # Obtain model predictions
            raw_pred = self._subj_model.predict(batch, verbose=0)
            # If TFSMLayer returns a dict, extract the first tensor
            if isinstance(raw_pred, dict):
                raw_pred = next(iter(raw_pred.values()))

            # raw_pred is now a numpy array of shape (batch_size, 2)
            p_subj, p_obj = raw_pred[0].tolist()

            # Assign sentence to subjective or objective list
            if p_subj > p_obj:
                subj_sents.append(s_clean)
            else:
                obj_sents.append(s_clean)

            subj_probs.append(p_subj)
            obj_probs.append(p_obj)

        # Compute overall probabilities and class label
        total = len(subj_probs) + len(obj_probs)
        overall_subj = sum(subj_probs) / total if total else 0.0
        overall_obj  = sum(obj_probs)  / total if total else 0.0
        class_label  = "subjective" if overall_subj > overall_obj else "objective"

        return {
            "subjective":                        subj_sents,
            "objective":                         obj_sents,
            "subjectivity_probs_per_sentence":   subj_probs,
            "objectivity_probs_per_sentence":    obj_probs,
            "subjectivity_prob":                 round(overall_subj, 4),
            "objectivity_prob":                  round(overall_obj, 4),
            "class_label":                       class_label,
        }

    def _sanitize(self, text: str) -> str:
        # Normalize newlines and ellipses
        t = text.replace('\n', '.\n').replace('...', '.').replace('..', '.')
        return t.replace('.[', '. [')

    def _clean(self, s: str) -> str:
        s2 = s.strip().replace('\n', '')
        return '' if s2 == '.' else s2