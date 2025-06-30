const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('./config/passport');
// Route imports
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const guideRoutes = require("./routes/guideRoutes");
const subjectExpertRoutes = require("./routes/subjectExpertRoutes");
const generalRoutes = require("./routes/generalRoutes");
require('./passport/googleStrategy');

// const teacherRoute = require("./routes/teacherRoute");
// const studentRoute = require("./routes/studentRoute");
// const adminRouter = require("./routes/adminRoute");
// const guideRouter = require("./routes/guideRoute");
// const subjectExpertRouter = require("./routes/subjectExpertRouter");
// const uploadRouter = require("./routes/uploadRoute");
// const mentorRoute = require("./routes/mentorRoute");
// const generalRoute = require("./routes/generalRoute");
const path = require("path");

const errorHandler = require('./middleware/errorMiddleware');
const { port, rateLimit: rateLimitConfig } = require('./config/envConfig');
const morgan = require("morgan");

// Initialize Express app
const app = express();
app.use(morgan("dev"));
app.set('trust proxy', 1);

// app.use(
//     cors({
//         origin: process.env.FRONTEND_URL || true, // Reflect the request origin if no FRONTEND_URL set
//         credentials: true, // Allow cookies to be sent
//     })
// );

// Session configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'your_session_secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
    })
);
// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Your frontend URL
    credentials: true,
    exposedHeaders: ['set-cookie']
}));
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies
app.use((req, res, next) => {
    // console.log('Incoming cookies:', req.cookies);
    // console.log('Headers:', req.headers);
    next();
});
// Rate limiting
const limiter = rateLimit({
    windowMs: rateLimitConfig.windowMs,
    max: rateLimitConfig.max,
    message: 'Too many requests from this IP, please try again later',
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/guide', guideRoutes);
app.use('/api/sub_expert', subjectExpertRoutes);
app.use('/api/user', generalRoutes);

// // Mount routes
// app.use("/", authRoute);
// app.use("/", teacherRoute);
// app.use("/", studentRoute);
// app.use("/", adminRouter);
// app.use("/", guideRouter);
// app.use("/", subjectExpertRouter);
// app.use("/", uploadRouter);
// app.use("/", mentorRoute);
// app.use("/", generalRoute);

// Serve static files
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));




// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;
