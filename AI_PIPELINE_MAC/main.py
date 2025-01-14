from pipeline.object_removal import ObjectRemovalPipeline
from utils.helpers import preprocess_image
import json
import sys

def process_image(image_data):
    # Initialize the pipeline
    pipeline = ObjectRemovalPipeline(device="cpu")

    # Preprocess the image
    original_image, preprocessed_image, original_size = preprocess_image(image_data)

    print("Image received and pre-processed")

    # Run the object removal pipeline
    detection_results = pipeline.process(
        image_input=image_data,  # Pass binary image data
        target_object="couch",
        prompt="Fill the area with matching patterns from the surroundings."
    )
    return detection_results

if __name__ == "__main__":
    # Check for an input file path (optional)
    if len(sys.argv) > 1:
        with open(sys.argv[1], "rb") as f:
            image_data = f.read()
    else:
        print("Please provide an image file path.", file=sys.stderr)
        sys.exit(1)

    # Process the image and print the JSON results
    results = process_image(image_data)
    print(json.dumps(results))