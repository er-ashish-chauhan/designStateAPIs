from ultralytics import YOLO
from config import YOLO_SEGMENTATION_MODEL_PATH, USE_SEGMENTATION

def load_yolo_model():
    """
    Loads a YOLO model using the Ultralytics YOLO package.

    Returns:
        YOLO: An instance of the YOLO model.
    """
    print("Loading YOLO model...")
    try:
        # Use YOLO Segmentation model path based on config
        model_path = YOLO_SEGMENTATION_MODEL_PATH if USE_SEGMENTATION else None
        
        if not model_path:
            raise ValueError("No YOLO model path specified in the configuration.")

        # Load the YOLO model
        model = YOLO(model_path)  # Automatically downloads if not present
        print(f"YOLO model loaded successfully from: {model_path}")
        return model

    except Exception as e:
        raise RuntimeError(f"Failed to load YOLO model: {e}")