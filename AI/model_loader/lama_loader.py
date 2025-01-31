from lama.saicinpainting.training.trainers import load_checkpoint
from config import LAMA_MODEL_PATH, LAMA_CONFIG, DEFAULT_DEVICE
from omegaconf import OmegaConf

def load_lama_model():
    """
    Load the LaMa model for inference, skipping unnecessary components.
    """
    print("Loading LaMa configuration...")
    config = OmegaConf.load(LAMA_CONFIG)

    # Remove unnecessary keys like 'trainer'
    if "trainer" in config:
        del config["trainer"]

    print("Initializing LaMa model for inference...")
    model = load_checkpoint(config, LAMA_MODEL_PATH, map_location=DEFAULT_DEVICE)
    model['generator'].to(DEFAULT_DEVICE).eval()

    print("LaMa model loaded successfully.")
    return model