# config.py

# Default model paths for YOLO and Stable Diffusion
YOLO_MODEL_PATH = "./models/yolov5s.pt"
SD_MODEL_PATH = "stabilityai/stable-diffusion-2-inpainting"

# Device configuration (macOS uses CPU by default)
DEFAULT_DEVICE = "cpu"

# Hugging Face API token
HF_TOKEN = "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"

# Inpainting method: "opencv" or "stable-diffusion"
INPAINT_METHOD = "stable-diffusion"