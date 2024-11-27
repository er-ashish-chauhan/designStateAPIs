const express = require('express');
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to get all users
router.get('/', authenticateToken, userController.getAllUsers);

router.get('/getUserDetails', authenticateToken, userController.getUserDetails);

router.get('/saveImagesToGallery', authenticateToken, userController.saveImagesToGallery);

router.get('/getGalleryImages', authenticateToken, userController.getUserGalleryImages);

// Route for delete images
router.delete('/deleteGalleryImage/:imageId', authenticateToken, userController.deleteImageFromGallery);

module.exports = router;
