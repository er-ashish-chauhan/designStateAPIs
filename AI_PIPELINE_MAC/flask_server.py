from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import main  # Import the main.py module
import sys
import os
import json

app = Flask(__name__)
CORS(app)

@app.route('/process-image', methods=['POST'])
def process_image():
    
    try:
        # Get the image URL from the JSON payload
        data = request.json
        image_url = data['image_url']
        
        # Download the image
        response = requests.get(image_url)
        response.raise_for_status()
        image_data = response.content

        # Call the process_image function from main.py
        detection_results = main.process_image(image_data)
        

        # Return the detection results
        return {"status": "success", "detections": detection_results}

    except requests.exceptions.RequestException as e:
        print(f"Error downloading image: {str(e)}", file=sys.stderr)
        return jsonify({"status": "error", "message": f"Failed to download image: {str(e)}"}), 500

    except Exception as e:
        print(f"Error processing image: {str(e)}", file=sys.stderr)
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 3001))
    host = os.environ.get('HOST', 'localhost')
    print(f"Starting Flask server on {host}:{port}")
    app.run(debug=True, host=host, port=port)