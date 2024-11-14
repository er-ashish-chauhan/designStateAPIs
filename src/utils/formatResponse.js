// utils/formatResponse.js

exports.formatResponse = (data, message = 'Success', success = true) => ({
    success,
    message,
    data
});

  