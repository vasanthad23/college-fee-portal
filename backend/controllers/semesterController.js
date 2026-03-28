const Semester = require('../models/Semester');

exports.getAllSemesters = async (req, res) => {
    try {
        const semesters = await Semester.find().sort({ startDate: 1 }); // Sort by date ascending for logical order 1-8
        res.status(200).json({ status: 'success', data: semesters });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.createSemester = async (req, res) => {
    try {
        const newSemester = await Semester.create(req.body);
        res.status(201).json({ status: 'success', data: newSemester });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.updateSemester = async (req, res) => {
    try {
        const semester = await Semester.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!semester) return res.status(404).json({ message: 'Semester not found' });
        res.status(200).json({ status: 'success', data: semester });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
