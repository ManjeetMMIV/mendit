const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
  workerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cost: { type: Number, default: 0 }
});

module.exports = mongoose.model('Transaction', transactionSchema);
