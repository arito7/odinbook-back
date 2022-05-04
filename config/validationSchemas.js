const { body, validationResult } = require('express-validator');

const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.redirect('/');
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

module.exports = { validateResults, postValidation };
