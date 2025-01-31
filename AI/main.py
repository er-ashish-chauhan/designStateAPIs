from pipeline.object_detection_update import ObjectDetectionPipeline
import sys
import json
import uuid
from datetime import datetime

def generate_request_id():
    """Generate unique request ID matching Flask server format"""
    return f"req_{uuid.uuid4().hex[:8]}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

if __name__ == "__main__":
    # Read binary image data from stdin
    image_data = sys.stdin.buffer.read()
    
    # Generate unique request ID
    request_id = generate_request_id()
    
    # Initialize pipeline
    pipeline = ObjectDetectionPipeline(device="cpu")

    try:
        # Process image with request tracking
        masks_path = pipeline.process(image_data=image_data, request_id=request_id)
        
        # Load and enrich results with request ID
        with open(masks_path, "r") as f:
            results = json.load(f)
            
        output = {
            "request_id": request_id,
            "masks": results
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        error_response = {
            "request_id": request_id,
            "error": str(e)
        }
        print(json.dumps(error_response))
        sys.exit(1)