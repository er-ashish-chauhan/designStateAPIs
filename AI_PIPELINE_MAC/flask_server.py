from flask import Flask, request, jsonify
from subprocess import call
import requests  # For downloading the image from the URL
import os

app = Flask(__name__)

@app.route('/process-image', methods=['POST'])
def process_image():
    try:
        # Get the image URL from the request JSON
        data = request.json
        image_url = data['image_url']
        print(image_url)
        # Download the image from the URL
        response = requests.get(image_url)
        response.raise_for_status()  # Raise an error if the request failed
        image_data = response.content

        # Save the image locally (optional) or pass it to main.py
        image_path = 'temp_image.jpg'  # Temporary file
        with open(image_path, 'wb') as f:
            f.write(image_data)
        print("image_path", image_path)
        # Start main.py with the image path as a parameter
        call(["python", "main.py", image_path])

        return jsonify({"status": "success", "message": "Image processed successfully."})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))  # Default to 3000 if PORT not set
    app.run(debug=True, host=os.environ.get('HOST', 'localhost'), port=port)