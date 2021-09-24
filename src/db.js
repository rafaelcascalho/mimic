const Redis = require('ioredis')
const { promisify } = require('util')

const client = new Redis(process.env.REDIS_URL)

const set = promisify(client.set).bind(client)
const get = promisify(client.get).bind(client)
const keys = promisify(client.keys).bind(client)
const delKey = promisify(client.del).bind(client)
const exists = promisify(client.exists).bind(client)

module.exports = {
  set,
  get,
  keys,
  exists,
  delKey,
}
