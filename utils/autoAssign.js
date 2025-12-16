const { readJSON, writeJSON } = require("./fs.helper");

function autoAssignComplaint(complaintId) {
  const users = readJSON("users.json");
  const complaints = readJSON("complaints.json");

  const index = complaints.findIndex(c => c.id === complaintId);
  if (index === -1) return false;

  const complaint = complaints[index];

  const availableWorkers = users.workers.filter(
    w => w.department === complaint.department
  );

  if (availableWorkers.length === 0) {
    return false;
  }

  // Assign first available worker
  complaint.assignedWorkerId = availableWorkers[0].id;
  complaint.status = "Assigned";

  complaints[index] = complaint;
  writeJSON("complaints.json", complaints);

  return true;
}

module.exports = autoAssignComplaint;
