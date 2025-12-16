const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");
const { readJSON, writeJSON } = require("../utils/fs.helper");

// Admin dashboard - list all complaints
router.get("/dashboard", requireAuth, requireRole("admin"), (req, res) => {
  const complaints = readJSON("complaints.json");
  res.render("admin/dashboard", { complaints });
});
router.get("/analytics", requireAuth, requireRole("admin"), (req, res) => {
  const users = readJSON("users.json");
  const complaints = readJSON("complaints.json");
  const feedback = readJSON("feedback.json");
  const transactions = readJSON("transactions.json");

  const workerStats = users.workers.map(worker => {
    const handledComplaints = complaints.filter(
      c => c.assignedWorkerId === worker.id
    );

    const ratings = feedback.filter(f =>
      handledComplaints.some(c => c.id === f.complaintId)
    );

    const totalCost = transactions
      .filter(t => t.workerId === worker.id)
      .reduce((sum, t) => sum + t.cost, 0);

    const avgRating =
      ratings.length === 0
        ? "N/A"
        : (
            ratings.reduce((s, r) => s + Number(r.rating), 0) /
            ratings.length
          ).toFixed(2);

    return {
      name: worker.name,
      department: worker.department,
      complaints: handledComplaints.length,
      avgRating,
      totalCost
    };
  });

  res.render("admin/analytics", { workerStats });
});

router.get("/analytics/export", requireAuth, requireRole("admin"), (req, res) => {
  const users = readJSON("users.json");
  const complaints = readJSON("complaints.json");
  const feedback = readJSON("feedback.json");
  const transactions = readJSON("transactions.json");

  // Build analytics again (same logic)
  const rows = [];

  rows.push([
    "Worker Name",
    "Department",
    "Complaints Handled",
    "Average Rating",
    "Total Cost"
  ]);

  users.workers.forEach(worker => {
    const handledComplaints = complaints.filter(
      c => c.assignedWorkerId === worker.id
    );

    const ratings = feedback.filter(f =>
      handledComplaints.some(c => c.id === f.complaintId)
    );

    const totalCost = transactions
      .filter(t => t.workerId === worker.id)
      .reduce((sum, t) => sum + t.cost, 0);

    const avgRating =
      ratings.length === 0
        ? "N/A"
        : (
            ratings.reduce((s, r) => s + Number(r.rating), 0) /
            ratings.length
          ).toFixed(2);

    rows.push([
      worker.name,
      worker.department,
      handledComplaints.length,
      avgRating,
      totalCost
    ]);
  });

  // Convert to CSV
  const csv = rows.map(r => r.join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=worker_analytics.csv"
  );

  res.send(csv);
});



// Show assignment page
router.get("/complaints/:id/assign", requireAuth, requireRole("admin"), (req, res) => {
  const complaints = readJSON("complaints.json");
  const users = readJSON("users.json");

  const complaint = complaints.find(c => c.id === req.params.id);
  if (!complaint) {
    return res.render("error", { message: "Complaint not found" });
  }

  res.render("admin/reassign", {
    complaint,
    workers: users.workers
  });
});

// Assign worker
router.post("/complaints/:id/assign", requireAuth, requireRole("admin"), (req, res) => {
  const complaints = readJSON("complaints.json");
  const index = complaints.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.render("error", { message: "Complaint not found" });
  }

  complaints[index].assignedWorkerId = req.body.workerId;
  complaints[index].status = "Assigned";

  writeJSON("complaints.json", complaints);
  res.redirect("/admin/dashboard");
});

module.exports = router;

