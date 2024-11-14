// controllers/productController.js

const ProductCategory = require('../models/ProductCategories'); // Import your model
const { formatResponse } = require('../utils/formatResponse');

// Get all categories
exports.getCategories = async (req, res) => {
    try {
        // Fetch categories where deleted is false
        const categories = await ProductCategory.findAll({
            where: {
                deleted: false // Filter out the deleted ones
            }
        });

        // If no categories found
        if (categories.length === 0) {
            return res.status(404).json(formatResponse(null, "No categories found", false));
        }

        // Return the categories in the response
        res.status(200).json(formatResponse(categories, "Categories fetched successfully."));
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
