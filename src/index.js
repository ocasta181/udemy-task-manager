require('dotenv').config()
const express = require('express')
require('./db/mongoose')

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const MAINTINANCE = false

const app = express()
const port = process.env.PORT

app.use((req, res, next) => {
  if (MAINTINANCE) {
    return res.status(503).send("Resource under maintinance")
  }
  next()
})

app.use(express.json())

app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
  console.log(`Server is up on port ${port}`)
})