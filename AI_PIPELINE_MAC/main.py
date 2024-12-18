from pipeline.object_removal import ObjectRemovalPipeline
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt  # For macOS-compatible image display

if __name__ == "__main__":
    pipeline = ObjectRemovalPipeline(device="cpu")  # Token is automatically loaded from the environment

    # macOS-compatible file path
    image_path = "./images/interior-with-sofa.jpg"

    # Process the image
    result = pipeline.process(
        image_path=image_path,
        target_object="couch",
        prompt="a clean background with no furniture"
    )

    # Ensure the result is a NumPy array
    if isinstance(result, Image.Image):
        result = np.array(result)

    # Display the result using matplotlib
    plt.imshow(result)
    plt.axis('off')
    plt.title("Result")
    plt.show()