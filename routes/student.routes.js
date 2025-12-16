const express = require("express");
const router = express.Router();

const requireAuth = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");

const { readJSON, writeJSON } = require("../utils/fs.helper");
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
router.post("/complaints/new", requireAuth, requireRole("student"), (req, res) => {
  const complaints = readJSON("complaints.json");

  const complaint = {
    id: Date.now().toString(),
    studentId: req.session.user.id,
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority,
    department: req.body.department,
    status: "Pending",
    assignedWorkerId: null,
    createdAt: new Date().toISOString()
  };

  complaints.push(complaint);
  writeJSON("complaints.json", complaints);

  // IMPORTANT: pass ID, not object
  autoAssignComplaint(complaint.id);

  res.redirect("/student/complaints");
});


/**
 * LIST ALL COMPLAINTS OF LOGGED-IN STUDENT
 */
router.get(
  "/complaints",
  requireAuth,
  requireRole("student"),
  (req, res) => {
    const complaints = readJSON("complaints.json");

    const myComplaints = complaints.filter(
      c => c.studentId === req.session.user.id
    );

    res.render("student/complaints", { complaints: myComplaints });
  }
);

/**
 * SHOW FEEDBACK FORM (ONLY IF COMPLETED)
 */
router.get(
  "/complaints/:id/feedback",
  requireAuth,
  requireRole("student"),
  (req, res) => {
    const complaints = readJSON("complaints.json");
    const complaint = complaints.find(c => c.id === req.params.id);

    if (!complaint) {
      return res.render("error", { message: "Complaint not found" });
    }

    if (complaint.status !== "Completed") {
      return res.render("error", {
        message: "Feedback allowed only after completion"
      });
    }

    res.render("student/feedback", { complaint });
  }
);

/**
 * SUBMIT FEEDBACK & CLOSE COMPLAINT
 */
router.post(
  "/complaints/:id/feedback",
  requireAuth,
  requireRole("student"),
  (req, res) => {
    const complaints = readJSON("complaints.json");
    const feedback = readJSON("feedback.json");

    const index = complaints.findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.render("error", { message: "Complaint not found" });
    }

    // store feedback
    feedback.push({
      complaintId: req.params.id,
      rating: req.body.rating,
      comment: req.body.comment
    });

    // close complaint
    complaints[index].status = "Closed";

    writeJSON("feedback.json", feedback);
    writeJSON("complaints.json", complaints);

    res.redirect("/student/complaints");
  }
);

module.exports = router;
