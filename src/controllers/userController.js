const User = require('../models/User');
const UserGallery = require('../models/UserGallery');
const path = require('path'); // To extract file name from the URL

const AWS = require('aws-sdk');

// Load AWS credentials and region
AWS.config.update({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const { formatResponse } = require('../utils/formatResponse');
const ProjectImages = require('../models/ProjectImages');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from token

    // Fetch user details (excluding sensitive info like password)
    const user = await User.findOne({ where: { id: userId }, attributes: ['id', 'firstname', 'lastname', 'email'] });

    if (!user) {
      return res.status(404).json(formatResponse(null, "user not found.", false));
    }

    res.status(200).json(formatResponse(user, "user fetched successfully."));
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'An error occurred while fetching user details' });
  }
};

// Save images to UserGallery
exports.saveImagesToGallery = async (req, res) => {
  try {
      // Retrieve the userId from the JWT token
      const userId = req.user.id; // Extracted from token

      if (!userId) {
          return res.status(401).json(formatResponse(null, 'Invalid token or userId not found', false));
      }

      // Extract image URLs from the request body
      const { images } = req.body; // `images` is expected to be an array of image URLs

      if (!images || !Array.isArray(images) || images.length === 0) {
          return res.status(400).json(formatResponse(null, 'No images provided for saving', false));
      }

      // Prepare gallery entries
      const galleryEntries = images.map(imageUrl => ({
          userId,
          imageUrl,
          imageName: path.basename(imageUrl), // Extract file name from URL
      }));

      // Bulk insert into UserGallery
      const savedImages = await UserGallery.bulkCreate(galleryEntries);

      res.status(201).json(formatResponse(savedImages, 'Images saved to gallery successfully', true));
  } catch (error) {
      console.error('Error saving images to gallery:', error);
      res.status(500).json(formatResponse(null, error.message, false));
  }
};

// Get images from UserGallery by user
exports.getUserGalleryImages = async (req, res) => {
  try {
      const userId = req.user.id; // Retrieve userId from token (req.user set by auth middleware)
      // Fetch images from UserGallery for the given user
      const images = await UserGallery.findAll({
          where: {
              userId: userId,
          },
          attributes: ['id', 'imageUrl', 'imageName', 'createdAt'], // Customize fields if needed
          order: [['createdAt', 'DESC']], // Sort by latest
      });

      if (images.length === 0) {  
          return res.status(404).json(formatResponse(null, 'No images found for this user.', false));
      }

      return res.status(200).json(formatResponse(images, 'Images fetched successfully.', true));
  } catch (error) {
      console.error('Error fetching user gallery images:', error);
      return res.status(500).json(formatResponse(null, error.message, false));
  }
};

// delete image
exports.deleteImageFromGallery = async (req, res) => {
  try {
      const { imageId } = req.params; // Get imageId from URL parameter

      // Validate imageId
      if (!imageId) {
          return res.status(400).json(formatResponse(null, 'Image ID is required', false));
      }

      // Check if the image exists in ProjectImages and is not marked as deleted
      const projectImage = await ProjectImages.findOne({
          where: {
              imageId: imageId,
              deleted: false, // Image is in use
          },
      });

      if (projectImage) {
          return res.status(400).json(formatResponse(null, 'Image is in use for a project and cannot be deleted.', false));
      }

      // Find the image in UserGallery
      const userGalleryImage = await UserGallery.findByPk(imageId);

      if (!userGalleryImage) {
          return res.status(404).json(formatResponse(null, 'Image not found in gallery!', false));
      }

      // Delete the image from S3 bucket
      const s3Params = {
          Bucket: process.env.AWS_BUCKET_NAME, // Your bucket name
          Key: userGalleryImage.imageUrl, // The key should be the exact image path
      };

      // Delete the image from S3
      await s3.deleteObject(s3Params).promise();

      // Remove the image from UserGallery
      await userGalleryImage.destroy();

      // Return a success response
      return res.status(200).json(formatResponse(null, 'Image deleted successfully from UserGallery and S3.', true));
  } catch (error) {
      // Handle errors gracefully
      console.error('Error deleting image:', error);
      return res.status(500).json(formatResponse(null, error.message, false));
  }
};
