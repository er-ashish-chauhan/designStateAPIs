from ultralytics import YOLO
from config import YOLO_MODEL_PATH

def load_yolo_model(model_path=YOLO_MODEL_PATH):
    """
    Loads a YOLO model using the Ultralytics YOLO package.

    Args:
        model_path (str): Path to the YOLO model file (.pt). Defaults to YOLO_MODEL_PATH.

    Returns:
        YOLO: An instance of the YOLO model.
    """
    print("Loading YOLO model...")
    try:
        model = YOLO(model_path)  # Automatically downloads if not present
        return model
    except Exception as e:
        raise RuntimeError(f"Failed to load YOLO model: {e}")