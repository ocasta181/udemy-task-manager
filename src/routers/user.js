const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')
const router = new express.Router()

// Create a User
router.post('/users', async (req, res) => {
  const user = new User(req.body)
  try {
    await user.save()
    sendWelcomeEmail(user.email, user.name)
    const token = await user.generateAuthToken()
    res.status(201).send({ user, token })
  }
  catch (error) {
    res.status(400).send(error)
  }
})

// User Login
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()
    res.send({ user, token })
  }
  catch (e) {
    console.log(e)
    res.status(400).send()
  }
})

// User Logout
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token
    })
    await req.user.save()

    res.send()
  }
  catch (e) {
    res.status(500).send()
  }
})

// User Logout All Sessions
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  }
  catch (e) {
    res.status(500).send()
  }
})

// Get my User
router.get('/users/me', auth, async (req, res) => {
  try {
    res.send(req.user)
  }
  catch (error) {
    res.status(500).send()
  }
})

// Update a User
router.patch('/users/me', auth, async (req, res) => {
  const allowedUpdates = ['name', 'email', 'password', 'age']
  const updates = Object.keys(req.body)
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
    return res.status(400).send({error: 'Invalid updates!'})
  }
  try {
    updates.forEach(update => req.user[update] = req.body[update])
    await req.user.save()
    res.send(req.user)
  }
  catch (error) {
    res.status(400).send(error)
  }
})

// Delete a User
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove()
    sendCancellationEmail(req.user.email, req.user.name)
    res.send(req.user)
  }
  catch (e) {
    res.status(500).send()
  }
})


// Avatar Upload Multer
const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpe?g|png)$/)) {
      return cb(new Error('File must be a JPEG, JPG, or PNG'))
    }
    cb(undefined, true)
  }
})

// Upload User's Avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()

  req.user.avatar = buffer
  await req.user.save()
  res.send()
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message})
})

// Delete User's Avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
  
  req.user.avatar = undefined 
  await req.user.save()
  res.send()
})

// Get a User's Avatar
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error()
    }

    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
  }
  catch (e) {
    res.status(404).send()
  }
})

module.exports = router