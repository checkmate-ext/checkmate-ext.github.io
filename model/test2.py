import argparse
import itertools
import os.path as osp
import wandb  # Import wandb


import torch
import torch.nn.functional as F
from torch.nn import Linear

from torch_geometric.datasets import UPFD
from torch_geometric.loader import DataLoader
from torch_geometric.nn import GATConv, GCNConv, SAGEConv, global_max_pool
from torch_geometric.transforms import ToUndirected

# Argument parser for dataset and model configuration
parser = argparse.ArgumentParser()
parser.add_argument('--dataset', type=str, default='politifact',
                    choices=['politifact', 'gossipcop'])
parser.add_argument('--feature', type=str, default='spacy',
                    choices=['profile', 'spacy', 'bert', 'content'])
parser.add_argument('--model', type=str, default='GCN',
                    choices=['GCN', 'GAT', 'SAGE'])
args = parser.parse_args()

# wandb Initialization

run_name = f"{args.dataset}_{args.feature}_{args.model}"

wandb.init(
    project="FakeNews-Detection",  # Replace with your wandb project name
    name=run_name,
    config={
        "dataset": args.dataset,
        "feature": args.feature,
        "model": args.model,
        "hidden_channels": 128,
        "epochs": 60,
        "batch_size": 128,
        "learning_rate": 0.001,
        "weight_decay": 0.01,
    }
)
config = wandb.config

# Dataset loading
path = osp.join(osp.dirname(osp.realpath(__file__)), 'data', 'UPFD')
train_dataset = UPFD(path, config.dataset, config.feature, 'train', ToUndirected())
val_dataset = UPFD(path, config.dataset, config.feature, 'val', ToUndirected())
test_dataset = UPFD(path, config.dataset, config.feature, 'test', ToUndirected())

# DataLoader for batching
train_loader = DataLoader(train_dataset, batch_size=config.batch_size, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=config.batch_size, shuffle=False)
test_loader = DataLoader(test_dataset, batch_size=config.batch_size, shuffle=False)


# Model definition
class Net(torch.nn.Module):
    def __init__(self, model, in_channels, hidden_channels, out_channels,
                 concat=False):
        super().__init__()
        self.concat = concat

        # Choose the GNN layer
        if model == 'GCN':
            self.conv1 = GCNConv(in_channels, hidden_channels)
        elif model == 'SAGE':
            self.conv1 = SAGEConv(in_channels, hidden_channels)
        elif model == 'GAT':
            self.conv1 = GATConv(in_channels, hidden_channels)

        # Optional root node concatenation
        if self.concat:
            self.lin0 = Linear(in_channels, hidden_channels)
            self.lin1 = Linear(2 * hidden_channels, hidden_channels)

        # Final classifier
        self.lin2 = Linear(hidden_channels, out_channels)

    def forward(self, x, edge_index, batch):
        # Apply GNN layer
        h = self.conv1(x, edge_index).relu()
        h = global_max_pool(h, batch)  # Pooling over the graph

        if self.concat:
            # Root node (tweet) features for concatenation
            root = (batch[1:] - batch[:-1]).nonzero(as_tuple=False).view(-1)
            root = torch.cat([root.new_zeros(1), root + 1], dim=0)
            news = x[root]

            news = self.lin0(news).relu()
            h = self.lin1(torch.cat([news, h], dim=-1)).relu()

        h = self.lin2(h)
        return h.log_softmax(dim=-1)


# Training and evaluation setup
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = Net(config.model, train_dataset.num_features, config.hidden_channels,
            train_dataset.num_classes, concat=True).to(device)
optimizer = torch.optim.Adam(model.parameters(), lr=config.learning_rate, weight_decay=config.weight_decay)


# Training loop
def train():
    model.train()

    total_loss = 0
    for data in train_loader:
        data = data.to(device)
        optimizer.zero_grad()
        out = model(data.x, data.edge_index, data.batch)
        loss = F.nll_loss(out, data.y)  # Negative log likelihood loss
        loss.backward()
        optimizer.step()
        total_loss += float(loss) * data.num_graphs

    return total_loss / len(train_loader.dataset)


# Testing loop
@torch.no_grad()
def test(loader):
    model.eval()

    total_correct = total_examples = 0
    for data in loader:
        data = data.to(device)
        pred = model(data.x, data.edge_index, data.batch).argmax(dim=-1)
        total_correct += int((pred == data.y).sum())
        total_examples += data.num_graphs

    return total_correct / total_examples


# Main training and evaluation
for epoch in range(1, config.epochs + 1):  # 60 epochs
    loss = train()
    train_acc = test(train_loader)
    val_acc = test(val_loader)
    test_acc = test(test_loader)

    # Log metrics to wandb
    wandb.log({
        "epoch": epoch,
        "train_loss": loss,
        "train_acc": train_acc,
        "val_acc": val_acc,
        "test_acc": test_acc,
    })

    print(f'Epoch: {epoch:02d}, Loss: {loss:.4f}, Train: {train_acc:.4f}, '
          f'Val: {val_acc:.4f}, Test: {test_acc:.4f}')

# Save the final model and log to wandb
model_path = f"{config.dataset}_{config.feature}_{config.model}_final.pth"
torch.save(model.state_dict(), model_path)
# Log model as a wandb artifact
artifact = wandb.Artifact(name=f"{config.dataset}_{config.feature}_{config.model}_model", type="model")
artifact.add_file(model_path)
wandb.log_artifact(artifact)
wandb.finish()