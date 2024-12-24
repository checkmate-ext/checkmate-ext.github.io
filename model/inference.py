import torch
from torch_geometric.nn import GATConv, SAGEConv, global_max_pool
from transformers import BertTokenizer, BertModel
import torch.nn.functional as F
import shap

# Define device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class PolitifactModel(torch.nn.Module):
    def __init__(self, in_channels, hidden_channels, inter_channels, out_channels):
        super().__init__()
        self.conv1 = GATConv(in_channels, hidden_channels)  # GATConv(768, 128)
        self.lin0 = torch.nn.Linear(in_channels, hidden_channels)  # Linear(768, 128)
        self.lin1 = torch.nn.Linear(hidden_channels * 2, hidden_channels)  # Linear(256, 128)
        self.lin2 = torch.nn.Linear(hidden_channels, out_channels)  # Linear(128, 2)

    def forward(self, x, edge_index, batch):
        # Graph Convolution
        h_conv = self.conv1(x, edge_index).relu()  # [num_nodes, 128]
        h_pool = global_max_pool(h_conv, batch)  # [batch_size, 128]

        # Original Embeddings
        h_lin = self.lin0(x).relu()  # [batch_size, 128]

        # Concatenate Features
        h = torch.cat([h_pool, h_lin], dim=1)  # [batch_size, 256]

        # Fully Connected Layers
        h = self.lin1(h).relu()  # [batch_size, 128]
        h = self.lin2(h)  # [batch_size, 2]
        return h


class GossipCopModel(torch.nn.Module):
    def __init__(self, in_channels, hidden_channels, inter_channels, out_channels):
        super().__init__()
        self.conv1 = SAGEConv(in_channels, hidden_channels)  # SAGEConv(768, 128)
        self.lin0 = torch.nn.Linear(in_channels, hidden_channels)  # Linear(768, 128)
        self.lin1 = torch.nn.Linear(hidden_channels * 2, hidden_channels)  # Linear(256, 128)
        self.lin2 = torch.nn.Linear(hidden_channels, out_channels)  # Linear(128, 2)

    def forward(self, x, edge_index, batch):
        # Graph Convolution
        h_conv = self.conv1(x, edge_index).relu()  # [num_nodes, 128]
        h_pool = global_max_pool(h_conv, batch)  # [batch_size, 128]

        # Original Embeddings
        h_lin = self.lin0(x).relu()  # [batch_size, 128]

        # Concatenate Features
        h = torch.cat([h_pool, h_lin], dim=1)  # [batch_size, 256]

        # Fully Connected Layers
        h = self.lin1(h).relu()  # [batch_size, 128]
        h = self.lin2(h)  # [batch_size, 2]
        return h


# Load Models
politifact_model = PolitifactModel(768, 128, 256, 2).to(device)
politifact_state_dict = torch.load("politifact_bert_GAT_final.pth", map_location=device)
print("POLITIFACT MODEL STRUCTURE")
for key, value in politifact_state_dict.items():
    print(f"{key}: {value.shape}")

politifact_model.load_state_dict(politifact_state_dict)
politifact_model.eval()

gossipcop_model = GossipCopModel(768, 128, 256, 2).to(device)
gossipcop_state_dict = torch.load("gossipcop_bert_SAGE_final.pth", map_location=device)
print("GOSSIPCOP MODEL STRUCTURE")
for key, value in gossipcop_state_dict.items():
    print(f"{key}: {value.shape}")

gossipcop_model.load_state_dict(gossipcop_state_dict)
gossipcop_model.eval()

# Load BERT
bert_model = BertModel.from_pretrained("bert-base-uncased").to(device)
bert_model.eval()
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")


def preprocess_article(article):
    tokens = tokenizer(article, return_tensors="pt", truncation=True, padding=True).to(device)
    with torch.no_grad():
        outputs = bert_model(**tokens)
        embeddings = outputs.last_hidden_state.mean(dim=1)  # Shape: [batch_size, 768]
        print(f"Processed embedding shape: {embeddings.shape}")  # Debugging
    return embeddings



# Politifact Inference
def politifact_inference(article, model):
    embeddings = preprocess_article(article)  # [batch_size, 768]
    edge_index = torch.empty((2, 0), dtype=torch.long).to(device)  # No edges for single-node graph
    batch = torch.zeros(embeddings.size(0), dtype=torch.long).to(device)  # Single graph

    with torch.no_grad():
        output = model(embeddings, edge_index=edge_index, batch=batch)  # [batch_size, 2]
        probabilities = F.softmax(output, dim=1)  # Apply softmax to get probabilities
        prediction = output.argmax(dim=-1).item()

    label = "Real" if prediction == 1 else "Fake"
    return label, probabilities.cpu().numpy()[0]  # Return label and probabilities


# GossipCop Inference
def gossipcop_inference(article, model):
    embeddings = preprocess_article(article)  # [batch_size, 768]
    edge_index = torch.empty((2, 0), dtype=torch.long).to(device)  # No edges for single-node graph
    batch = torch.zeros(embeddings.size(0), dtype=torch.long).to(device)  # Single graph

    with torch.no_grad():
        output = model(embeddings, edge_index=edge_index, batch=batch)  # [batch_size, 2]
        probabilities = F.softmax(output, dim=1)  # Apply softmax to get probabilities
        prediction = output.argmax(dim=-1).item()

    label = "Real" if prediction == 1 else "Fake"
    return label, probabilities.cpu().numpy()[0]  # Return label and probabilities


# Combined Inference
# Combined Inference
def combined_inference(article):
    politifact_label, politifact_probs = politifact_inference(article, politifact_model)
    gossipcop_label, gossipcop_probs = gossipcop_inference(article, gossipcop_model)

    # Majority Voting with Tie-Breaker
    results = [politifact_label, gossipcop_label]
    if results[0] == results[1]:
        final_result = results[0]
    else:
        final_result = "Fake"  # Example tie-breaker

    return {
        "politifact": {
            "label": politifact_label,
            "probabilities": politifact_probs.tolist()
        },
        "gossipcop": {
            "label": gossipcop_label,
            "probabilities": gossipcop_probs.tolist()
        },
        "final_prediction": final_result,
    }



# Main Test
if __name__ == "__main__":
    article = input("Enter a news article for analysis: ")
    predictions = combined_inference(article)

    print("\n--- Prediction Results ---")
    print(f"Politifact Model Prediction: {predictions['politifact']['label']}")
    print(f"Politifact Model Probabilities: {predictions['politifact']['probabilities']}")
    print(f"GossipCop Model Prediction: {predictions['gossipcop']['label']}")
    print(f"GossipCop Model Probabilities: {predictions['gossipcop']['probabilities']}")
    print(f"Final Combined Prediction: {predictions['final_prediction']}")

    