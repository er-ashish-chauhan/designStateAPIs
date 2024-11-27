const AWS = require('aws-sdk');
const express = require('express');
const multer = require('multer');
const path = require('path');
const { formatResponse } = require('../utils/formatResponse');

const router = express.Router();

// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY, // Replace with your access key
    secretAccessKey: process.env.AWS_S3_SECRET_KEY, // Replace with your secret key
    region: process.env.AWS_REGION, // Replace with your bucket region
});

const s3 = new AWS.S3();

// Configure Multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(), // Store file in memory
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

// API to upload image(s)
exports.uploadImage = [
    upload.array('images', 10), // Accept multiple files (up to 10)
    async (req, res) => {
        try {
            const files = req.files; // Multer stores files in req.files
            const folder = req.body.folder; // Get folder from the request body

            if (!files || files.length === 0) {
                return res.status(400).json(formatResponse(null, 'No file(s) uploaded.', false));
            }

            if (!folder) {
                return res.status(400).json(formatResponse(null, 'Folder name is required.', false));
            }

            // Function to upload a single file to S3
            const uploadFileToS3 = async (file) => {
                const fileName = `${folder}/${Date.now()}-${file.originalname}`; // Create a unique file name
                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME, // Replace with your bucket name
                    Key: fileName, // File path in the bucket
                    Body: file.buffer, // File content
                    ContentType: file.mimetype, // File MIME type
                };

                const uploadResult = await s3.upload(params).promise();
                return fileName; // Return only the file path
            };

            // Handle single or multiple files
            let uploadedUrls = [];
            for (const file of files) {
                const uploadedFilePath = await uploadFileToS3(file);
                uploadedUrls.push(uploadedFilePath);
            }

            res.status(200).json(
                formatResponse(
                    { urls: uploadedUrls }, // Array of uploaded file paths
                    'File(s) uploaded successfully',
                    true
                )
            );
        } catch (error) {
            console.error('Error uploading file(s):', error);
            res.status(500).json(formatResponse(null, error.message, false));
        }
    }
];
