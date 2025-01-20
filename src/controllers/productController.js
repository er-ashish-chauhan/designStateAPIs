// controllers/productController.js

const ProductCategory = require('../models/ProductCategories'); // Import your model
const Products = require('../models/Products');
const WishlistedItems = require('../models/WishlistedItems');
const { formatResponse } = require('../utils/formatResponse');
const { furnitureDataItems } = require('../constants');
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

exports.insertProducts = async (req, res) => {
    try {
        // Check if products already exist
        const existingProducts = await Products.findAll({ where: { deleted: false } });
        if (existingProducts.length > 0) {
            return res.status(400).json(formatResponse(null, 'Products already exist in the database.'));
        }

        // Insert products if they do not exist
        await Products.bulkCreate(furnitureDataItems, { validate: true });
        res.status(200).json(formatResponse(null, 'Products inserted successfully!'));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(null, 'An error occurred while inserting products.'));
    }
};

exports.getProducts = async (req, res) => {
    try {
        const { categoryId } = req.query; // Get categoryId from query parameters
        const userId = req.user.id; // Get userId from authenticated user

        // Base query options
        const queryOptions = {
            include: [{
                model: ProductCategory,
                attributes: ['name'], // Include only the category name
                where: { deleted: false }
            }],
            where: { deleted: false }
        };

        // Add category filter if categoryId is provided
        if (categoryId) {
            queryOptions.where.categoryId = categoryId;
        }

        const products = await Products.findAll(queryOptions, {
            attributes: {
                exclude: ['deleted', 'updatedAt']
            },
            where: {
                deleted: false
            }
        });

        // Get all wishlisted items for the current user
        const wishlistedItems = await WishlistedItems.findAll({
            where: { userId, deleted: false },
            attributes: ['productId']
        });

        // Create a Set of wishlisted product IDs for faster lookup
        const wishlistedProductIds = new Set(wishlistedItems.map(item => item.productId));

        // Transform the response to flatten the category information and add wishlist status
        const transformedProducts = products.map(product => {
            const plainProduct = product.get({ plain: true });
            const { deleted, updatedAt, ...rest } = plainProduct;
            return {
                ...rest,
                categoryName: plainProduct.ProductCategory?.name,
                isWishlisted: wishlistedProductIds.has(plainProduct.id),
                ProductCategory: undefined // Remove the nested ProductCategory object
            };
        });

        res.status(200).json(formatResponse(transformedProducts, 'Products fetched successfully!'));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(null, 'An error occurred while fetching products.'));
    }
};

exports.wishlistProduct = async (req, res) => {
    try {
        const userId = req.user.id; // Extracted from token
        const { productId } = req.body;

        // Validate inputs
        if (!productId || !userId) {
            return res.status(400).json(formatResponse(null, 'Product ID and User ID are required.', false));
        }

        // Check if product exists
        const product = await Products.findOne({
            where: { id: productId, deleted: false }
        });
        if (!product) {
            return res.status(404).json(formatResponse(null, 'Product not found.', false));
        }

        // Check if item is already in wishlist
        const existingWishlistItem = await WishlistedItems.findOne({
            where: {
                userId,
                productId,
                deleted: false
            }
        });

        if (existingWishlistItem) {
            return res.status(200).json(formatResponse(null, 'Product is already in your wishlist.', false));
        }

        // Create new wishlist item
        const wishlistItem = await WishlistedItems.create({ productId, userId });
        const {
            deleted,
            updatedAt,
            ...rest
        } = wishlistItem.get({ plain: true });

        res.status(201).json(formatResponse(rest, 'Product added to wishlist successfully!', true));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(null, 'An error occurred while adding the product to wishlist.', false));
    }
};

// get wishlist items API
exports.getWishlistItems = async (req, res) => {
    try {
        const userId = req.user.id; // Extracted from token

        if (!userId) {
            return res.status(400).json(formatResponse(null, 'User ID is required.', false));
        }

        const wishlistItems = await WishlistedItems.findAll({
            where: { userId, deleted: false },
            include: [{
                model: Products,
                include: [{
                    model: ProductCategory,
                    attributes: ['name'],
                    where: { deleted: false }
                }],
                where: { deleted: false }
            }]
        });

        // Transform the response to include product details and flatten the structure
        const transformedWishlist = wishlistItems.map(item => {
            const plainItem = item.get({ plain: true });
            const { Product, deleted, updatedAt, ...wishlistDetails } = plainItem;

            return {
                ...wishlistDetails,
                ...Product,
                categoryName: Product?.ProductCategory?.name,
                isWishlisted: true,
                Product: undefined,
                ProductCategory: undefined
            };
        });

        res.status(200).json(formatResponse(transformedWishlist, 'Wishlist items fetched successfully!'));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(null, 'An error occurred while fetching wishlist items.', false));
    }
};

// remove from wishlist API
exports.removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id; // Extracted from token
        const { productId } = req.params;

        // Validate inputs
        if (!productId || !userId) {
            return res.status(400).json(formatResponse(null, 'Product ID and User ID are required.', false));
        }

        // Find the wishlist item
        const wishlistItem = await WishlistedItems.findOne({
            where: {
                userId,
                productId,
                deleted: false
            }
        });

        if (!wishlistItem) {
            return res.status(404).json(formatResponse(null, 'Item not found in wishlist.', false));
        }

        // Mark as deleted
        await wishlistItem.update({ deleted: true });

        res.status(200).json(formatResponse({ productId }, 'Product removed from wishlist successfully!', true));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(null, 'An error occurred while removing the product from wishlist.', false));
    }
};

// update product API
exports.updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updateData = req.body;

        // Find the product
        const product = await Products.findOne({
            where: {
                id: productId,
                deleted: false
            }
        });

        if (!product) {
            return res.status(404).json(formatResponse(null, 'Product not found.', false));
        }

        // List of allowed fields to update
        const allowedFields = [
            'name', 'type', 'dimensionsUnit', 'dimensions',
            'color', 'material', 'price', 'brand', 'features',
            'weight', 'imageUrl', 'warranty', 'rating', 'reviews',
            'availability', 'tags', 'customizationOptions',
            'shippingDimensions', 'shippingWeight', 'deliveryTime',
            'ecoFriendly', 'careInstructions', 'discount',
            'bundleOffers', 'faq', 'countryOfOrigin', 'categoryId'
        ];

        // Filter out any fields that aren't in the allowed list
        const filteredUpdateData = Object.keys(updateData)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = updateData[key];
                return obj;
            }, {});

        // Update the product
        await product.update(filteredUpdateData);

        // Fetch the updated product
        const updatedProduct = await Products.findOne({
            where: { id: productId },
            include: [{
                model: ProductCategory,
                attributes: ['name'],
                where: { deleted: false }
            }]
        });

        // Transform the response
        const { deleted, ...productData } = updatedProduct.get({ plain: true });
        const transformedProduct = {
            ...productData,
            categoryName: productData.ProductCategory?.name,
            ProductCategory: undefined
        };

        res.status(200).json(formatResponse(transformedProduct, 'Product updated successfully!'));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(null, 'An error occurred while updating the product.', false));
    }
};

