const express = require('express');
const userRoutes = require('./userRoutes'); // User-specific routes
const productRoutes = require('./productRoutes'); // Products-specific routes
const projectsRoutes = require('./projectsRoutes'); // Products-specific routes

const authController = require('../controllers/authController');
const { uploadImage } = require('../controllers/uploadImageController');

const router = express.Router();

const authenticateToken = require('../middlewares/authMiddleware');

// Define routes

// Login route
router.post('/login', authController.loginUser);

// Route to register new user
router.post('/register', authController.createUser);

// Route to check if user exist
router.get('/check-user', authController.checkUserExist);

// Users route
router.use('/users', userRoutes); // Base route for users

router.use('/product', productRoutes); // Base route for products

router.use('/project', projectsRoutes); // Base route for projects

router.post('/uploadImage', authenticateToken, uploadImage); // Base route for upload image

module.exports = router;
