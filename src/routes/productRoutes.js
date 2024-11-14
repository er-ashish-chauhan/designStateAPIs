const express = require('express');
const productController = require('../controllers/productController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to get all products
// router.get('/', userController.getAllUsers);

router.get('/categories', authenticateToken, productController.getCategories);

module.exports = router;
