# Use official Python image
FROM python:3.10-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies for nltk / others if needed
RUN apt-get update && apt-get install -y gcc

# Copy project files into container
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Expose the FastAPI port
EXPOSE 5000

# Start the FastAPI server with Uvicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]