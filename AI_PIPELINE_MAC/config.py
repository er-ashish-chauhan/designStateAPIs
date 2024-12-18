# config.py

# Default model paths for YOLO and Stable Diffusion
YOLO_MODEL_PATH = "./models/yolov5s.pt"
SD_MODEL_PATH = "stabilityai/stable-diffusion-2-inpainting"

# Device configuration (macOS uses CPU by default)
DEFAULT_DEVICE = "cpu"

# Enable or disable detection display
DISPLAY_DETECTION = True # Set to False to disable detection visualization

# Hugging Face API token
HF_TOKEN = "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"

ENABLE_INPAINTING = True
# Inpainting method: "opencv" or "stable-diffusion"
INPAINT_METHOD = "stable-diffusion"