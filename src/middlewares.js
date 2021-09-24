function errorHandler(err, req, res, next) {
  console.log(err)
  if (!err.status) {
    return res
      .status(500)
      .json(
        "[AWS CODE] Server Internal Error. Ok, essa cagada foi minha ¬¬'..."
      )
  }

  const error = { error: err.message }
  return res.status(err.status).json(error)
}

module.exports = {
  errorHandler,
}
