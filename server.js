const express = require("express");
const app = express();
const db = require("./db");
require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// View engine and static files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Security middleware
app.use((req, res, next) => {
    res.locals.user = null; // Will be set by auth middleware
    res.locals.error = null;
    res.locals.success = null;
    next();
});

// Routes
const userRoutes = require("./routes/userRoutes");
const boothRoutes = require("./routes/boothRoutes");

// Mount routes
app.use("/user", userRoutes);
app.use("/booth", boothRoutes);

// Home page
app.get("/", (req, res) => {
    const isLoggedIn = req.cookies && req.cookies.token;
    res.render("index", { isLoggedIn });
});

// Logout route
app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

// 404 handler
app.use((req, res) => {
    res.status(404).render("error", { 
        error: "Page not found" 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("error", { 
        error: "Something went wrong!" 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});