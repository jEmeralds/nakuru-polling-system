const express = require('express')
const router = express.Router()

// GET /api/users
router.get('/', (req, res) => {
  res.json({ 
    message: 'Users endpoint ready!',
    endpoint: 'GET /api/users'
  })
})

// GET /api/users/:id
router.get('/:id', (req, res) => {
  res.json({ 
    message: 'Get user endpoint ready!',
    endpoint: `GET /api/users/${req.params.id}`
  })
})

module.exports = router