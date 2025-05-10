import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, losses

TINY = 1e-6

class TitleSubjectivityPredictor(tf.keras.Model):
    def __init__(self, dropout_rate=0.3):
        super(TitleSubjectivityPredictor, self).__init__()

        self._sentence_vocab_size = 50
        self._word_proj_size_for_rnn = 25
        self._memory_dim = 100
        self._hidden_dim = 300
        self._output_size = 2
        self._stack_dimension = 1

        self.input_projection = layers.Dense(self._word_proj_size_for_rnn, activation='relu')

        self.bi_gru = layers.Bidirectional(
            layers.GRU(self._memory_dim, return_sequences=False)
        )

        self.hidden_layer = layers.Dense(self._hidden_dim, activation='relu')
        self.dropout = layers.Dropout(dropout_rate)

        self.output_layer = layers.Dense(self._output_size, activation='softmax')

        self.optimizer = optimizers.Adam(learning_rate=1e-4)
        self.loss_fn = losses.CategoricalCrossentropy()

    def call(self, inputs, training=False):
        # inputs: shape (batch_size, sequence_length, vocab_size)
        x = self.input_projection(inputs)  # Project words
        x = self.bi_gru(x)                  # Bi-GRU
        x = self.hidden_layer(x)            # Fully connected hidden layer
        if training:
            x = self.dropout(x, training=training)  # Apply dropout only during training
        output = self.output_layer(x)       # Final softmax output
        return output

    def train_step(self, data):
        sentence_vectors, labels = data

        with tf.GradientTape() as tape:
            predictions = self(sentence_vectors, training=True)
            loss = self.loss_fn(labels, predictions)

        gradients = tape.gradient(loss, self.trainable_variables)
        self.optimizer.apply_gradients(zip(gradients, self.trainable_variables))

        return {"loss": loss}

    def test_step(self, data):
        sentence_vectors, labels = data
        predictions = self(sentence_vectors, training=False)
        loss = self.loss_fn(labels, predictions)
        return {"loss": loss}

    def predict_class(self, sentence_vector):
        """ Predict class (subjective or objective) """
        preds = self(sentence_vector[None, ...], training=False)  # Add batch dimension
        preds = preds.numpy()[0]
        if preds[0] > preds[1]:
            return "subjective"
        else:
            return "objective"
