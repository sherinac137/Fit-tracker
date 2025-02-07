var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const db = require('./database/db');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var AjaxweightRouter = require('./routes/Ajaxweight');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session setup (should be before routes)
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// User ID initialization for testing
//app.use((req, res, next) => {
//    if (!req.session.userId) {
//        req.session.userId = '671a678b17a20187f301c5f0'; // Temporary static user ID for testing
//    }
//    next();
//});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/Ajaxweight', AjaxweightRouter);

app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

app.use((req, res) => {
    console.log(`404 Not Found: ${req.originalUrl}`); // Corrected to use backticks

    res.status(404).send('404 Not Found');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    console.log('404 on:', req.originalUrl);
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;