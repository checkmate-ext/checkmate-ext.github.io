from flask import Flask, request, jsonify
from flask_cors import CORS
from CustomSearch import GoogleSearch

app = Flask(__name__)
CORS(app)

# API Keys (Replace with your actual keys)
G_API_KEY = 'AIzaSyCzoprS2n7aVkRIHeqrUpdnaD0y15sVHXI'
CX_ID = "f2b2655b7da834a7c"
VISION_API_KEY = 'AIzaSyBhep9MR0ioD2qSB8hWe0FHSxh71nehOkk'

@app.route('/scrap_and_search', methods=['POST'])
def scrap_and_search():
    try:
        # Extract URL from request JSON
        data = request.json
        url = data.get('url')
        if not url:
            return jsonify({'error': 'URL parameter is required'}), 400

        # Initialize GoogleSearch and perform scraping & custom search
        google_search = GoogleSearch(G_API_KEY, CX_ID, VISION_API_KEY, url)
        similar_articles = google_search.get_similar()

        # Return the results as JSON
        return jsonify({
            'message': f"Results for {url}",
            'similar_articles': similar_articles
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
