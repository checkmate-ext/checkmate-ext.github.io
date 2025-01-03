from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from GoogleSearch import GoogleSearch
import os
import random

app = Flask(__name__)
CORS(app)
# Load environment variables from .env file
load_dotenv()

# Fetch API keys from environment variables
G_API_KEY = os.getenv("G_API_KEY")
CX_ID = os.getenv("CX_ID")
VISION_API_KEY = os.getenv("VISION_API_KEY")

# Validate that API keys exist
if not all([G_API_KEY, CX_ID, VISION_API_KEY]):
    raise ValueError("One or more API keys are missing in the .env file.")


@app.route('/scrap_and_search', methods=['POST'])
def scrap_and_search():
    try:
        # Extract URL from request JSON
        data = request.json
        url = data.get('url')
        if not url:
            return jsonify({'error': 'URL parameter is required'}), 400

        print(f"Processing URL: {url}")

        # Initialize GoogleSearch and perform scraping & custom search
        google_search = GoogleSearch(G_API_KEY, CX_ID, VISION_API_KEY, url)
        similar_articles = google_search.get_similar()
        article = google_search.article  # Original article data
        images_data = google_search.get_images_data()  # Analyze images for web detection
        reliability_score = random.randint(30, 95)

        print(similar_articles)
        # Return the results as JSON
        return jsonify({
            'reliability_score': reliability_score,
            'message': f"Results for {url}",
            'article': article,
            'similar_articles': similar_articles,
            'images_data': images_data
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
