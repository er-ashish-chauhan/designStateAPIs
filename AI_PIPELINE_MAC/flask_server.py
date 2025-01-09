from flask import Flask, request, jsonify
from subprocess import Popen, PIPE

app = Flask(__name__)

@app.route('/process-image', methods=['POST'])
def process_image():
    file = request.files['image']

    # Read the image bytes
    image_data = file.read()

    # Pass image bytes to main.py via stdin
    try:
        process = Popen(["python", "main.py"], stdin=PIPE, stdout=PIPE, stderr=PIPE)
        stdout, stderr = process.communicate(input=image_data)

        if process.returncode == 0:
            return jsonify({"status": "success", "message": stdout.decode('utf-8')})
        else:
            return jsonify({"status": "error", "message": stderr.decode('utf-8')})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)