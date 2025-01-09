import os,cv2
from pipeline.object_removal import ObjectRemovalPipeline

# Initialize the pipeline
pipeline = ObjectRemovalPipeline(device="cpu")

# Directory containing the images
image_dir = "./images"
output_dir = "./results"
os.makedirs(output_dir, exist_ok=True)

# List all image files (assuming .jpg, .jpeg, .png formats)
image_files = [f for f in os.listdir(image_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

# Process up to 30 images
for idx, image_file in enumerate(image_files[:], start=1):
    image_path = os.path.join(image_dir, image_file)
    print(f"\n--- Processing Image {idx}/{len(image_files[:30])}: {image_file} ---")
    
    # Run the pipeline for object detection only
    result = pipeline.process(
        image_path=image_path,
        target_object="couch",  # Change this to any object you want to target
        prompt="a clean background"
    )

    # Save the result image to the output directory
    result_path = os.path.join(output_dir, f"result_{image_file}")
    print(f"Saving result to: {result_path}")
    cv2.imwrite(result_path, result)