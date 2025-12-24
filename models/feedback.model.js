const mongoose = require('mongoose');
const { Schema } = mongoose;

const feedbackSchema = new Schema({
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
