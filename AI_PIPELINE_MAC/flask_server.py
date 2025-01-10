from flask import Flask, request, jsonify
from subprocess import Popen, PIPE
from flask_cors import CORS
import requests
import os

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
        
        # Pass the binary image data to main.py via stdin
        process = Popen(["python3", "main.py"], stdin=PIPE, stdout=PIPE, stderr=PIPE)
        stdout, stderr = process.communicate(input=image_data)

        if process.returncode == 0:
            # Return the detection results from main.py
            return jsonify({"status": "success", "results": stdout.decode('utf-8')})
        else:
            return jsonify({"status": "error", "message": stderr.decode('utf-8')})

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