const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// Route to get all users
router.get('/', userController.getAllUsers);

// Route to create a new user
router.post('/', userController.createUser);

module.exports = router;
