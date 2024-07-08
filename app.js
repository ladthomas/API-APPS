const express = require("express");
const { connectDB } = require("./config/db");
const { initModels } = require("./models");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const newsRoutes = require("./routes/newsRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const contactRoutes = require("./routes/contactRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
require('dotenv').config();
const cors = require("cors");

const app = express();

// Connect to database
connectDB();
initModels();

// Define allowed origins
const allowedOrigins = [
  "capacitor://localhost:5173",
  "ionic://localhost:5173",
  "http://localhost:5173",
  "http://localhost:8100",
];

// CORS options
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed by CORS"));
    }
  },
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Enable preflight requests for all routes
app.options("*", cors(corsOptions));

// Swagger API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/subscription", subscriptionRoutes);

module.exports = app;
