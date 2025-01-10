from flask import Flask, request, jsonify
from flask_cors import CORS
from subprocess import call
import requests
import os

app = Flask(__name__)
CORS(app)

@app.route('/process-image', methods=['POST'])
def process_image():
    try:
        data = request.json
        image_url = data['image_url']
        print(f"Received image URL: {image_url}")

        # Download the image
        response = requests.get(image_url)
        response.raise_for_status()
        
        # Save the image
        image_path = 'temp_image.jpg'
        with open(image_path, 'wb') as f:
            f.write(response.content)
        
        print(f"Saved image to: {image_path}")
        
        # Process the image
        result = call(["python3", "main.py", 'temp_image.jpg'])
        
        if result == 0:
            return jsonify({
                "status": "success",
                "message": "Image processed successfully.",
                "data": ""
            })
        else:
            return jsonify({
                "status": "error",
                "message": f"Image processing failed with exit code: {result}"
            })

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 3001))
    host = os.environ.get('HOST', 'localhost')
    print(f"Starting Flask server on {host}:{port}")
    app.run(debug=True, host=host, port=port)