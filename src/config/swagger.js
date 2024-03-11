const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'A simple express API'
    }
  },
  apis: ['./routes/*.js']
}

export default swaggerOptions
