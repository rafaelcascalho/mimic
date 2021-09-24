const { HttpError } = require('./errors')
const { exists, keys, set, get, delKey } = require('./db')

function validate(expected, received) {
  const props = Object.keys(expected)
  const end = keys.length

  let prop = ''
  let missing = []
  for (let i = 0; i < end; i++) {
    prop = props[i]
    if (prop in received) continue

    missing.push(prop)
  }

  if (missing.length) {
    throw new HttpError(400, `Missing parameter(s) : [ ${missing.join(', ')} ]`)
  }
}

function strToJson(str) {
  return JSON.parse(str.replace(/'/g, '"'))
}

async function listDbRoutes() {
  const all = await keys('*:*')
  if (!all.length) return []

  const queries = all.map((key) => get(key))
  const results = await Promise.allSettled(queries)
  return results.map((result) => JSON.parse(result.value))
}

async function storeRoute({ method, route, result, body }) {
  const key = genKey(method, route)

  const keyExist = await exists(key)
  if (keyExist) {
    throw new HttpError(409, 'Route already stored')
  }

  const value = { path: mountRoutePath(method, route), method, route }
  if (body) value.body = strToJson(body)
  value.result = strToJson(result)

  await set(key, JSON.stringify(value))
}

function genKey(method, route) {
  return `${method.toLowerCase()}:${route}`
}

function mountRoutePath(method, route) {
  return `${method.toUpperCase()} ${route}`
}

function genController(result, body = null) {
  return (req, res, next) => {
    try {
      if (body) validate(strToJson(body), req.body)
      if (typeof result === 'string') result = strToJson(result)
      return res.json(result)
    } catch (error) {
      next(error)
    }
  }
}

function parseServerRoutes(routes) {
  const result = []

  const end = routes.length
  let methods = []
  let routeObj = ''
  let routePath = ''
  for (let i = 0; i < end; i++) {
    routeObj = routes[i]
    routePath = routeObj.route.path
    methods = Object.keys(routeObj.route.methods)
    result.push(
      methods.map((method) => mountRoutePath(method, routePath)).join(',')
    )
  }

  return result
}

async function listRoutes(app) {
  const serverRoutes = app._router.stack.filter(
    (obj) => obj.name === 'bound dispatch'
  )
  const parsedServerRoutes = parseServerRoutes(serverRoutes)
  const dbRoutes = await listDbRoutes()
  return {
    server_routes: {
      number_of_routes: serverRoutes.length,
      routes: parsedServerRoutes,
    },
    db_routes: {
      number_of_routes: dbRoutes.length,
      routes: dbRoutes,
    },
  }
}

function addRouteToApp(app, errorHandler, method, route, result, body = null) {
  app[method](route, genController(result, body))
  app.use(errorHandler)
}

async function addDbRoutes(app, errorHandler) {
  const routes = await listDbRoutes()
  const end = routes.length
  for (let i = 0; i < end; i++) {
    let { method, route, body, result } = routes[i]
    addRouteToApp(app, errorHandler, method, route, result, body)
  }
}

async function destroyRoute(method, route) {
  const key = genKey(method, route)
  await delKey(key)
}

module.exports = {
  storeRoute,
  listRoutes,
  addDbRoutes,
  listDbRoutes,
  destroyRoute,
  genController,
  addRouteToApp,
}
