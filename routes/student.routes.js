const express = require("express");
const router = express.Router();

const requireAuth = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");

const Complaint = require('../models/complaint.model');
const Feedback = require('../models/feedback.model');
const autoAssignComplaint = require("../utils/autoAssign");

/**
 * STUDENT DASHBOARD
 */
router.get("/dashboard", requireAuth, requireRole("student"), (req, res) => {
  res.render("student/dashboard");
});

/**
 * SHOW NEW COMPLAINT FORM
 */
router.get(
  "/complaints/new",
  requireAuth,
  requireRole("student"),
  (req, res) => {
    res.render("student/new-complaint");
  }
);

/**
 * CREATE NEW COMPLAINT + AUTO ASSIGN
 */
router.post("/complaints/new", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const complaint = await Complaint.create({
      studentId: req.session.user.id,
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      department: req.body.department,
      status: "Pending"
    });

    // IMPORTANT: pass ObjectId/string
    await autoAssignComplaint(complaint._id);

    res.redirect("/student/complaints");
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Could not create complaint' });
  }
});


/**
 * LIST ALL COMPLAINTS OF LOGGED-IN STUDENT
 */
router.get(
  "/complaints",
  requireAuth,
  requireRole("student"),
  async (req, res) => {
    try {
      let myComplaints = await Complaint.find({ studentId: req.session.user.id }).lean();
      myComplaints = myComplaints.map(c => ({ ...c, id: c._id.toString() }));
      res.render("student/complaints", { complaints: myComplaints });
    } catch (err) {
      console.error(err);
      res.render('error', { message: 'Could not fetch complaints' });
    }
  }
);

/**
 * SHOW FEEDBACK FORM (ONLY IF COMPLETED)
 */
router.get(
  "/complaints/:id/feedback",
  requireAuth,
  requireRole("student"),
  async (req, res) => {
    try {
      const complaint = await Complaint.findById(req.params.id).lean();

      if (!complaint) {
        return res.render("error", { message: "Complaint not found" });
      }

      if (complaint.status !== "Completed") {
        return res.render("error", {
          message: "Feedback allowed only after completion"
        });
      }

      res.render("student/feedback", { complaint });
    } catch (err) {
      console.error(err);
      res.render('error', { message: 'Could not fetch complaint' });
    }
  }
);

/**
 * SUBMIT FEEDBACK & CLOSE COMPLAINT
 */
router.post(
  "/complaints/:id/feedback",
  requireAuth,
  requireRole("student"),
  async (req, res) => {
    try {
      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return res.render("error", { message: "Complaint not found" });
      }

      await Feedback.create({
        complaintId: complaint._id,
        rating: Number(req.body.rating),
        comment: req.body.comment
      });

      complaint.status = "Closed";
      await complaint.save();

      res.redirect("/student/complaints");
    } catch (err) {
      console.error(err);
      res.render('error', { message: 'Could not submit feedback' });
    }
  }
);

module.exports = router;
