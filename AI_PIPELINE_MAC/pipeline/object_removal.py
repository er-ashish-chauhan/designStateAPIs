from config import HF_TOKEN, YOLO_MODEL_PATH, SD_MODEL_PATH, DEFAULT_DEVICE, INPAINT_METHOD,DISPLAY_DETECTION
from models.yolo_loader import load_yolo_model
from models.sd_loader import load_stable_diffusion
from utils.helpers import preprocess_image, create_mask, postprocess_image
from PIL import Image
import numpy as np
import cv2
import matplotlib.pyplot as plt  # For macOS-compatible image display
from config import DISPLAY_DETECTION, ENABLE_INPAINTING
import os
import matplotlib.pyplot as plt
import random,json


class ObjectRemovalPipeline:
    def __init__(self, yolo_model_path=YOLO_MODEL_PATH, sd_model_path=SD_MODEL_PATH, token=HF_TOKEN, device=DEFAULT_DEVICE):
        self.device = device
        self.token = token
        self.yolo_model = load_yolo_model(yolo_model_path)
        self.inpaint_method = INPAINT_METHOD

        if self.inpaint_method == "stable-diffusion":
            self.sd_pipeline = load_stable_diffusion(sd_model_path, self.token, device)

    def detect_objects(self, preprocessed_image, original_image):
        print("Detecting all objects in the image...")

        # Run inference on the resized image (preprocessed_image)
        results = self.yolo_model(preprocessed_image)

        # Ensure results is a single item (handles batch outputs)
        if isinstance(results, list):
            results = results[0]

        # Extract bounding boxes, confidence scores, and class IDs
        boxes = results.boxes
        box_coords = boxes.xyxy.cpu().numpy()  # Bounding boxes in the resized image size
        confidences = boxes.conf.cpu().numpy()
        class_ids = boxes.cls.cpu().numpy().astype(int)
        class_names = [self.yolo_model.names[id] for id in class_ids]

        # Get dimensions of the resized and original images
        resized_height, resized_width = preprocessed_image.shape[:2]
        orig_height, orig_width = original_image.shape[:2]

        # Calculate scaling factors
        scale_x = orig_width / resized_width
        scale_y = orig_height / resized_height

        # Generate random colors for each class for better visibility
        unique_classes = set(class_names)
        class_colors = {cls: [random.randint(0, 255) for _ in range(3)] for cls in unique_classes}

        # Draw bounding boxes on the original image
        detected_image = original_image.copy()
        detections = []

        for coord, conf, class_name in zip(box_coords, confidences, class_names):
            # Scale the bounding box coordinates to the original image size
            xmin, ymin, xmax, ymax = map(int, [coord[0] * scale_x, coord[1] * scale_y, coord[2] * scale_x, coord[3] * scale_y])

            # Store detection information
            detections.append({
                "class_name": class_name,
                "confidence": conf,
                "xmin": xmin,
                "ymin": ymin,
                "xmax": xmax,
                "ymax": ymax,
            })

            # Draw bounding box and label on the original image
            color = class_colors[class_name]
            cv2.rectangle(detected_image, (xmin, ymin), (xmax, ymax), color, 2)
            label = f"{class_name} ({conf:.2f})"
            cv2.putText(detected_image, label, (xmin, ymin - 10), cv2.FONT_HERSHEY_SIMPLEX, 2, color, 2)

        return detections, detected_image




    def inpaint_image(self, image, mask, prompt="blend with environment"):
        if self.inpaint_method == "stable-diffusion":
            print("Using OpenCV for initial inpainting to guide Stable Diffusion...")
            try:
                # Perform initial inpainting with OpenCV
                opencv_inpainted = cv2.inpaint(image, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)

                # Get the bounding box coordinates for the mask with padding
                y_indices, x_indices = np.where(mask == 255)
                if len(y_indices) == 0 or len(x_indices) == 0:
                    raise ValueError("Mask is empty. Nothing to inpaint.")

                padding = 20  # Add padding to include surrounding context
                ymin = max(0, y_indices.min() - padding)
                ymax = min(image.shape[0], y_indices.max() + padding)
                xmin = max(0, x_indices.min() - padding)
                xmax = min(image.shape[1], x_indices.max() + padding)

                # Crop the region of interest from the OpenCV inpainted image and the mask
                cropped_image = opencv_inpainted[ymin:ymax, xmin:xmax]
                cropped_mask = mask[ymin:ymax, xmin:xmax]

                # Resize to 512x512 for Stable Diffusion
                fixed_size = (512, 512)
                cropped_image_resized = cv2.resize(cropped_image, fixed_size, interpolation=cv2.INTER_LINEAR)
                cropped_mask_resized = cv2.resize(cropped_mask, fixed_size, interpolation=cv2.INTER_NEAREST)

                # Convert to PIL format
                cropped_image_pil = Image.fromarray(cv2.cvtColor(cropped_image_resized, cv2.COLOR_BGR2RGB))
                cropped_mask_pil = Image.fromarray(cropped_mask_resized)

                # Inpaint with Stable Diffusion
                print("Refining inpainting with Stable Diffusion...")
                inpainted_result = self.sd_pipeline(
                    prompt=prompt,
                    image=cropped_image_pil,
                    mask_image=cropped_mask_pil,
                    num_inference_steps=20,
                    guidance_scale=10
                ).images[0]

                # Convert the inpainted result back to a NumPy array
                inpainted_cropped_np = np.array(inpainted_result)

                # Resize the inpainted result back to the original crop size
                inpainted_cropped_resized = cv2.resize(inpainted_cropped_np, (xmax - xmin, ymax - ymin), interpolation=cv2.INTER_LINEAR)

                # Apply the refined inpainted result to the original image
                result = image.copy()
                result[ymin:ymax, xmin:xmax][cropped_mask == 255] = inpainted_cropped_resized[cropped_mask == 255]

                return result

            except Exception as e:
                raise RuntimeError(f"Inpainting with Stable Diffusion failed: {e}")

        else:
            raise ValueError(f"Unknown inpainting method: {self.inpaint_method}")






    def process(self, image_input, target_object, prompt, output_file="detections.json"):
        print(f"Starting the object removal pipeline for {image_input}...")

        # Preprocess the image and get the original image and resized image
        original_image, preprocessed_image, original_size = preprocess_image(image_input)

        # Detect all objects and get the detected image with bounding boxes
        detections, detected_image = self.detect_objects(preprocessed_image, original_image)

        # Get the image file name (e.g., "xyz.jpeg")
        image_name = "new_image.jpeg"

        # Create a dictionary to store the detections
        detection_data = {
            "image_name": image_name,
            "detections": []
        }

        if not detections:
            print("No objects detected.")
        else:
            for detection in detections:
                detection_entry = {
                    "class_name": detection['class_name'],
                    "bbox": {
                        "xmin": detection['xmin'],
                        "ymin": detection['ymin'],
                        "xmax": detection['xmax'],
                        "ymax": detection['ymax']
                    }
                }
                detection_data["detections"].append(detection_entry)

        # Save detections to a JSON file
        with open(output_file, "a") as f:
            f.write(json.dumps(detection_data, indent=4))
            f.write(",\n")  # To separate entries if appending multiple images

        # Display the detected image with bounding boxes if DISPLAY_DETECTION is True
        if DISPLAY_DETECTION:
            plt.imshow(cv2.cvtColor(detected_image, cv2.COLOR_BGR2RGB))
            plt.axis('off')
            plt.title("Detected Objects")
            plt.show()

        # Skip inpainting if ENABLE_INPAINTING is False
        if not ENABLE_INPAINTING:
            print(f"Skipping inpainting for {image_name}. Object detection complete.")
            return detection_data  # Return detections as JSON-like dictionary

        # Create a mask only for the target object
        target_detections = [det for det in detections if det["class_name"] == target_object]

        if not target_detections:
            print(f"No target objects ('{target_object}') detected. Returning original image.")
            return original_image

        # Create a mask for the target object only
        mask = create_mask(original_image, target_detections)

        # Inpaint the image
        inpainted_image = self.inpaint_image(original_image, mask, prompt)

        # Postprocess and display the result
        final_image = postprocess_image(original_image, inpainted_image)
        plt.imshow(cv2.cvtColor(final_image, cv2.COLOR_BGR2RGB))
        plt.axis('off')
        plt.title("Final Result")
        plt.show()

        return final_image