from pipeline.object_removal import ObjectRemovalPipeline
from PIL import Image
import numpy as np
import json
import sys
from io import BytesIO

if __name__ == "__main__":
    # Read image data from stdin
    image_data = sys.stdin.buffer.read()
    image = Image.open(BytesIO(image_data))

    # Initialize the pipeline
    pipeline = ObjectRemovalPipeline(device="cpu")

    # Process the image
    detection_results = pipeline.process(
        image_path=None,  # No path, directly pass the image
        target_object="couch",
        prompt="Fill the area with matching patterns from the surroundings."
    )

    # Example: Simulate detection results (replace this with actual pipeline results)
    results = {
        "detected_objects": [
            {"label": "couch", "confidence": 0.95, "bbox": [100, 200, 300, 400]}
        ]
    }

    # Output the results as JSON
    print(json.dumps(results))