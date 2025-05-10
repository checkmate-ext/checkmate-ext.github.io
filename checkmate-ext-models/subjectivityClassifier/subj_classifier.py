from nltk.tokenize import sent_tokenize
import nltk
nltk.download('punkt_tab')
from gensim.models import KeyedVectors
from gensim.scripts.glove2word2vec import glove2word2vec

from subjectivityClassifier.subj_model import SubjectivityPredictor
from subjectivityClassifier.subj_utils import is_subjective, convert_text_into_vector_sequence

class SubjectivityClassifier(object):
    def __init__(self, model_filename, word_filename):
        self._word_model = KeyedVectors.load_word2vec_format(word_filename)
        self._subj_model = SubjectivityPredictor.load(model_filename)

    def classify_sentences_in_text(self, text):
        '''

        :param text: The document that needs to be classified
        :return: A dict with two keys:
                 'subjective': the list of subjective sentences in the text
                 'objective': the list of objective sentences in the text
                 'subjectivity_prob': the overall subjectivity probability of the text
                 'objectivity_prob': the overall objectivity probability of the text
                 'class_label': the class label for the whole text ('objective' or 'subjective')
        '''
        sentences_list = sent_tokenize(self.__sanitize_text(text))
        subjective_sentences = []
        objective_sentences = []
        subjectivity_probs = []
        objectivity_probs = []

        for sentence in sentences_list:
            sentence = self.__clean_sentence(sentence)
            if not sentence:
                continue
            prediction = self._subj_model.predict(convert_text_into_vector_sequence(self._word_model, sentence))
            if prediction == is_subjective:
                subjective_sentences.append(sentence)
                subjectivity_probs.append(prediction[0])
            else:
                objective_sentences.append(sentence)
                objectivity_probs.append(prediction[1])
        overall_subjectivity_prob = sum(subjectivity_probs) / len(sentences_list) if sentences_list else 0
        overall_objectivity_prob = sum(objectivity_probs) / len(sentences_list) if sentences_list else 0

        # Determine the class label for the whole text
        class_label = 'subjective' if overall_subjectivity_prob > overall_objectivity_prob else 'objective'

        return {
            'subjective': subjective_sentences,
            'objective': objective_sentences,
            'subjectivity_prob': overall_subjectivity_prob,
            'objectivity_prob': overall_objectivity_prob,
            'class_label': class_label
        }

    def __sanitize_text(self, text):
        text = text.replace('\n', '.\n')
        text = text.replace('.[', '. [')
        text = text.replace('.[', '. [')
        text = text.replace('...', '.')
        text = text.replace('..', '.')
        text = text.replace('\n.', '\n')
        return text

    def __clean_sentence(self, text):
        text = text.replace('\n', '')
        if text == '.': return ''
        return text