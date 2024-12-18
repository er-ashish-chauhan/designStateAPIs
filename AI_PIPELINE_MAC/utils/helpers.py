import cv2
import numpy as np
import os
import matplotlib.pyplot as plt  # For macOS-compatible image display

def preprocess_image(image_path, size=(512, 512)):
    print("Preprocessing image...")
    image_path = os.path.abspath(image_path)
    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f"Image not found at path: {image_path}")
    
    # Store the original image size (width, height)
    original_size = (image.shape[1], image.shape[0])
    
    # Resize the image to the target size
    image_resized = cv2.resize(image, size)
    
    return image, image_resized, original_size

def create_mask(image, detections):
    print("Creating mask for detected objects...")
    mask = np.zeros(image.shape[:2], dtype=np.uint8)
    for detection in detections:
        xmin, ymin, xmax, ymax = map(int, [detection["xmin"], detection["ymin"], detection["xmax"], detection["ymax"]])
        mask[ymin:ymax, xmin:xmax] = 255
    
    # Display the mask
    plt.imshow(mask, cmap="gray")
    plt.axis("off")
    plt.title("Mask")
    plt.show()
    
    return mask

def postprocess_image(original, inpainted):
    print("Postprocessing the inpainted image...")
    # Display the inpainted image
    plt.imshow(cv2.cvtColor(inpainted, cv2.COLOR_BGR2RGB))
    plt.axis("off")
    plt.title("Inpainted Image")
    plt.show()
    
    return inpainted