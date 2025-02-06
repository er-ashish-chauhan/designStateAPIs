from flask import Flask, request, jsonify
import requests
import os
import uuid
import json
import numpy as np
from datetime import datetime
from io import BytesIO
from PIL import Image
from pipeline.object_detection_update import ObjectDetectionPipeline
from pipeline.lama_main import InpaintingPipeline
from config import TEMP_IMAGE_STORAGE
from config import HOST, PORT

app = Flask(__name__)

def generate_request_id():
    return f"req_{uuid.uuid4().hex[:8]}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

os.makedirs(TEMP_IMAGE_STORAGE, exist_ok=True)

@app.route('/detect', methods=['POST'])
def handle_detection():
    try:
        data = request.json
        if 'image_url' not in data:
            return jsonify({"status": "error", "message": "Missing 'image_url'"}), 400

        request_id = generate_request_id()
        image_url = data['image_url']
        
        # Download and store original image
        response = requests.get(image_url)
        response.raise_for_status()
        image_data = response.content
        
        original_path = os.path.join(TEMP_IMAGE_STORAGE, f"{request_id}_original.jpg")
        with open(original_path, "wb") as f:
            f.write(image_data)

        # Process detection
        detection_pipeline = ObjectDetectionPipeline(device="cpu")
        detections = detection_pipeline.process(image_data=image_data, request_id=request_id)

        return {
            "status": "success",
            "request_id": request_id,
            "detections": detections
        }

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/inpaint', methods=['POST'])
def handle_inpainting():
    try:
        data = request.json
        required_fields = ['request_id', 'image_url', 'mask_ids']
        if not all(field in data for field in required_fields):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        request_id = data['request_id']
        image_url = data['image_url']
        mask_ids = data['mask_ids']

        # Download original image from URL instead of local storage
        response = requests.get(image_url)
        response.raise_for_status()
        image_data = response.content
        
        # Convert image to PIL format
        original_image = Image.open(BytesIO(image_data)).convert("RGB")

        # Load and combine masks
        inpainting_pipeline = InpaintingPipeline(device="cpu")

        # Combine selected masks into one
        combined_mask = inpainting_pipeline.load_masks(
            mask_ids=mask_ids,
            storage_path=TEMP_IMAGE_STORAGE,
            original_image_size=original_image.size[::-1]  # Convert (width, height) to (height, width)
        )

        # Process inpainting
        inpainted_image = inpainting_pipeline.process(
            image=original_image,
            masks=[combined_mask]
        )

        # Save the inpainted image temporarily
        inpainted_path = os.path.join(TEMP_IMAGE_STORAGE, f"{request_id}_inpainted.jpg")
        inpainted_image.save(inpainted_path, format="JPEG")

        # Upload the inpainted image to the database
        upload_url = "http://localhost:3000/api/v1/uploadImage"  # Update with actual API URL
        folder = "AI_inpainted"  # Specify target folder
        headers = {"Authorization": "Bearer YOUR_ACCESS_TOKEN"}  # Replace with actual token

        with open(inpainted_path, "rb") as img_file:
            files = {
                "images": (os.path.basename(inpainted_path), img_file, "image/jpeg"),
                "folder": (None, folder),
            }
            response = requests.post(upload_url, headers=headers, files=files)

        if response.status_code == 200:
            upload_response = response.json()
            return jsonify({
                "status": "success",
                "request_id": request_id,
                "message": "Image inpainted and uploaded successfully",
                "upload_response": upload_response
            })
        else:
            return jsonify({
                "status": "error",
                "request_id": request_id,
                "message": f"Failed to upload image: {response.text}"
            }), response.status_code

    except Exception as e:
        return jsonify({"status": "error", "request_id": request_id, "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', PORT))
    host = os.environ.get('HOST', HOST)
    print(f"Starting Flask server on {host}:{port}")
    app.run(debug=True, host=host, port=port)