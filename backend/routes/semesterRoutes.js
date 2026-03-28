const express = require('express');
const semesterController = require('../controllers/semesterController');
// Add auth middleware later for protection
const router = express.Router();

router.route('/')
    .get(semesterController.getAllSemesters)
    .post(semesterController.createSemester);

router.route('/:id')
    .patch(semesterController.updateSemester);

module.exports = router;
