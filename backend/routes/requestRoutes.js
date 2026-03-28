const express = require('express');
const { createRequest, getMyRequests, getAllRequests, updateRequestStatus, getPendingCount } = require('../controllers/requestController');
const { protect, admin } = require('../controllers/authController');

const router = express.Router();

router.use(protect);

router.post('/', createRequest);
router.get('/me', getMyRequests);

router.get('/', admin, getAllRequests);
router.get('/pending-count', admin, getPendingCount);
router.patch('/:id', admin, updateRequestStatus);

module.exports = router;
