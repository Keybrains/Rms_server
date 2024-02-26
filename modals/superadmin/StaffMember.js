const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const staffmemberSchema = new Schema({
  admin_id: { type: String },
  staffmember_id: { type: String },
  staffmember_name: { type: String },
  staffmember_designation: { type: String },
  staffmember_phoneNumber: { type: Number },
  staffmember_email: { type: String },
  staffmember_password: { type: String },
  createdAt: { type: String },
  updatedAt: { type: String },
  is_delete: { type: Boolean, default: false },
});

module.exports = mongoose.model("staffmember", staffmemberSchema);
