const express = require('express')

const { listRoutes, storeRoute, addRouteToApp, destroyRoute } = require('./services')
const { errorHandler } = require('./middlewares')

const app = express()

app.use(express.json())

app.get('/health', (req, res) => {
  return res.json({ status: 'UP' })
})

app.get('/routes', async (req, res) => {
  const routes = await listRoutes(app)
  return res.json(routes)
})

app.post('/routes', async (req, res, next) => {
  try {    
    await storeRoute(req.body)
    
    const { method, route, body, result } = req.body

    addRouteToApp(app, errorHandler, method, route, result, body)

    const routes = await listRoutes(app)

    return res.json(routes)
  } catch (error) {
    next(error)
  }
})

app.delete('/routes', async (req, res, next) => {
  try {
    const { method, route } = req.body

    await destroyRoute(method, route)

    return res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.use(errorHandler)

module.exports = app
