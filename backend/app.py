from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    print(f"Received request data: {data}")  # Print request data to the console
    url = data.get('url')
    # Perform analysis on the URL (this is just a placeholder)
    result = f"Analysis result for {url}"
    return jsonify({'result': result})

if __name__ == '_main_':
    app.run(debug=True)