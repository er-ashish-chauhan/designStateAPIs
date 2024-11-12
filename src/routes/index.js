const express = require('express');
const userRoutes = require('./userRoutes'); // User-specific routes

const router = express.Router();

// Define routes
router.use('/users', userRoutes); // Base route for users

module.exports = router;
