const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router() 

// Create a Task
router.post('/tasks', auth, async (req, res) => {
  // const task = new Task(req.body)
  const task = new Task({
    ...req.body,
    user: req.user._id
  })
  try {
    await task.save()
    res.status(201).send(task)
  }
  catch(error) {
    res.status(400).send(error)
  }
})

// Get all Tasks
// GET /tasks?completed={boolean}
// GET /tasks?limit={int}?skip={int}
// GET /tasks?sortBy=createdAt:[asc|dsc]
router.get('/tasks', auth, async (req, res) => {
  const match = {}
  const sort = {}
  if (req.query.completed){
    match.completed = req.query.completed === 'true'
  }
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':')
    sort[parts[0]] = parts[1] == 'desc' ? -1 : 1
  }
  try {
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    })
    res.send(req.user.tasks)
  }
  catch(error) {
    res.status(500).send()
  }
})

// Get a Task
router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id
  console.log('id: ',_id)
  try {
     const task = await Task.findOne({
      _id,
      user: req.user._id
    })
    console.log('task: ',task)
    if (!task) {
      return res.status(404).send()
    }
    res.send(task)
  }
  catch(error) {
    res.status(500).send()
  }
})

// Update a Task
router.patch('/tasks/:id', auth, async (req, res) => {
  const allowedUpdates = ['description', 'completed']
  const updates = Object.keys(req.body)
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
    return res.status(400).send({error: 'Invalid updates!'})
  }
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    if (!task) {
      return res.status(404).send()
    }
    updates.forEach(update => task[update] = req.body[update])
    await task.save()
    res.send(task)
  }
  catch (error) {
    res.status(400).send(error)
  }
})

// Delete a Task
router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    })
    if (!task) {
      return res.status(404).send()
    }
    res.send(task)
  }
  catch (e) {
    res.status(500).send()
  }
})

module.exports = router