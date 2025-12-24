const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");

const Complaint = require('../models/complaint.model');
const Transaction = require('../models/transaction.model');

// Worker dashboard – list assigned complaints
router.get("/dashboard", requireAuth, requireRole("worker"), async (req, res) => {
  try {
    const complaints = await Complaint.find({}).lean();

    let myComplaints = complaints
      .filter(c => (c.assignedWorkerId && c.assignedWorkerId.toString()) === req.session.user.id)
      .sort((a, b) => {
        if (a.priority === "Emergency" && b.priority !== "Emergency") return -1;
        if (a.priority !== "Emergency" && b.priority === "Emergency") return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

    myComplaints = myComplaints.map(c => ({ ...c, id: c._id.toString() }));

    res.render("worker/dashboard", { complaints: myComplaints });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Could not fetch assigned complaints' });
  }
});


// View single complaint
router.get("/complaints/:id", requireAuth, requireRole("worker"), async (req, res) => {
  try {
    let complaint = await Complaint.findById(req.params.id).lean();
    if (!complaint) {
      return res.render("error", { message: "Complaint not found" });
    }

    complaint = { ...complaint, id: complaint._id.toString() };

    res.render("worker/complaint-detail", { complaint });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Could not fetch complaint' });
  }
});

// Update complaint status
router.post("/complaints/:id/update", requireAuth, requireRole("worker"), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.render("error", { message: "Complaint not found" });
    }

    complaint.status = req.body.status;

    await complaint.save();

    if (req.body.cost && Number(req.body.cost) > 0) {
      await Transaction.create({
        complaintId: complaint._id,
        workerId: req.session.user.id,
        cost: Number(req.body.cost)
      });
    }

    res.redirect("/worker/dashboard");
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Could not update complaint' });
  }
});


module.exports = router;
