'use strict';

const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const controller = require('./dashboard.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/', controller.getStats);
router.get('/stats', controller.getStats);
router.get('/activity', controller.getActivity);

module.exports = router;
