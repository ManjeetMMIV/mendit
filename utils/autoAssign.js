const User = require('../models/user.model');
const Complaint = require('../models/complaint.model');

async function autoAssignComplaint(complaintId) {
  // complaintId can be ObjectId string or legacy id; so we assume ObjectId
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) return false;

  const department = complaint.department;
  if (!department) return false;

  const availableWorkers = await User.find({ role: 'worker', department }).limit(1);
  if (!availableWorkers || availableWorkers.length === 0) return false;

  complaint.assignedWorkerId = availableWorkers[0]._id;
  complaint.status = 'Assigned';
  await complaint.save();

  return true;
}

module.exports = autoAssignComplaint;
