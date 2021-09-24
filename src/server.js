require('dotenv').config()
const app = require('./app')
const { addDbRoutes } = require('./services')
const { errorHandler } = require('./middlewares')

const PORT = process.env.PORT || 3000

async function start() {
  try {
    await addDbRoutes(app, errorHandler)
    app.listen(PORT, console.log('> server running ...'))
  } catch (error) {
    console.log(error)
  }
}

start()
