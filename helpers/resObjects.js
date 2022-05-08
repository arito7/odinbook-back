exports.createDBErrorRes = (err) => ({
  success: false,
  message: 'Database Error',
  error:
    err.message ||
    `Error occurred while parsing ${err}, make sure you are passing an Error object`,
});
