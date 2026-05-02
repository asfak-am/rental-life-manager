const express = require('express')
const { submitSupportRequest } = require('../controllers/helpController')

const router = express.Router()

router.post('/contact', submitSupportRequest)

module.exports = router