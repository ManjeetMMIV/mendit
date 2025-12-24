const mongoose = require('mongoose');
const { Schema } = mongoose;

const complaintSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ['Normal', 'Emergency'], default: 'Normal' },
  department: { type: String },
  status: { type: String, default: 'Pending' },
  assignedWorkerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

complaintSchema.virtual('id').get(function () {
  return this._id.toString();
});

complaintSchema.set('toJSON', { virtuals: true });
complaintSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Complaint', complaintSchema);
