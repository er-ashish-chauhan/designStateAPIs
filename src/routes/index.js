const express = require('express');
const userRoutes = require('./userRoutes'); // User-specific routes
const productRoutes = require('./productRoutes'); // Products-specific routes

const authController = require('../controllers/authController');

const router = express.Router();

// Define routes

// Login route
router.post('/login', authController.loginUser);

// Users route
router.use('/users', userRoutes); // Base route for users

router.use('/product', productRoutes); // Base route for products

module.exports = router;
