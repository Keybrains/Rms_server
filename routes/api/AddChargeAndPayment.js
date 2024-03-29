var express = require("express");
var router = express.Router();
var ObjectId = require("mongodb").ObjectId;
var AddPaymentAndCharge = require("../../modals/AddPaymentAndCharge");
var Surcharge = require("../../modals/Payment/Surcharge");
var PropertyExpense = require("../../modals/PropertyExpense");
const nodemailer = require("nodemailer");
const { createTransport } = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.sparkpostmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "SMTP_Injection",
    pass: "3a634e154f87fb51dfd179b5d5ff6d771bf03240",
  },
  tls: {
    rejectUnauthorized: false
  }
});

router.post("/payment_charge", async (req, res) => {
  try {
    const { properties, unit } = req.body;

    // Check if a record with the provided property_id and rental_adress exists
    const existingRecord = await AddPaymentAndCharge.findOne({
      "properties.property_id": properties.property_id,
      "properties.rental_adress": properties.rental_adress,
    });

    if (!existingRecord) {
      // If the record does not exist, create a new one
      const newData = await AddPaymentAndCharge.create(req.body);
      console.log(newData)
      res.json({
        statusCode: 200,
        data: newData,
        message: "Add payment Successfully",
      });
      if (req.body.unit[0].paymentAndCharges.payment_type !== "Credit Card") {
        const info = await transporter.sendMail({
          from: '"302 Properties" <info@cloudpress.host>',
          to: req.body.unit[0].paymentAndCharges.email_name,
          subject: "Payment Confirmation - 302 Properties",
          html: `     
            <p>Hello ${req.body.unit[0].paymentAndCharges.tenant_firstName} ${req.body.unit[0].paymentAndCharges.tenant_lastName},</p>
      
            <p>Thank you for your payment! We are delighted to confirm that your payment has been successfully processed.</p>
      
            <strong>Transaction Details:</strong>
            <ul>
              <li><strong>Property:</strong> ${req.body.unit[0].paymentAndCharges.rental_adress}</li>
              <li><strong>Amount Paid:</strong> $ ${req.body.unit[0].paymentAndCharges.total_amount}</li>
              <li><strong>Payment Date:</strong> ${req.body.unit[0].paymentAndCharges.date}</li>
            </ul>
      
            <p>If you have any questions or concerns regarding your payment, please feel free to contact our customer support.</p>
      
            <p>Thank you for choosing 302 Properties.</p>
      
            <p>Best regards,<br>The 302 Properties Team</p>
          `,
        });
        }
    
    } else {
      if (unit && unit.length > 0) {
        // Find the existing unit by unit and unit_id
        const existingUnit = existingRecord.unit.find(
          (u) => u.unit === unit[0].unit && u.unit_id === unit[0].unit_id
        );

        if (existingUnit) {
          // If the unit exists, push the new paymentAndCharges data into it
          existingUnit.paymentAndCharges.push(...unit[0].paymentAndCharges);
        } else {
          // If the unit does not exist, create a new unit
          existingRecord.unit.push({
            unit: unit[0].unit,
            unit_id: unit[0].unit_id,
            paymentAndCharges: unit[0].paymentAndCharges,
          });
        }
      } else {
        // If unit information is not present, create a new record without unit
        const newRecord = await AddPaymentAndCharge.create(req.body);
        res.json({
          statusCode: 200,
          data: newRecord,
          message: "Add payment Successfully",
        });
        return; 
      }

      const updatedData = await existingRecord.save();
      console.log("updated data==========",req.body.unit[0].paymentAndCharges) 
      res.json({
        statusCode: 200,
        data: updatedData,
        message: "Update payment Successfully",
      });
      if (req.body.unit[0].paymentAndCharges.payment_type !== "Credit Card") {
        const info = await transporter.sendMail({
          from: '"302 Properties" <info@cloudpress.host>',
          to: req.body.unit[0].paymentAndCharges.email_name,
          subject: "Payment Confirmation - 302 Properties",
          html: `     
            <p>Hello ${req.body.unit[0].paymentAndCharges.tenant_firstName} ${req.body.unit[0].paymentAndCharges.tenant_lastName},</p>
      
            <p>Thank you for your payment! We are delighted to confirm that your payment has been successfully processed.</p>
      
            <strong>Transaction Details:</strong>
            <ul>
              <li><strong>Property:</strong> ${req.body.unit[0].paymentAndCharges.rental_adress}</li>
              <li><strong>Amount Paid:</strong> $ ${req.body.unit[0].paymentAndCharges.total_amount}</li>
              <li><strong>Payment Date:</strong> ${req.body.unit[0].paymentAndCharges.date}</li>
            </ul>
      
            <p>If you have any questions or concerns regarding your payment, please feel free to contact our customer support.</p>
      
            <p>Thank you for choosing 302 Properties.</p>
      
            <p>Best regards,<br>The 302 Properties Team</p>
          `,
        });
        }
    }
  } catch (error) {
    res.json({
      statusCode: 500,
      message: error.message,
    });
  }
});

router.get("/get_entry/:entryId", async (req, res) => {
  try {
    const { entryId } = req.params;

    // Find the entry based on the unit paymentAndCharges _id
    const entry = await AddPaymentAndCharge.findOne({
      "unit.paymentAndCharges._id": new ObjectId(entryId),
    });


    if (!entry) {
      return res.status(404).json({
        statusCode: 404,
        message: "Entry not found",
      });
    }

    // Find the unit that contains the matching paymentAndCharges _id
    const matchingUnit = entry.unit.find(unit => unit.paymentAndCharges.some(payment => payment._id.equals(new ObjectId(entryId))));

    // Retrieve only the matching paymentAndCharges array
    const matchingPaymentAndCharges = matchingUnit ? matchingUnit.paymentAndCharges.find(payment => payment._id.equals(new ObjectId(entryId))) : [];

    res.json({
      statusCode: 200,
      data: matchingPaymentAndCharges,
      message: "Payment and charges fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: error.message,
    });
  }
});

router.get("/financial", async (req, res) => {
  try {
    const { rental_adress, property_id,  tenant_id } = req.query;

    const surCharge = await Surcharge.findOne({}, "surcharge_percent");
    const surcharge_percent = surCharge.get("surcharge_percent");

    const data = await AddPaymentAndCharge.aggregate([
      {
        $match: {
          "properties.rental_adress": rental_adress,
          "properties.property_id": property_id,
        },
      },
      {
        $unwind: "$unit",
      },
      // {
      //   $match: {
      //     "unit.unit": unit,
      //   },
      // },
      {
        $addFields: {
          "unit.paymentAndCharges": {
            $filter: {
              input: "$unit.paymentAndCharges",
              as: "charge",
              cond: {
                $eq: ["$$charge.tenant_id", tenant_id],
              },
            },
          },
        },
      },
      {
        $match: {
          "unit.paymentAndCharges": { $ne: [] },
        },
      },
      {
        $addFields: {
          "unit.paymentAndCharges": {
            $map: {
              input: "$unit.paymentAndCharges",
              as: "charge",
              in: {
                $mergeObjects: [
                  "$$charge",
                  {
                    Total: 0, 
                    total_surcharge: { $sum: ["$$charge.amount", { $multiply: ["$$charge.amount", surcharge_percent / 100] }] }
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          "unit.paymentAndCharges": {
            $map: {
              input: "$unit.paymentAndCharges",
              as: "charge",
              in: {
                $mergeObjects: [
                  "$$charge",
                  {
                    Balance: {
                      $cond: {
                        // if: { $eq: ["$$charge.payment_type", "Credit Card"] },
                        if: {
                          $and: [
                            { $eq: ["$$charge.payment_type", "Credit Card"] },
                            { $eq: ["$$charge.status", "Success"] }
                          ]
                        },
                        then: "$$charge.total_surcharge",
                        else: "$$charge.amount"
                      }
                    }
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          "unit.paymentAndCharges": {
            $map: {
              input: "$unit.paymentAndCharges",
              as: "charge",
              in: {
                $mergeObjects: [
                  "$$charge",
                  {
                    Balance: {
                      $switch: {
                        branches: [
                          {
                            case: { $eq: ["$$charge.type", "Payment"] },
                            then: { $multiply: ["$$charge.Balance", -1] },
                          },
                          {
                            case: { $eq: ["$$charge.type", "Charge"] },
                            then: "$$charge.Balance",
                          },
                          {
                            case: { $eq: ["$$charge.type", "Refund"] },
                            then: "$$charge.Balance",
                          },
                        ],
                        default: 0,
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          "unit.paymentAndCharges": {
            $map: {
              input: "$unit.paymentAndCharges",
              as: "charge",
              in: {
                $mergeObjects: [
                  "$$charge",
                  {
                    Total: {
                      $add: ["$$charge.Total", "$$charge.Balance"], // Update Total with Balance
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          properties: { $first: "$properties" },
          unit: { $push: "$unit" },
        },
      },
    ]);

    const sortedData = data.map((item) => ({
      ...item,
      unit: item.unit.map((unitItem) => ({
        ...unitItem,
        paymentAndCharges: unitItem.paymentAndCharges.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        ),
      })),
    }));

    // Iterate through the sortedData and set the last RunningTotal to 0
    sortedData.forEach((item) => {
      item.unit.forEach((unitItem) => {
        let runningTotal = 0;

        unitItem.paymentAndCharges.reverse().forEach((charge) => {
          charge.RunningTotal = runningTotal;
          charge.Total = runningTotal + charge.Balance;
          runningTotal = charge.Total;
        });

        // Reverse the paymentAndCharges array back to its original order
        unitItem.paymentAndCharges.reverse();
      });
    });

    res.json({
      statusCode: 200,
      data: sortedData,
      message: "Read Filtered PaymentAndCharge",
    });
  } catch (error) {
    res.json({
      statusCode: 500,
      message: error.message,
    });
  }
});

router.get("/financial_unit", async (req, res) => {
  try {
    const { rental_adress, property_id, unit, tenant_id } = req.query;

    const surCharge = await Surcharge.findOne({}, "surcharge_percent");
    const surcharge_percent = surCharge.get("surcharge_percent");

    const data = await AddPaymentAndCharge.aggregate([
      {
        $match: {
          "properties.rental_adress": rental_adress,
          "properties.property_id": property_id,
        },
      },
      {
        $unwind: "$unit",
      },
      {
        $match: {
          "unit.unit": unit,
        },
      },
      {
        $addFields: {
          "unit.paymentAndCharges": {
            $filter: {
              input: "$unit.paymentAndCharges",
              as: "charge",
              cond: {
                $eq: ["$$charge.tenant_id", tenant_id],
              },
            },
          },
        },
      },
      {
        $match: {
          "unit.paymentAndCharges": { $ne: [] },
        },
      },
      {
        $addFields: {
          "unit.paymentAndCharges": {
            $map: {
              input: "$unit.paymentAndCharges",
              as: "charge",
              in: {
                $mergeObjects: [
                  "$$charge",
                  {
                    Total: 0, 
                    total_surcharge: { $sum: ["$$charge.amount", { $multiply: ["$$charge.amount", surcharge_percent / 100] }] }
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          "unit.paymentAndCharges": {
            $map: {
              input: "$unit.paymentAndCharges",
              as: "charge",
              in: {
                $mergeObjects: [
                  "$$charge",
                  {
                    Balance: {
                      $cond: {
                        // if: { $eq: ["$$charge.payment_type", "Credit Card"] },
                        if: {
                          $and: [
                            { $eq: ["$$charge.payment_type", "Credit Card"] },
                            { $eq: ["$$charge.status", "Success"] }
                          ]
                        },
                        then: "$$charge.total_surcharge",
                        else: "$$charge.amount"
                      }
                    }
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          "unit.paymentAndCharges": {
            $map: {
              input: "$unit.paymentAndCharges",
              as: "charge",
              in: {
                $mergeObjects: [
                  "$$charge",
                  {
                    Balance: {
                      $switch: {
                        branches: [
                          {
                            case: { $eq: ["$$charge.type", "Payment"] },
                            then: { $multiply: ["$$charge.Balance", -1] },
                          },
                          {
                            case: { $eq: ["$$charge.type", "Charge"] },
                            then: "$$charge.Balance",
                          },
                          {
                            case: { $eq: ["$$charge.type", "Refund"] },
                            then: "$$charge.Balance",
                          },
                        ],
                        default: 0,
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          "unit.paymentAndCharges": {
            $map: {
              input: "$unit.paymentAndCharges",
              as: "charge",
              in: {
                $mergeObjects: [
                  "$$charge",
                  {
                    Total: {
                      $add: ["$$charge.Total", "$$charge.Balance"], // Update Total with Balance
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          properties: { $first: "$properties" },
          unit: { $push: "$unit" },
        },
      },
    ]);

    const sortedData = data.map((item) => ({
      ...item,
      unit: item.unit.map((unitItem) => ({
        ...unitItem,
        paymentAndCharges: unitItem.paymentAndCharges.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        ),
      })),
    }));

    // Iterate through the sortedData and set the last RunningTotal to 0
    sortedData.forEach((item) => {
      item.unit.forEach((unitItem) => {
        let runningTotal = 0;

        unitItem.paymentAndCharges.reverse().forEach((charge) => {
          charge.RunningTotal = runningTotal;
          charge.Total = runningTotal + charge.Balance;
          runningTotal = charge.Total;
        });

        // Reverse the paymentAndCharges array back to its original order
        unitItem.paymentAndCharges.reverse();
      });
    });

    res.json({
      statusCode: 200,
      data: sortedData,
      message: "Read Filtered PaymentAndCharge",
    });
  } catch (error) {
    res.json({
      statusCode: 500,
      message: error.message,
    });
  }
});


//delete charge api
router.delete("/delete_entry/:entryId", async (req, res) => {
  try {
    const { entryId } = req.params;

    const updatedEntry = await AddPaymentAndCharge.findOneAndUpdate(
      { "unit.paymentAndCharges._id": new ObjectId(entryId) },
      {
        $pull: {
          "unit.$.paymentAndCharges": { _id: new ObjectId(entryId) }
        }
      },
      { new: true }
    );

    if (!updatedEntry) {
      return res.status(404).json({
        statusCode: 404,
        message: "Entry not found",
      });
    }

    res.json({
      statusCode: 200,
      data: updatedEntry,
      message: "Entry deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: error.message,
    });
  }
});

router.put("/edit_entry/:entryId", async (req, res) => {
  try {
    const { entryId } = req.params;
    const {
      type,
      payment_type,
      account,
      amount,
      total_amount,
      tenant_firstName,
      tenant_lastName,
      memo,
      date,
      month_year,
      rental_adress,
      charges_attachment,
    } = req.body;

    // Build an update object with the fields that need to be modified
    const updateFields = {
      "unit.$[unitElem].paymentAndCharges.$[elem].type": type,
      "unit.$[unitElem].paymentAndCharges.$[elem].payment_type": payment_type,
      "unit.$[unitElem].paymentAndCharges.$[elem].account": account,
      "unit.$[unitElem].paymentAndCharges.$[elem].amount": amount,
      "unit.$[unitElem].paymentAndCharges.$[elem].total_amount": total_amount,
      "unit.$[unitElem].paymentAndCharges.$[elem].tenant_firstName": tenant_firstName,
      "unit.$[unitElem].paymentAndCharges.$[elem].tenant_lastName": tenant_lastName,
      "unit.$[unitElem].paymentAndCharges.$[elem].memo": memo,
      "unit.$[unitElem].paymentAndCharges.$[elem].date": date,
      "unit.$[unitElem].paymentAndCharges.$[elem].month_year": month_year,
      "unit.$[unitElem].paymentAndCharges.$[elem].rental_adress": rental_adress,
      "unit.$[unitElem].paymentAndCharges.$[elem].charges_attachment": charges_attachment,
    };

    const options = {
      arrayFilters: [
        { "unitElem.paymentAndCharges._id": new ObjectId(entryId) },
        { "elem._id": new ObjectId(entryId) },
      ],
      new: true,
    };

    // Find and update the entry
    const updatedEntry = await AddPaymentAndCharge.findOneAndUpdate(
      { "unit.paymentAndCharges._id": new ObjectId(entryId) },
      { $set: updateFields },
      options
    );

    if (!updatedEntry) {
      return res.status(404).json({
        statusCode: 404,
        message: "Entry not found",
      });
    }

    res.json({
      statusCode: 200,
      data: updatedEntry,
      message: "Entry updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: error.message,
    });
  }
});

router.put("/charge_paid", async (req, res) => {
  try {
    const { entry } = req.body;

    const updateOperations = entry.map(({ id, amount }) => ({
      updateOne: {
        filter: {
          "unit.paymentAndCharges._id": new ObjectId(id),
        },
        update: {
          $set: {
            "unit.$[unitElem].paymentAndCharges.$[elem].isPaid": amount == 0? true:false,
            "unit.$[unitElem].paymentAndCharges.$[elem].amount": amount,
          },
        },
        arrayFilters: [
          { "unitElem.paymentAndCharges._id":  new ObjectId(id) },
          { "elem._id": new ObjectId(id) },
        ],
      },
    }));

    const updateResult = await AddPaymentAndCharge.bulkWrite(updateOperations);

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No entries found for the provided entry IDs",
      });
    }

    res.json({
      statusCode: 200,
      data: updateResult,
      message: "Entries updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: error.message,
    });
  }
});

// router.get("/unit_charge", async (req, res) => {
//   try {
//     const { rental_adress, property_id, unit, tenant_id } = req.query;

//     const data = await AddPaymentAndCharge.aggregate([
//       {
//         $match: {
//           "properties.rental_adress": rental_adress,
//           "properties.property_id": property_id,
//         },
//       },
//       {
//         $unwind: "$unit",
//       },
//       {
//         $match: {
//           "unit.paymentAndCharges": {
//             $elemMatch: {

//               "isPaid": false,
//               "tenant_id": tenant_id,
//             },
//           }
//         }
//       },
//       {
//         $unwind: "$unit.paymentAndCharges",
//       },
//       {
//         $match: {
//           "unit.paymentAndCharges.type": "Charge",
//           "unit.paymentAndCharges.isPaid": false,
//           "unit.unit": unit,
//           "unit.paymentAndCharges.tenant_id": tenant_id,
//         },
//       },
//       {
//         $group: {
//           _id: "$_id",
//           properties: { $first: "$properties" },
//           unit: { $push: "$unit" },
//         },
//       },
//       {
//         $project: {
//           "_id": 1,
//           "unit.paymentAndCharges.type": 1,
//           "unit.paymentAndCharges.account": 1,
//           "unit.paymentAndCharges.amount": 1,
//           "unit.paymentAndCharges._id":1,
//         },
//       },
//     ]);

//     res.json({
//       statusCode: 200,
//       data: data,
//       message: "Read Filtered PaymentAndCharge",
//     });
//   } catch (error) {
//     res.json({
//       statusCode: 500,
//       message: error.message,
//     });
//   }
// });

// router.get("/unit_charge", async (req, res) => {
//   try {
//     const { rental_adress, property_id, unit, tenant_id } = req.query;

//     const data = await AddPaymentAndCharge.aggregate([
//       {
//         $match: {
//           "properties.rental_adress": rental_adress,
//           "properties.property_id": property_id,
//         },
//       },
//       {
//         $unwind: "$unit",
//       },
//       {
//         $match: {
//           "unit.paymentAndCharges": {
//             $elemMatch: {
//               "type": "Charge",
//               "isPaid": false,
//               "tenant_id": tenant_id,
//             },
//           }
//         }
//       },
//       {
//         $unwind: "$unit.paymentAndCharges",
//       },
//       {
//         $match: {
//           "unit.paymentAndCharges.type": "Charge",
//           "unit.paymentAndCharges.isPaid": false,
//           "unit.unit": unit,
//           "unit.paymentAndCharges.tenant_id": tenant_id,
//         },
//       },
//       {
//         $group: {
//           _id: "$_id",
//           paymentAndCharges: { $push: "$unit.paymentAndCharges" },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           paymentAndCharges: 1,
//         },
//       },
//     ]);

//     res.json({
//       statusCode: 200,
//       data: data,
//       message: "Read Filtered PaymentAndCharge",
//     });
//   } catch (error) {
//     res.json({
//       statusCode: 500,
//       message: error.message,
//     });
//   }
// });

router.post("/property_expense", async (req, res) => {
  try {
    const { properties, unit } = req.body;

    // Check if a record with the provided property_id and rental_adress exists
    const existingRecord = await PropertyExpense.findOne({
      "properties.property_id": properties.property_id,
      "properties.rental_adress": properties.rental_adress,
    });

    if (!existingRecord) {
      // If the record does not exist, create a new one
      const newData = await PropertyExpense.create(req.body);
      res.json({
        statusCode: 200,
        data: newData,
        message: "Add payment Successfully",
      });
    } else {
      if (unit && unit.length > 0) {
        // Find the existing unit by unit and unit_id
        const existingUnit = existingRecord.unit.find(
          (u) => u.unit === unit[0].unit && u.unit_id === unit[0].unit_id
        );

        if (existingUnit) {
          // If the unit exists, push the new property_expense data into it
          existingUnit.property_expense.push(...unit[0].property_expense);
        } else {
          // If the unit does not exist, create a new unit
          existingRecord.unit.push({
            unit: unit[0].unit,
            unit_id: unit[0].unit_id,
            property_expense: unit[0].property_expense,
          });
        }
      } else {
        // If unit information is not present, create a new record without unit
        const newRecord = await PropertyExpense.create(req.body);
        res.json({
          statusCode: 200,
          data: newRecord,
          message: "Add payment Successfully",
        });
        return; // Return to prevent the code below from executing
      }

      const updatedData = await existingRecord.save();

      res.json({
        statusCode: 200,
        data: updatedData,
        message: "Update payment Successfully",
      });
    }
  } catch (error) {
    res.json({
      statusCode: 500,
      message: error.message,
    });
  }
});

//API for property financial
router.get("/property_financial", async (req, res) => {
  try {
    const { rental_adress, property_id } = req.query;

    const query = {
      "properties.rental_adress": rental_adress,
      "properties.property_id": property_id,
      "unit.paymentAndCharges.type": { $in: ["Payment"] }, 
    };

    Object.keys(query).forEach(
      (key) => query[key] === undefined && delete query[key]
    );

    const data = await AddPaymentAndCharge.find(query);

    const processedData = data.map((item) => ({
      ...item.toObject(),
      unit: item.unit.map((unitItem) => ({
        ...unitItem.toObject(),
        paymentAndCharges: unitItem.paymentAndCharges.map((charge) => ({
          ...charge.toObject(),
          Balance: charge.type === "Charge" ? charge.amount : -charge.amount,
          Total: 0,
        })),
      })),
    }));

    processedData.forEach((item) => {
      item.unit.forEach((unit) => {
        let runningTotal = 0;

        unit.paymentAndCharges.forEach((charge) => {
          if (charge.type === "Payment") {
            charge.RunningTotal = runningTotal;
            charge.Total = runningTotal + charge.Balance;
            runningTotal = charge.Total;
          }
        });
      });
    });

    const sortedData = processedData.map((item) => ({
      ...item,
      unit: item.unit.map((unitItem) => ({
        ...unitItem,
        paymentAndCharges: unitItem.paymentAndCharges
          .filter((charge) => charge.type === "Payment")
          .sort((a, b) => new Date(b.date) - new Date(a.date)),
      })),
    }));

    res.json({
      statusCode: 200,
      data: sortedData,
      message: "Read Filtered PaymentAndCharge",
    });
  } catch (error) {
    res.json({
      statusCode: 500,
      message: error.message,
    });
  }
});

router.get("/property_financial/property_expense", async (req, res) => {
  try {
    const { rental_adress, property_id } = req.query;

    const query = {
      "properties.rental_adress": rental_adress,
      "properties.property_id": property_id,
    };

    Object.keys(query).forEach(
      (key) => query[key] === undefined && delete query[key]
    );

    const data = await PropertyExpense.find(query);

    const processedData = data.map((item) => ({
      ...item.toObject(),
      unit: item.unit.map((unitItem) => ({
        ...unitItem.toObject(),
        property_expense: unitItem.property_expense.map((charge) => ({
          ...charge.toObject(),
          Balance: charge.type === "Charge" ? charge.amount : -charge.amount,
          Total: 0, 
        })),
      })),
    }));

    processedData.forEach((item) => {
      item.unit.forEach((unit) => {
        let runningTotal = 0;

        unit.property_expense.forEach((charge) => {
          charge.RunningTotal = runningTotal;
          charge.Total = runningTotal + charge.Balance;
          runningTotal = charge.Total;
        });
      });
    });

    const sortedData = processedData.map((item) => ({
      ...item,
      unit: item.unit.map((unitItem) => ({
        ...unitItem,
        property_expense: unitItem.property_expense.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        ),
      })),
    }));

    res.json({
      statusCode: 200,
      data: sortedData,
      message: "Read Filtered PaymentAndCharge",
    });
  } catch (error) {
    res.json({
      statusCode: 500,
      message: error.message,
    });
  }
});

module.exports = router;