export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      error: error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }
};