import cv2
import numpy as np
import os
import matplotlib.pyplot as plt  # For macOS-compatible image display

def preprocess_image(image, size=(512, 512)):
    """
    Preprocess the input image by loading, resizing, and storing its original dimensions.

    Args:
        image_path (str): Path to the input image.
        size (tuple): Target size to resize the image.

    Returns:
        tuple: Original image, resized image, and original dimensions (width, height).
    """
    print("Preprocessing image...")
    if image is None:
        raise FileNotFoundError(f"Image not found at path: {image_path}")
    
    # Store the original image size (width, height)
    original_size = (image.shape[1], image.shape[0])
    
    # Resize the image to the target size
    image_resized = cv2.resize(image, size)
    
    return image, image_resized, original_size

def create_mask(image, masks):
    """
    Create a combined mask from multiple segmentation masks.

    Args:
        image (np.array): Original image to derive the mask size.
        masks (list of np.array): Binary masks for target objects.

    Returns:
        np.array: Combined binary mask.
    """
    print("Creating mask for target objects...")
    mask = np.zeros(image.shape[:2], dtype=np.uint8)
    
    # Combine all masks into one
    for single_mask in masks:
        mask = np.maximum(mask, single_mask.astype(np.uint8) * 255)
    
    # Display the mask
    plt.imshow(mask, cmap="gray")
    plt.axis("off")
    plt.title("Generated Mask")
    plt.show()
    
    return mask

def adjust_mask(mask, dilation_iterations=5, blur_ksize=(25, 25)):
    """
    Expands and smoothens the mask using dilation and Gaussian blur.

    Args:
        mask (np.array): The binary mask to be adjusted.
        dilation_iterations (int): Number of times to apply dilation.
        blur_ksize (tuple): Kernel size for Gaussian blur.

    Returns:
        np.array: The adjusted mask.
    """
    print("Adjusting the mask...")
    # Ensure the mask is binary (0 or 255)
    mask = (mask > 0).astype(np.uint8) * 255

    # Create a kernel for dilation
    kernel = np.ones((7, 7), np.uint8)

    # Dilate the mask to expand it
    dilated_mask = cv2.dilate(mask, kernel, iterations=dilation_iterations)

    # Apply Gaussian blur to smoothen the edges
    smoothed_mask = cv2.GaussianBlur(dilated_mask, blur_ksize, 0)

    # Convert the mask back to binary
    adjusted_mask = (smoothed_mask > 127).astype(np.uint8) * 255

    # Display the adjusted mask
    plt.imshow(adjusted_mask, cmap="gray")
    plt.axis("off")
    plt.title("Adjusted Mask")
    plt.show()

    return adjusted_mask

def postprocess_image(original, inpainted):
    """
    Postprocess and display the inpainted image.

    Args:
        original (np.array): Original image.
        inpainted (np.array): Inpainted image.

    Returns:
        np.array: The final inpainted image.
    """
    print("Postprocessing the inpainted image...")
    # Display the inpainted image
    plt.imshow(cv2.cvtColor(inpainted, cv2.COLOR_BGR2RGB))
    plt.axis("off")
    plt.title("Inpainted Image")
    plt.show()
    
    return inpainted