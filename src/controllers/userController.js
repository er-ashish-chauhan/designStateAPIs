const User = require('../models/User');

const { formatResponse } = require('../utils/formatResponse');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from token

    // Fetch user details (excluding sensitive info like password)
    const user = await User.findOne({ where: { id: userId }, attributes: ['id', 'firstname', 'lastname', 'email'] });

    if (!user) {
      return res.status(404).json(formatResponse(null, "user not found.", false));
    }

    res.status(200).json(formatResponse(user, "user fetched successfully."));
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'An error occurred while fetching user details' });
  }
};