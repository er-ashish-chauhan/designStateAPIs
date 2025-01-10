from pipeline.object_removal import ObjectRemovalPipeline
from utils.helpers import preprocess_image
import sys
import json

if __name__ == "__main__":
    # Read binary image data from stdin
    image_data = sys.stdin.buffer.read()

    # Initialize the pipeline
    pipeline = ObjectRemovalPipeline(device="cpu")

    # Preprocess the image (binary data)
    original_image, preprocessed_image, original_size = preprocess_image(image_data)

    # Run the object removal pipeline
    detection_results = pipeline.process(
        image_input=image_data,  # Pass binary image data
        target_object="couch",
        prompt="Fill the area with matching patterns from the surroundings."
    )

    # Output the detection results as JSON
    print(json.dumps(detection_results))