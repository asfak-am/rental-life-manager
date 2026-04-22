const errorMiddleware = (err, req, res, next) => {
  const status = res.statusCode === 200 ? 500 : res.statusCode
  console.error(err.stack)
  res.status(status).json({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  })
}

module.exports = errorMiddleware