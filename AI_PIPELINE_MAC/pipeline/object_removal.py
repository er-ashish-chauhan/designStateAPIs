from config import HF_TOKEN, YOLO_MODEL_PATH, SD_MODEL_PATH, DEFAULT_DEVICE, INPAINT_METHOD
from models.yolo_loader import load_yolo_model
from models.sd_loader import load_stable_diffusion
from utils.helpers import preprocess_image, create_mask, postprocess_image
from PIL import Image
import numpy as np
import cv2
import matplotlib.pyplot as plt  # For macOS-compatible image display


class ObjectRemovalPipeline:
    def __init__(self, yolo_model_path=YOLO_MODEL_PATH, sd_model_path=SD_MODEL_PATH, token=HF_TOKEN, device=DEFAULT_DEVICE):
        self.device = device
        self.token = token
        self.yolo_model = load_yolo_model(yolo_model_path)
        self.inpaint_method = INPAINT_METHOD

        if self.inpaint_method == "stable-diffusion":
            self.sd_pipeline = load_stable_diffusion(sd_model_path, self.token, device)

    def detect_objects(self, image):
        print("Detecting all objects in the image...")

        # Run inference on the image
        results = self.yolo_model(image)

        # Ensure results is a single item (handles batch outputs)
        if isinstance(results, list):
            results = results[0]

        # Extract bounding boxes, confidence scores, and class IDs
        boxes = results.boxes
        box_coords = boxes.xyxy.cpu().numpy()
        confidences = boxes.conf.cpu().numpy()
        class_ids = boxes.cls.cpu().numpy().astype(int)
        class_names = [self.yolo_model.names[id] for id in class_ids]

        # Draw bounding boxes and labels on the image
        detected_image = image.copy()
        detections = []
        for coord, conf, class_name in zip(box_coords, confidences, class_names):
            xmin, ymin, xmax, ymax = map(int, coord)
            detections.append({
                "class_name": class_name,
                "confidence": conf,
                "xmin": xmin,
                "ymin": ymin,
                "xmax": xmax,
                "ymax": ymax,
            })
            # Draw bounding box and label for each detection
            cv2.rectangle(detected_image, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2)
            label = f"{class_name} ({conf:.2f})"
            cv2.putText(detected_image, label, (xmin, ymin - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        # Display all detected objects using matplotlib
        plt.imshow(cv2.cvtColor(detected_image, cv2.COLOR_BGR2RGB))
        plt.axis('off')
        plt.title("Detected Objects")
        plt.show()

        return detections, detected_image

    def inpaint_image(self, image, mask, prompt="a clean background"):
        if self.inpaint_method == "stable-diffusion":
            print("Using Stable Diffusion for inpainting...")
            try:
                y_indices, x_indices = np.where(mask == 255)
                if len(y_indices) == 0 or len(x_indices) == 0:
                    raise ValueError("Mask is empty. Nothing to inpaint.")

                ymin, ymax = y_indices.min(), y_indices.max()
                xmin, xmax = x_indices.min(), x_indices.max()

                cropped_image = image[ymin:ymax, xmin:xmax]
                cropped_mask = mask[ymin:ymax, xmin:xmax]

                # Convert to PIL format
                cropped_image_pil = Image.fromarray(cropped_image)
                cropped_mask_pil = Image.fromarray(cropped_mask)

                inpainted_cropped = self.sd_pipeline(
                    prompt=prompt,
                    image=cropped_image_pil,
                    mask_image=cropped_mask_pil,
                    num_inference_steps=100,
                    guidance_scale=10
                ).images[0]

                inpainted_cropped_np = np.array(inpainted_cropped)
                result = image.copy()
                result[ymin:ymax, xmin:xmax][cropped_mask == 255] = inpainted_cropped_np[cropped_mask == 255]

                return result

            except Exception as e:
                raise RuntimeError(f"Inpainting with Stable Diffusion failed: {e}")

        elif self.inpaint_method == "opencv":
            print("Using OpenCV for inpainting...")
            inpainted_result = cv2.inpaint(image, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
            result = image.copy()
            result[mask == 255] = inpainted_result[mask == 255]
            return result

        else:
            raise ValueError(f"Unknown inpainting method: {self.inpaint_method}")

    def process(self, image_path, target_object, prompt):
        print("Starting the object removal pipeline...")
        original_image, preprocessed_image = preprocess_image(image_path)

        # Detect all objects
        detections, detected_image = self.detect_objects(preprocessed_image)

        # Create a mask only for the target object
        target_detections = [det for det in detections if det["class_name"] == target_object]

        if not target_detections:
            print(f"No target objects ('{target_object}') detected. Returning original image.")
            return original_image

        # Create a mask for the target object only
        mask = create_mask(preprocessed_image, target_detections)

        # Inpaint the image
        inpainted_image = self.inpaint_image(preprocessed_image, mask, prompt)

        # Postprocess and display the result
        final_image = postprocess_image(original_image, inpainted_image)
        plt.imshow(cv2.cvtColor(final_image, cv2.COLOR_BGR2RGB))
        plt.axis('off')
        plt.title("Final Result")
        plt.show()

        return final_image