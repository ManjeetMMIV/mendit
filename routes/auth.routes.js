const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../utils/fs.helper");
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
router.post("/signup/:role", (req, res) => {
  const role = req.params.role;
  const users = readJSON("users.json");

  const user = {
    id: Date.now().toString(),
    ...req.body,
    password: hashPassword(req.body.password)
  };

  users[`${role}s`].push(user);
  writeJSON("users.json", users);

  res.redirect(`/login/${role}`);
});

// Login handler
router.post("/login/:role", (req, res) => {
  const role = req.params.role;
  const { email, password } = req.body;

  const users = readJSON("users.json")[`${role}s`];
  const user = users.find(u => u.email === email);

  if (!user || !comparePassword(password, user.password)) {
    return res.render("error", { message: "Invalid credentials" });
  }

  req.session.user = { id: user.id, role };
  res.redirect(`/${role}/dashboard`);
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
