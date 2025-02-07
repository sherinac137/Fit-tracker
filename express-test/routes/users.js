var express = require('express');
var router = express.Router();
const User = require('../models/userModel');
const Weight = require('../models/weightModel'); 
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');



// Render signup
router.get('/signup', function(req, res) {
    res.render('signup', { message: null, error: null });
});

// Handle signup form
router.post('/signup', async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
        return res.render('signup', { message: 'Please fill all fields.', error: null });
    }

    if (password !== confirmPassword) {
        return res.render('signup', { message: 'Password and Confirm Password do not match', error: null });
    }

    try {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.render('signup', { message: 'Email already taken', error: null });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const signupUser = new User({
            email,
            password: hashedPassword,
        });
        const validationError = signupUser.validateSync();
        if (validationError) {
            let errorMessage = '';
            for (let field in validationError.errors) {
                errorMessage += validationError.errors[field].message + ' ';
            }
            return res.render('signup', { message: null, error: errorMessage.trim() });
        }
        
        await signupUser.save();
        res.redirect('/users/login');
    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error');
        }
    }
});



// Render login page
router.get('/login', (req, res) => {
    const email = req.session.userEmail || null;
    console.log('Logged in User ID:', req.session.userId);
    res.render('login', { email, title: 'Login', message: null });
});

// Handle login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const errors = req.validationErrors || [];
    const validationResultErrors = validationResult(req);

    if (!validationResultErrors.isEmpty()) {
        errors.push(...validationResultErrors.array());
    }

    if (errors.length > 0) {
        res.render('login', { errors, message: null });
    } else {
        User.findOne({ email })
            .then(user => {
                if (!user) {
                    return res.render('login', { message: 'Incorrect Email Address.', errors: [] });
                }
                return bcrypt.compare(password, user.password)
                    .then(isPasswordValid => {
                        if (!isPasswordValid) {
                            return res.render('login', { message: 'Incorrect password.', errors: [] });
                        }
                        
                        req.session.userId = user._id;
                        req.session.userEmail = user.email;

                        // Save the session and respond
                        req.session.save(err => {
                            if (err) {
                                console.error(err);
                                return res.status(500).send('Internal Server Error');
                            }
                            res.render('home', { 
                                email: user.email,
                                message: 'Login successful',
                                error: null 
                            });
                        });
                    });
            })
            .catch(error => {
                console.error(error);
                res.status(500).send('Internal Server Error');
            });
    }
});


// Logout route
router.get('/logout', (req, res) => {
    console.log('Session before destruction for user with ID:', req.session.userId);

    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.send('Error');
        }

        res.clearCookie('connect.sid', { path: '/' });
        console.log('Session after destruction:', req.session);
        res.redirect('/users/login');
    });
});

//about us
 
router.get('/about-us', function (req,res) {
    res.render('about-us')
  })
module.exports = router;

// Define the isAuthenticated middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        console.log('Authenticated user:', req.session.userId);
        return next();
    }
    console.log('User not authenticated. Redirecting to login...');
    res.redirect('/users/login');
};


router.use(isAuthenticated);

// Add weight
router.get('/add-weight', (req, res) => {
    res.render('home', { message: null, error: null });
});

// Handle Add weight
router.post('/add-weight', (req, res) => {
    const weight = req.body.weight;

    if (!weight) {
        return res.render('home', { message: 'Please enter your weight.', error: 'Weight is required.' });
    }

    Weight.findOne({
        userId: req.session.userId,
        date: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
    })
    .then(existingWeight => {
        if (existingWeight) {
            return res.render('home', { message: 'You can only add your weight once per day.', error: null });
        }

        const newWeight = new Weight({
            userId: req.session.userId,
            weight,
            date: new Date(),
        });
        return newWeight.save();
    })
    .then(() => {

        if (!res.headersSent) {
            res.render('home', { message: 'Weight added successfully!', error: null });
        }

    })
    .catch(err => {
        console.error(err);
        if (!res.headersSent) {
            res.render('home', { message: 'Error saving weight.', error: err.message });
        }
    });
});

// List weights

router.get('/list-weights', (req, res) => {
    Weight.find({ userId: req.session.userId }).sort({ date: -1 })
        .then(weights => {
            res.render('listWeights', { weights, message: req.query.success || null, error: req.query.error || null });
        })
        .catch(error => {
            console.error("Error fetching weights:", error);
            res.status(500).render('home', { message: 'Internal Server Error', error: null });
        });
});


// Route for listing weights with pagination

router.get('/listing_page', (req, res) => {
    const { page = 1, limit = 1 } = req.query;

    Weight.paginate({ userId: req.session.userId }, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    })
    .then(result => {
        res.render('list', { weights: result.docs, pagination: result });
    })
    .catch(error => {
        console.error(error);
        res.status(500).send('Internal Server Error');
    });
});

// Edit weight route

router.get('/edit/:id', (req, res) => {
    Weight.findById(req.params.id)
        .then(weight => {
            if (!weight || weight.userId.toString() !== req.session.userId) {
                return res.status(404).send('Weight not found');
            }
            res.render('edit-weight', { weight });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

// Handle edit form submission

router.post('/edit/:id', (req, res) => {
    const { weight } = req.body;

    if (!weight) {
        return res.render('edit-weight', {
            message: 'Weight is required.',
            weight: { _id: req.params.id, weight },
        });
    }

    Weight.findByIdAndUpdate(req.params.id, { weight }, { new: true, runValidators: true })
        .then(updatedWeight => {
            if (!updatedWeight || updatedWeight.userId.toString() !== req.session.userId) {
                return res.status(404).send('Weight not found');
            }
            res.redirect('/users/list-weights');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

// Delete weight

router.post('/delete/:id', (req, res) => {
    Weight.findById(req.params.id)
        .then(weight => {
            if (!weight || weight.userId.toString() !== req.session.userId) {
                return res.render('listWeights', { message: null, error: 'Weight not found', weights: req.weights });
            }
            return Weight.findByIdAndDelete(req.params.id);
        })
        .then(() => {
            Weight.find({ userId: req.session.userId }).sort({ date: -1 })
                .then(weights => {
                    res.render('listWeights', { message: 'Weight deleted successfully!', error: null, weights: weights });
                })
                .catch(err => {
                    console.error(err);
                    res.render('listWeights', { message: null, error: 'Error fetching weights', weights: [] });
                });
        })
        .catch(err => {
            console.error(err);
            res.render('listWeights', { message: null, error: 'Internal Server Error', weights: [] });
        });
});



