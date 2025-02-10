import numpy as np
from PIL import Image
from .lama import LaMa
import cv2
import os


class InpaintingPipeline:
    def __init__(self, device="cpu"):
        self.device = device
        self.model = LaMa(device=device)

    @staticmethod
    def combine_masks(masks):
        """Combine multiple masks into one using logical OR"""
        combined = np.zeros_like(masks[0], dtype=np.uint8)
        for mask in masks:
            combined = np.logical_or(combined, mask)
        return combined.astype(np.uint8) * 255

    @staticmethod
    def dilate_masks(masks, dilation_size=5):
        """Apply normal dilation with a 5x5 kernel to each mask"""
        dilated_masks = []
        kernel = np.ones((dilation_size, dilation_size), dtype=np.uint8)  # 5x5 kernel for normal dilation

        for mask in masks:
            # Ensure mask is binary (0/255)
            binary_mask = (mask > 127).astype(np.uint8) * 255
            dilated = cv2.dilate(binary_mask, kernel, iterations=3)  # Apply normal dilation
            dilated_masks.append(dilated)

        return dilated_masks

    def load_masks(self, mask_ids, storage_path, original_image_size):
        """
        Load masks from disk using mask_ids and combine them into a single binary mask.
        :param mask_ids: List of mask IDs to load.
        :param storage_path: Directory where masks are stored.
        :param original_image_size: Size of the original image (height, width).
        :return: Combined mask as a NumPy array.
        """
        combined_mask = np.zeros(original_image_size, dtype=np.uint8)
        for mask_id in mask_ids:
            mask_path = os.path.join(storage_path, f"{mask_id}.jpg")
            mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
            if mask is None:
                raise ValueError(f"Mask with ID {mask_id} not found at {mask_path}")
            combined_mask = np.maximum(combined_mask, mask)
        return combined_mask

    def process(self, image, masks=None, mask_ids=None, storage_path=None, combine_masks=True):
        """
        Process inpainting with masks loaded by mask IDs or provided directly.
        :param image: PIL Image object (original image).
        :param masks: List of mask arrays (0-255 NumPy arrays). Optional if mask_ids are provided.
        :param mask_ids: List of mask IDs to load from storage. Optional if masks are provided.
        :param storage_path: Directory where masks are stored, required if mask_ids are used.
        :param combine_masks: Whether to combine multiple masks into one.
        :return: PIL Image of inpainted result.
        """
        # Convert image to numpy array
        image_np = np.array(image).astype(np.uint8)
        original_image_size = image_np.shape[:2]

        # Load or validate masks
        if mask_ids and storage_path:
            masks = [self.load_masks(mask_ids, storage_path, original_image_size)]
        elif not masks:
            raise ValueError("No masks provided or mask IDs missing.")

        # Apply dilation to individual masks
        dilated_masks = self.dilate_masks(masks)

        # Combine masks if needed
        final_mask = self.combine_masks(dilated_masks) if combine_masks else dilated_masks[0]

        # Convert to 0-1 range for LaMa
        final_mask = (final_mask > 127).astype(np.uint8)

        # Perform inpainting
        inpainted_np = self.model(image_np, final_mask)

        return Image.fromarray(inpainted_np.astype(np.uint8))
