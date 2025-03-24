import fs from 'fs'
import path from 'path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const createFolders = (url, startFolder) => {
  const folders = url.split('/')
  let folder = startFolder

  for (let i = 0; i < folders.length; i++) {
    folder += `/${folders[i]}`
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, (err) => console.error(`Error creating directory: ${err}`))
    }
  }

  return folder
}

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

    const goodStatuses = [200, 201, 204, 304]
    const excludedUrls = ['/api/docs', '/', '/api/auth/refresh']

    if (!goodStatuses.includes(res.statusCode) && !excludedUrls.includes(req.originalUrl) && req.originalUrl.startsWith('/api/')) {
      try {
        let errorResponsesPath = path.join(__dirname, '..', '..', 'error_responses')
        if (!fs.existsSync(errorResponsesPath)) {
          fs.mkdirSync(errorResponsesPath, (err) => console.error(`Error creating directory: ${err}`))
        }

        errorResponsesPath = createFolders(req.originalUrl, errorResponsesPath)

        const data = `${req.method} ${req.originalUrl} ${res.statusCode}\n\nreq body:\n${JSON.stringify(req.body)}\n\nres.body:\n${JSON.stringify(JSON.parse(res.body))}`

        fs.appendFileSync(path.join(errorResponsesPath, `${Date.now()}.txt`), data, (err) => console.error(`Error writing response to file: ${err}`))
      } catch (err) {
        console.error(`Error writing response to file: ${err}`)
      }
    }
  })

  next()
}
