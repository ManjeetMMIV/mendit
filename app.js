const express = require("express");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/student.routes");
const workerRoutes = require("./routes/worker.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "mendit-secret",
    resave: false,
    saveUninitialized: false
  })
);

// Routes
app.use("/", authRoutes);
app.use("/student", studentRoutes);
app.use("/worker", workerRoutes);
app.use("/admin", adminRoutes);

// Fallback
app.use((req, res) => {
  res.status(404).render("error", { message: "Page not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
