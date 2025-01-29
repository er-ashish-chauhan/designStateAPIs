import os
import numpy as np
import cv2
import json
import uuid
from datetime import datetime
from model_loader.yolo_loader import load_yolo_model
from utils.helpers import preprocess_image
from config import DISPLAY_RESULTS, TEMP_IMAGE_STORAGE

class ObjectDetectionPipeline:
    def __init__(self, device="cpu"):
        self.device = device
        self.yolo_model = load_yolo_model()
        os.makedirs(TEMP_IMAGE_STORAGE, exist_ok=True)  # Ensure temp dir exists

    def detect_and_create_masks(self, preprocessed_image, original_image, request_id):
        """Generates mask contours and unique IDs tied to the request."""
        results = self.yolo_model(preprocessed_image)
        if isinstance(results, list):
            results = results[0]

        if hasattr(results, 'masks') and results.masks is not None:
            masks = results.masks.data.cpu().numpy()
            class_ids = results.boxes.cls.cpu().numpy().astype(int)
            class_names = [self.yolo_model.names[id] for id in class_ids]

            segmentations = []
            for idx, (name, mask) in enumerate(zip(class_names, masks)):
                # Convert mask to binary and resize to match original image dimensions
                binary_mask = (mask * 255).astype(np.uint8)
                mask_resized = cv2.resize(
                    binary_mask,
                    original_image.shape[:2][::-1],  # (width, height)
                    interpolation=cv2.INTER_NEAREST
                )

                # Save individual masks
                mask_path = os.path.join(TEMP_IMAGE_STORAGE, f"{request_id}_mask_{idx}.jpg")
                cv2.imwrite(mask_path, mask_resized)

                # Find contours of the mask
                contours, _ = cv2.findContours(mask_resized, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                # Compute the centroid of the mask
                moments = cv2.moments(mask_resized)
                if moments["m00"] != 0:
                    centroid_x = int(moments["m10"] / moments["m00"])
                    centroid_y = int(moments["m01"] / moments["m00"])
                else:
                    centroid_x, centroid_y = -1, -1

                # Prepare segmentation data
                segmentations.append({
                    "class_name": name,
                    "mask_id": f"{request_id}_mask_{idx}",
                    "contours": [c.squeeze(1).tolist() for c in contours],
                    "centroid": (centroid_x, centroid_y),
                    "request_id": request_id
                })

            return segmentations
        else:
            raise ValueError("No masks detected in the image.")

    def process(self, image_data, request_id, output_file="detections.json"):
        """
        Process image and save masks with request-based naming.
        Combines detection and segmentation with JSON-based output.
        """
        # Decode image from binary data
        nparr = np.frombuffer(image_data, np.uint8)
        original_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if original_image is None:
            raise ValueError("Invalid image data")

        # Preprocess the image
        _, preprocessed_image, _ = preprocess_image(original_image)

        # Detect objects and generate segmentation masks
        segmentations = self.detect_and_create_masks(
            preprocessed_image, 
            original_image,
            request_id
        )

        # Prepare structured JSON output
        detection_data = {
            "request_id": request_id,
            "detections": segmentations
        }

        # Save the JSON output to a file
        output_path = os.path.join(TEMP_IMAGE_STORAGE, f"{request_id}_masks.json")
        with open(output_path, "w") as f:
            json.dump(detection_data, f, indent=4)

        # Display detections if enabled
        if DISPLAY_RESULTS:
            print(f"Detections for request {request_id}:")
            print(json.dumps(detection_data, indent=4))

        # Return JSON-like data structure
        return detection_data