import tensorflow.compat.v1 as tf
tf.disable_eager_execution()
import numpy as np
from tensorflow.compat.v1.nn.rnn_cell import GRUCell, MultiRNNCell
from subjectivityClassifier.subj_utils import is_subjective, is_objective

TINY = 1e-6
NAMESPACE = 'subjectivity'

class SubjectivityPredictor(object):
    _sentence_vocab_size = 50
    _word_proj_size_for_rnn = 25
    _hidden_dim = 200
    _output_size = 2
    _memory_dim = 100
    _stack_dimension = 1

    def __init__(self, dropout=1.0):
        self.g = tf.Graph()
        self.dropout = dropout
        self._build_model()

    def _build_model(self):
        with self.g.as_default():
            config = tf.ConfigProto(allow_soft_placement=True)
            self.sess = tf.Session(config=config)

            with tf.variable_scope(NAMESPACE):
                # Input
                self.sentence_vectors_fw = tf.placeholder(tf.float32, shape=(None, None, self._sentence_vocab_size), name='sentence_vectors_inp_fw')
                self.sentence_vectors_bw = tf.placeholder(tf.float32, shape=(None, None, self._sentence_vocab_size), name='sentence_vectors_inp_nw')

                # Bi-GRU preprocessing
                self.Wq = tf.Variable(tf.random_uniform([self._sentence_vocab_size, self._word_proj_size_for_rnn], -0.1, 0.1))
                self.bq = tf.Variable(tf.random_uniform([self._word_proj_size_for_rnn], -0.1, 0.1))
                self.internal_projection = lambda x: tf.nn.relu(tf.matmul(x, self.Wq) + self.bq)

                self.sentence_int_fw = tf.map_fn(self.internal_projection, self.sentence_vectors_fw)
                self.sentence_int_bw = tf.map_fn(self.internal_projection, self.sentence_vectors_bw)

                self.rnn_cell_fw = MultiRNNCell([GRUCell(self._memory_dim) for _ in range(self._stack_dimension)])
                self.rnn_cell_bw = MultiRNNCell([GRUCell(self._memory_dim) for _ in range(self._stack_dimension)])

                with tf.variable_scope('fw'):
                    _, state_fw = tf.nn.dynamic_rnn(self.rnn_cell_fw, self.sentence_int_fw, time_major=True, dtype=tf.float32)

                with tf.variable_scope('bw'):
                    _, state_bw = tf.nn.dynamic_rnn(self.rnn_cell_bw, self.sentence_int_bw, time_major=True, dtype=tf.float32)

                self.sentence_vector = tf.concat(values=[state_fw[-1], state_bw[-1]], axis=1)

                self.Ws1 = tf.Variable(tf.random_uniform([self._memory_dim * 2, self._hidden_dim], -0.1, 0.1), name='Ws1')
                self.bs1 = tf.Variable(tf.random_uniform([self._hidden_dim], -0.1, 0.1), name='bs1')
                self.hidden = tf.nn.relu(tf.matmul(self.sentence_vector, self.Ws1) + self.bs1)
                self.hidden_dropout = tf.nn.dropout(self.hidden, self.dropout)

                self.Wf = tf.Variable(tf.random_uniform([self._hidden_dim, self._output_size], -0.1, 0.1), name='Wf')
                self.bf = tf.Variable(tf.random_uniform([self._output_size], -0.1, 0.1), name='bf')
                self.outputs = tf.nn.softmax(tf.matmul(self.hidden_dropout, self.Wf) + self.bf)

                self.sess.run(tf.global_variables_initializer())

    def __predict(self, sentence_vectors):
        with self.g.as_default():
            sentence_vectors = np.array(sentence_vectors)
            sentence_vectors_fw = np.transpose(sentence_vectors, (1, 0, 2))
            sentence_vectors_bw = sentence_vectors_fw[::-1, :, :]

            feed_dict = {
                self.sentence_vectors_fw: sentence_vectors_fw,
                self.sentence_vectors_bw: sentence_vectors_bw
            }
            return self.sess.run(self.outputs, feed_dict)

    def predict(self, sentence_vectors):
        with self.g.as_default():
            output = np.array(self.__predict([sentence_vectors]))[0]
            return is_subjective if output[0] > output[1] else is_objective

    def save(self, filename):
        with self.g.as_default():
            saver = tf.train.Saver()
            saver.save(self.sess, filename)

    def load_tensorflow(self, filename):
        with self.g.as_default():
            saver = tf.train.Saver()
            saver.restore(self.sess, filename)

    @classmethod
    def load(cls, filename, dropout=1.0):
        model = cls(dropout)
        model.load_tensorflow(filename)
        return model
