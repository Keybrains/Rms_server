const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const recurringChargeSchema = new Schema({
  recuring_amount: { type: Number },
  recuring_account: { type: String },
  recuringnextDue_date: { type: String },
  recuringmemo: { type: String },
  recuringfrequency: { type: String },
});

const oneTimeChargeSchema = new Schema({
  onetime_amount: { type: Number },
  onetime_account: { type: String },
  onetime_Due_date: { type: String },
  onetime_memo: { type: String },
});

const carddetailSchema = new Schema({
  card_number: { type: String },
  exp_date: { type: String },
});

const entrySchema = new Schema({
  updateAt: { type: String },
  createdAt: { type: String },
  entryIndex: { type: String },
  rental_adress: { type: String },
  lease_type: { type: String },
  start_date: { type: String },
  end_date: { type: String },
  leasing_agent: { type: String },
  rent_cycle: { type: String },
  amount: { type: Number },
  account: { type: String },
  nextDue_date: { type: String },
  memo: { type: String },
  upload_file: { type: Array },
  isrenton: { type: Boolean, default: false },
  rent_paid: { type: Boolean, default: false },
  propertyOnRent: { type: Boolean, default: false },
  rental_units: { type: String },
  rentalOwner_firstName: { type: String },
  rentalOwner_lastName: { type: String },
  rentalOwner_homeNumber: { type: Number },
  rental_adress: { type: String },
  rentalOwner_phoneNumber: { type: Number },
  rentalOwner_primaryEmail: { type: String },
  rentalOwner_businessNumber: { type: Number },
  rentalOwner_companyName: { type: String },
  unit_id: { type: String },
  property_id: { type: String },
  //security deposite
  Due_date: { type: String },
  Security_amount: { type: Number },

  // add cosigner
  cosigner_firstName: { type: String },
  cosigner_lastName: { type: String },
  cosigner_mobileNumber: { type: Number },
  cosigner_workNumber: { type: Number },
  cosigner_homeNumber: { type: Number },
  cosigner_faxPhoneNumber: { type: Number },
  cosigner_email: { type: String },
  cosigner_alternateemail: { type: String },
  cosigner_streetAdress: { type: String },
  cosigner_city: { type: String },
  cosigner_state: { type: String },
  cosigner_zip: { type: String },
  cosigner_country: { type: String },
  cosigner_postalcode: { type: String },

  tenant_residentStatus: { type: Boolean },

  // add account
  account_name: { type: String },
  account_type: { type: String },

  //account level (sub account)
  parent_account: { type: String },
  account_number: { type: Number },
  fund_type: { type: String },
  cash_flow: { type: String },
  notes: { type: String },

  recurring_charges: [recurringChargeSchema],
  one_time_charges: [oneTimeChargeSchema],

  moveout_date: { type: String },
  moveout_notice_given_date: { type: String },
  paymentMethod: { type: String },
  subscription_id: { type: String, default: "" },
});

const tenantsSchema = new Schema({
  tenant_id: { type: String },

  //   Add tenants
  tenant_firstName: { type: String },
  tenant_lastName: { type: String },
  tenant_unitNumber: { type: String },
  // tenant_phoneNumber: { type: Number },
  tenant_mobileNumber: { type: Number },
  tenant_workNumber: { type: Number },
  tenant_homeNumber: { type: Number },
  tenant_faxPhoneNumber: { type: Number },
  tenant_email: { type: String },
  tenant_password: { type: String },
  alternate_email: { type: String },

  // personal information
  birth_date: { type: String },
  textpayer_id: { type: String },
  comments: { type: String },

  //Emergency contact
  contact_name: { type: String },
  relationship_tenants: { type: String },
  email: { type: String },
  emergency_PhoneNumber: { type: Number },
  
  //card details
  card_detail: [carddetailSchema],
  entries: [entrySchema],
});

module.exports = mongoose.model("tenant", tenantsSchema);
