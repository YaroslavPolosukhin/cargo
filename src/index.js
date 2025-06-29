import { WebSocketExpress } from 'websocket-express'
import bodyParser from 'body-parser'
import swaggerUi from 'swagger-ui-express'
import { fileURLToPath } from 'url'
import path from 'path'
import cors from 'cors'
import YAML from 'yamljs'
import $RefParser from 'json-schema-ref-parser'
import authMiddleware from './middlewares/checkAuth.js'
import authRoutes from './routes/auth.js'
import ordersRoutes from './routes/orders.js'
import nomenclatureRoutes from './routes/nomenclature.js'
import driversRoutes from './routes/drivers.js'
import addressRoutes from './routes/address.js'
import contactsRoutes from './routes/contacts.js'
import measureRoutes from './routes/measure.js'
import generalRoutes from './routes/general.js'
import managerRoutes from './routes/manager.js'
import logisticPointsRoutes from './routes/logisticPoints.js'
import companyManagerRoutes from './routes/companyManager.js'
import wsRoutes from './routes/ws.js'
import admin from 'firebase-admin'
import { createRequire } from 'node:module'
import { responseLogger } from './middlewares/logger.js'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'))
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const app = new WebSocketExpress()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(WebSocketExpress.json())
app.use(WebSocketExpress.urlencoded({ extended: true }))
app.use(responseLogger)
app.set('shutdown timeout', 1000)

const serverIps = process.env.WEB_SERVER.split(',')

const allowlist = [
  'http://localhost:4000',
  'localhost:4000'
]

for (const ip of serverIps) {
  allowlist.push(ip)
  allowlist.push('http://' + ip)
  allowlist.push('https://' + ip)
}

const corsOptionsDelegate = function (req, callback) {
  let corsOptions

  let origin = null
  if (Object.hasOwn(req.headers, 'origin')) {
    origin = req.headers.origin
  } else if (Object.hasOwn(req.headers, 'Origin')) {
    origin = req.headers.Origin
  } else if (Object.hasOwn(req.headers, 'host')) {
    origin = req.headers.host
  }

  if (allowlist.indexOf(origin) !== -1) {
    corsOptions = { origin: true }
  } else {
    corsOptions = { origin: false }
  }

  callback(null, corsOptions)
}

app.use('/uploads', cors(corsOptionsDelegate), WebSocketExpress.static(path.join(__dirname, '..', 'uploads')))

const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'swagger.yaml'))

app.get('/', (req, res) => {
  res.send('Cargo Delivery App Backend')
})

$RefParser
  .dereference(swaggerDocument)
  .then((schema) => {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(schema))
  })
  .catch((err) => {
    console.error('Error resolving $ref in Swagger document:', err)
  })

app.use('/api/auth', cors(corsOptionsDelegate), authRoutes)
app.use('/api/orders', cors(corsOptionsDelegate), authMiddleware, ordersRoutes)
app.use('/api/general', cors(corsOptionsDelegate), authMiddleware, generalRoutes)
app.use('/api/address', cors(corsOptionsDelegate), authMiddleware, addressRoutes)
app.use('/api/contacts', cors(corsOptionsDelegate), authMiddleware, contactsRoutes)
app.use('/api/measures', cors(corsOptionsDelegate), authMiddleware, measureRoutes)
app.use('/api/nomenclature', cors(corsOptionsDelegate), authMiddleware, nomenclatureRoutes)
app.use('/api/drivers', cors(corsOptionsDelegate), authMiddleware, driversRoutes)
app.use('/api/logisticPoint', cors(corsOptionsDelegate), authMiddleware, logisticPointsRoutes)
app.use('/api/managers', cors(corsOptionsDelegate), authMiddleware, managerRoutes)
app.use('/api/companyManagers', cors(corsOptionsDelegate), authMiddleware, companyManagerRoutes)
app.use('/api/ws', authMiddleware, wsRoutes)

const PORT = process.env.PORT || 8080

const server = app.createServer()

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`)
})

export default app
