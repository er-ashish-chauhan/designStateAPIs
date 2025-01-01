const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const ProductCategory = require('./ProductCategories');

const Products = sequelize.define('Products', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ProductCategories',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.STRING,
  },
  dimensionsUnit: {
    type: DataTypes.STRING,
  },
  dimensions: {
    type: DataTypes.JSON,
  },
  color: {
    type: DataTypes.STRING,
  },
  material: {
    type: DataTypes.STRING,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
  },
  brand: {
    type: DataTypes.STRING,
  },
  features: {
    type: DataTypes.JSON,
  },
  weight: {
    type: DataTypes.STRING,
  },
  imageUrl: {
    type: DataTypes.JSON,
  },
  warranty: {
    type: DataTypes.STRING,
  },
  rating: {
    type: DataTypes.FLOAT,
  },
  reviews: {
    type: DataTypes.INTEGER,
  },
  availability: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  tags: {
    type: DataTypes.JSON,
  },
  customizationOptions: {
    type: DataTypes.JSON,
  },
  shippingDimensions: {
    type: DataTypes.JSON,
  },
  shippingWeight: {
    type: DataTypes.STRING,
  },
  deliveryTime: {
    type: DataTypes.STRING,
  },
  ecoFriendly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  careInstructions: {
    type: DataTypes.TEXT,
  },
  discount: {
    type: DataTypes.INTEGER,
  },
  bundleOffers: {
    type: DataTypes.TEXT,
  },
  faq: {
    type: DataTypes.JSON,
  },
  countryOfOrigin: {
    type: DataTypes.STRING,
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
});

Products.belongsTo(ProductCategory, {
    foreignKey: 'categoryId'
});

module.exports = Products;
