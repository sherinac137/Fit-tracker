const express = require('express');
const router = express.Router();
const Weight = require('../models/weightModel');

const isAuthenticated = (req, res, next) => {

    if (req.session && req.session.userEmail) {
        return next();
    }
      res.redirect('/login');
    };

// Render the Ajaxweight form view
router.get('/', isAuthenticated, (req, res) => {
    res.render('Ajaxweight');
});

// Handle the weight loss calculation
router.get('/weightloss', isAuthenticated, (req, res) => {
    const { startDate, endDate } = req.query;
    console.log('Session UserID:', req.session.userId);
    console.log('Received dates:', startDate, endDate);

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    // Ensure the end date covers the entire day
    parsedEndDate.setHours(23, 59, 59, 999);

    if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
        console.log('Invalid date format.');
        return res.status(400).json({ error: 'Invalid date format provided.' });
    }

    if (parsedStartDate > parsedEndDate) {
        console.log('Start date must be before end date.');
        return res.status(400).json({ error: 'Start date must be before end date.' });
    }

    Weight.find({
        userId: req.session.userId,
        date: { $gte: parsedStartDate, $lte: parsedEndDate }
    })
    .sort({ date: 1 })
    .then(weightsInRange => {
        console.log('Weights found:', weightsInRange);

        if (weightsInRange.length < 2) {
            console.log(`Not enough data: Found ${weightsInRange.length} entries.`);
            return res.status(400).json({ error: 'Not enough data to calculate weight loss.' });
        }

        const weightLoss = weightsInRange[0].weight - weightsInRange[weightsInRange.length - 1].weight;
        console.log(`Weight Loss: ${weightLoss} kg`);
        res.json({ weightLoss });
    })
    .catch(err => {
        console.error('Error querying weights:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    });
});

module.exports = router;
