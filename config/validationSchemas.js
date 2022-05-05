const { body, validationResult } = require('express-validator');

const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  } else {
    next();
  }
};

const postValidation = [
  body('body')
    .exists({ checkFalsy: true })
    .isLength({ max: 250, min: 1 })
    .trim()
    .escape(),
];

const registerValidation = [
  body('username').exists().trim().escape(),
  body('password').exists(),
  body('rpassword')
    .custom((value, { req }) => value == req.body.password)
    .withMessage('Passwords do not match')
    .exists(),
];

module.exports = { validateResults, postValidation, registerValidation };
