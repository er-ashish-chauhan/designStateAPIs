const express = require('express');
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to get all users
router.get('/', userController.getAllUsers);

// Route to create a new user
router.post('/register', userController.createUser);

router.get('/getUserDetails', authenticateToken, userController.getUserDetails);

module.exports = router;
