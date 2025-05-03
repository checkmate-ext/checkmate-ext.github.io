# Use an official Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY main.py .
COPY mlp_model.joblib .
COPY scaler.joblib .
COPY subjectivityClassifier/ subjectivityClassifier/
COPY politicalClassifier/ politicalClassifier/

# Download NLTK data
RUN python -m nltk.downloader punkt

# Expose port
EXPOSE 8080

# Run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]