const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");
const { readJSON, writeJSON } = require("../utils/fs.helper");

// Worker dashboard – list assigned complaints
router.get("/dashboard", requireAuth, requireRole("worker"), (req, res) => {
  const complaints = readJSON("complaints.json");

  const myComplaints = complaints
    .filter(c => c.assignedWorkerId === req.session.user.id)
    .sort((a, b) => {
      if (a.priority === "Emergency" && b.priority !== "Emergency") return -1;
      if (a.priority !== "Emergency" && b.priority === "Emergency") return 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

  res.render("worker/dashboard", { complaints: myComplaints });
});


// View single complaint
router.get("/complaints/:id", requireAuth, requireRole("worker"), (req, res) => {
  const complaints = readJSON("complaints.json");
  const complaint = complaints.find(c => c.id === req.params.id);

  if (!complaint) {
    return res.render("error", { message: "Complaint not found" });
  }

  res.render("worker/complaint-detail", { complaint });
});

// Update complaint status
router.post("/complaints/:id/update", requireAuth, requireRole("worker"), (req, res) => {
  const complaints = readJSON("complaints.json");
  const transactions = readJSON("transactions.json");

  const index = complaints.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.render("error", { message: "Complaint not found" });
  }

  complaints[index].status = req.body.status;

  if (req.body.cost && Number(req.body.cost) > 0) {
    transactions.push({
      complaintId: req.params.id,
      workerId: req.session.user.id,
      cost: Number(req.body.cost)
    });
    writeJSON("transactions.json", transactions);
  }

  writeJSON("complaints.json", complaints);
  res.redirect("/worker/dashboard");
});



module.exports = router;
