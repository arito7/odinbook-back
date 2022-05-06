exports.createDBErrorRes = (err) => ({
  success: false,
  message: 'Database Error',
  error: err.message || 'Error parsing error',
});
