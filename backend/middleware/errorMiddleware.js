export const notFound = (req, res, next) => {
  res.status(404);

  next(
    new Error(
      `Route not found: ${req.method} ${req.originalUrl}`
    )
  );
};

export const errorHandler = (error, req, res, next) => {
  let statusCode =
    res.statusCode === 200 ? 500 : res.statusCode;

  let message = error.message || "Internal server error";

  if (error.name === "ValidationError") {
    statusCode = 400;

    message = Object.values(error.errors)
      .map((currentError) => currentError.message)
      .join(", ");
  }

  if (error.code === 11000) {
    statusCode = 409;

    const duplicateField = Object.keys(
      error.keyValue
    )[0];

    message = `${duplicateField} already exists`;
  }

  if (error.name === "CastError") {
    statusCode = 400;

    message = `Invalid ${error.path}: ${error.value}`;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    stack:
      process.env.NODE_ENV === "production"
        ? undefined
        : error.stack
  });
};