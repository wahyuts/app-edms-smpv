const multerConfig = {
  // Final upload storage strategy will be configured in the Upload API phase.
  limits: {
    files: 1,
  },
};

module.exports = multerConfig;
