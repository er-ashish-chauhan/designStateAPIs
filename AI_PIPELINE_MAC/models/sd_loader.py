from diffusers import StableDiffusionInpaintPipeline
from config import SD_MODEL_PATH, HF_TOKEN, DEFAULT_DEVICE

def load_stable_diffusion(model_path=SD_MODEL_PATH, token=HF_TOKEN, device=DEFAULT_DEVICE):
    """
    Load the Stable Diffusion Inpainting pipeline.

    Args:
        model_path (str): Path to the Stable Diffusion model. Default is configured in config.py.
        token (str): Hugging Face API token for model access. Default is configured in config.py.
        device (str): Device to run the model on ("cpu" or "cuda"). Default is configured in config.py.

    Returns:
        StableDiffusionInpaintPipeline: The loaded inpainting pipeline.
    """
    print("Loading Stable Diffusion Inpainting model...")
    try:
        if device != "cpu":
            print("macOS detected: Forcing device to 'cpu' as CUDA is not supported on macOS.")
            device = "cpu"

        pipeline = StableDiffusionInpaintPipeline.from_pretrained(
            model_path,
            use_auth_token=token
        ).to(device)

        return pipeline
    except Exception as e:
        raise RuntimeError(f"Failed to load Stable Diffusion model: {e}")