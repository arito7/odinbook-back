module.exports.createDBErrorRes = (err) => ({
  success: false,
  message: 'Database Error',
  error:
    err.message ||
    `Error occurred while parsing ${err}, make sure you are passing an Error object`,
});

module.exports.createGenericRes = (successBoolean, message) => ({
  success: successBoolean,
  message,
});

module.exports.createFailRes = (message, error = null) => ({
  success: false,
  message,
  error,
});

module.exports.createSuccessRes = (message, dataObj = null) => ({
  success: true,
  message,
  ...dataObj,
});
