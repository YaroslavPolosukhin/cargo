import fs from 'fs'
import path from 'path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export const responseLogger = (req, res, next) => {
  const originalSend = res.send

  res.send = function (body) {
    res.body = body // Store the response body
    return originalSend.apply(this, arguments)
  }

  const originalJson = res.json
  res.json = function (body) {
    res.body = body // Store the response body
    return originalJson.apply(this, arguments)
  }

  res.on('finish', () => {
    console.log(`Response status for ${req.method} ${req.originalUrl}: ${res.statusCode}`)

    const goodStatuses = [200, 201, 204, 304, 404]
    const excludedUrls = ['/api/docs', '/']

    if (!goodStatuses.includes(res.statusCode) && !excludedUrls.includes(req.originalUrl)) {
      try {
        if (!fs.existsSync(path.join(__dirname, '..', '..', 'error_responses'))) {
          fs.mkdirSync(path.join(__dirname, '..', '..', 'error_responses'), (err) => console.error(`Error creating directory: ${err}`))
        }

        const data = `${req.method} ${req.originalUrl} ${res.statusCode}\n\nreq body:\n${JSON.stringify(req.body)}\n\nres.body:\n${JSON.stringify(JSON.parse(res.body))}`

        fs.appendFileSync(path.join(__dirname, '..', '..', 'error_responses', `${Date.now()}.txt`), data, (err) => console.error(`Error writing response to file: ${err}`))
      } catch (err) {
        console.error(`Error writing response to file: ${err}`)
      }
    }
  })

  next()
}
