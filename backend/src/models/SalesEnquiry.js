const mongoose = require('mongoose');

const salesEnquirySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  designation: { type: String, required: true },
  companyName: { type: String, required: true },
  companyEmail: { type: String, required: true },
  companySize: { type: String, required: true },
  city: { type: String, required: true },
  companyWebsite: { type: String },
  cinOrGst: { type: String },
  linkedin: { type: String },
  note: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  rejectReason: { type: String }
}, { 
  timestamps: true,
  collection: 'salesenquiries'
});

module.exports = mongoose.model('SalesEnquiry', salesEnquirySchema);

