const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");

const User = require('../models/user.model');
const Complaint = require('../models/complaint.model');
const Feedback = require('../models/feedback.model');
const Transaction = require('../models/transaction.model');

// Admin dashboard - list all complaints
router.get("/dashboard", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    let complaints = await Complaint.find().lean();
    complaints = complaints.map(c => ({ ...c, id: c._id.toString() }));
    res.render("admin/dashboard", { complaints });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Could not fetch complaints' });
  }
});

router.get("/analytics", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' }).lean();

    const workerStats = await Promise.all(workers.map(async worker => {
      const handledComplaints = await Complaint.find({ assignedWorkerId: worker._id });

      const ratingsDocs = await Feedback.find({ complaintId: { $in: handledComplaints.map(c => c._id) } });

      const transactions = await Transaction.find({ workerId: worker._id });

      const totalCost = transactions.reduce((sum, t) => sum + (t.cost || 0), 0);

      const avgRating = ratingsDocs.length === 0 ? 'N/A' : (ratingsDocs.reduce((s, r) => s + Number(r.rating), 0) / ratingsDocs.length).toFixed(2);

      return {
        name: worker.name,
        department: worker.department,
        complaints: handledComplaints.length,
        avgRating,
        totalCost
      };
    }));

    res.render("admin/analytics", { workerStats });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Could not build analytics' });
  }
});

router.get("/analytics/export", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' }).lean();

    const rows = [];

    rows.push([
      "Worker Name",
      "Department",
      "Complaints Handled",
      "Average Rating",
      "Total Cost"
    ]);

    for (const worker of workers) {
      const handledComplaints = await Complaint.find({ assignedWorkerId: worker._id });
      const ratingsDocs = await Feedback.find({ complaintId: { $in: handledComplaints.map(c => c._id) } });
      const transactions = await Transaction.find({ workerId: worker._id });

      const totalCost = transactions.reduce((sum, t) => sum + (t.cost || 0), 0);
      const avgRating = ratingsDocs.length === 0 ? 'N/A' : (ratingsDocs.reduce((s, r) => s + Number(r.rating), 0) / ratingsDocs.length).toFixed(2);

      rows.push([
        worker.name,
        worker.department,
        handledComplaints.length,
        avgRating,
        totalCost
      ]);
    }

    // Convert to CSV
    const csv = rows.map(r => r.join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=worker_analytics.csv"
    );

    res.send(csv);
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Could not export analytics' });
  }
});


// Show assignment page
router.get("/complaints/:id/assign", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).lean();
    if (!complaint) {
      return res.render("error", { message: "Complaint not found" });
    }

    let workers = await User.find({ role: 'worker' }).lean();
    // ensure `id` string exists for templates
    workers = workers.map(w => ({ ...w, id: w._id.toString() }));

    res.render("admin/reassign", {
      complaint,
      workers
    });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Could not load assignment page' });
  }
});

// Assign worker
router.post("/complaints/:id/assign", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.render("error", { message: "Complaint not found" });
    }

    complaint.assignedWorkerId = req.body.workerId;
    complaint.status = "Assigned";

    await complaint.save();
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Could not assign worker' });
  }
});

module.exports = router;

