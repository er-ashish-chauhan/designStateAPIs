import cv2
import numpy as np
import os
import matplotlib.pyplot as plt  # For macOS-compatible image display
from PIL import Image
from io import BytesIO

def preprocess_image(image_data):
    """
    Preprocess the input binary image data.

    Args:
        image_data (bytes): Binary image data.
        size (tuple): Target size for resizing.

    Returns:
        tuple: (original_image, preprocessed_image, original_size)
    """
    size=(512, 512)
    print("Preprocessing image from binary data...")
    
    # Convert binary data to a NumPy array and then to OpenCV format
    original_image = np.array(Image.open(BytesIO(image_data)))
    original_image = cv2.cvtColor(original_image, cv2.COLOR_RGB2BGR)

    # Store the original size
    original_size = (original_image.shape[1], original_image.shape[0])

    # Resize the image to the target size
    preprocessed_image = cv2.resize(original_image, size)

    return original_image, preprocessed_image, original_size

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