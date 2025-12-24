const express = require("express");
const router = express.Router();
const User = require('../models/user.model');
const { hashPassword, comparePassword } = require("../utils/password.helper");

// Role selection
router.get("/", (req, res) => {
  res.render("auth/role-select");
});

// Login pages
router.get("/login/:role", (req, res) => {
  res.render(`auth/${req.params.role}-login`);
});

// Signup pages
router.get("/signup/:role", (req, res) => {
  res.render(`auth/${req.params.role}-signup`);
});

// Signup handler
router.post("/signup/:role", async (req, res) => {
  try {
    const role = req.params.role;
    const payload = {
      name: req.body.name,
      email: req.body.email,
      password: hashPassword(req.body.password),
      role: role === 'student' ? 'student' : role === 'worker' ? 'worker' : 'admin'
    };

    if (payload.role === 'worker') payload.department = req.body.department;

    await User.create(payload);
    res.redirect(`/login/${role}`);
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Signup failed' });
  }
});

// Login handler
router.post("/login/:role", async (req, res) => {
  try {
    const role = req.params.role;
    const { email, password } = req.body;

    const user = await User.findOne({ email, role });

    if (!user || !comparePassword(password, user.password)) {
      return res.render("error", { message: "Invalid credentials" });
    }

    req.session.user = { id: user.id, role };
    res.redirect(`/${role}/dashboard`);
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Login failed' });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
