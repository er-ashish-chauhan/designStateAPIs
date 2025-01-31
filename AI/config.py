# config.py
import os
# Default model paths for YOLO segmentation (used for mask creation)
YOLO_SEGMENTATION_MODEL_PATH = "./models/yolov8x-seg.pt"  # Update path if needed

# Default model path for LaMa inpainting
LAMA_MODEL_PATH = "./models/big-lama" 
LAMA_CONFIG = "./models/big-lama/config.yaml"

LAMA_DEVICE = "cpu"


# Device configuration
PLATFORM = "mac" if "darwin" in os.sys.platform.lower() else "windows"  # Auto-detect platform
DEFAULT_DEVICE = "cpu"

# Enable or disable segmentation visualization
DISPLAY_RESULTS = False  # Set to False to disable all intermediate visualizations

# Enable or disable inpainting
ENABLE_INPAINTING = True

# Mask adjustment parameters
DILATION_ITERATIONS = 5
BLUR_KERNEL_SIZE = (25, 25)

# Toggle between object detection and segmentation (set to True for segmentation)
USE_SEGMENTATION = True

# Reserved for potential multi-method inpainting
INPAINT_METHOD = "lama"  # Options: "lama", "opencv" (Stable Diffusion removed)

# Temporary storage configuration
TEMP_IMAGE_STORAGE = "./temp_images"
CLEANUP_INTERVAL = 3600  # Seconds for temp file cleanup



TEMP_IMAGE_STORAGE = "./temp_requests"  # Changed from generic 'temp_images'

# HOST = "http://34.203.14.46"
HOST = "0.0.0.0"
PORT = 3001