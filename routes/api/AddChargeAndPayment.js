var express = require("express");
var router = express.Router();
var AddPaymentAndCharge = require("../../modals/AddPaymentAndCharge");

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

// // Unit pass and get Data - Sorting and Calculating (All Working ok)

// // without unit pass and get Data - Sorting and Calculating (All Working ok)
// router.get("/financial", async (req, res) => {
//   try {
//     const { rental_adress, property_id, unit, tenant_id } = req.query;

//     // Construct the query object based on the provided parameters
//     const query = {
//       "properties.rental_adress": rental_adress,
//       "properties.property_id": property_id,
//       $or: [
//         { "unit.unit": unit },
//         { unit: { $exists: false } },
//         { unit: { $elemMatch: { unit: unit } } },
//         { unit: { $elemMatch: { unit: "" } } },
//       ],
//       "unit.paymentAndCharges.tenant_id": tenant_id,
//     };

//     // Remove undefined parameters from the query object
//     Object.keys(query).forEach((key) => query[key] === undefined && delete query[key]);

//     // Use the constructed query object to filter the data
//     const data = await AddPaymentAndCharge.find(query, { "unit.$": 1 });

//     // Iterate through the result and calculate "Total" and "Balance" for each element
//     const processedData = data.map((item) => ({
//       ...item.toObject(), // Convert Mongoose document to plain JavaScript object
//       unit: item.unit.map((unitItem) => ({
//         ...unitItem.toObject(),
//         paymentAndCharges: unitItem.paymentAndCharges.map((charge) => ({
//           ...charge.toObject(),
//           Balance: charge.type === "Charge" ? charge.amount : -charge.amount,
//           Total: 0, // Initialize Total to 0
//         })),
//       })),
//     }));

//     const sortedData = processedData.map((item) => ({
//       ...item,
//       unit: item.unit.map((unitItem) => ({
//           ...unitItem,
//           paymentAndCharges: unitItem.paymentAndCharges.sort((a, b) =>
//               new Date(b.date) - new Date(a.date)
//           ),
//       })),
//   }));

//     // Iterate through the result and calculate "Total" and "RunningTotal" for each element
//     sortedData.forEach((item) => {
//       item.unit.forEach((unit) => {
//         let runningTotal = 0;

//         unit.paymentAndCharges.forEach((charge) => {
//           charge.RunningTotal = runningTotal;
//           charge.Total = runningTotal + charge.Balance;
//           runningTotal = charge.Total;
//         });
//       });
//     });

//     res.json({
//       statusCode: 200,
//       data: sortedData,
//       message: "Read Filtered PaymentAndCharge",
//     });
//   } catch (error) {
//     res.json({
//       statusCode: 500,
//       message: error.message,
//     });
//   }
// });

router.get("/financial", async (req, res) => {
  try {
    const { rental_adress, property_id, unit, tenant_id } = req.query;

    // Construct the query object based on the provided parameters
    const query = {
      "properties.rental_adress": rental_adress,
      "properties.property_id": property_id,
      $or: [
        { "unit.unit": unit },
        { unit: { $exists: false } },
        { unit: { $elemMatch: { unit: unit } } },
        { unit: { $elemMatch: { unit: "" } } },
      ],
      "unit.paymentAndCharges.tenant_id": tenant_id,
    };

    // Remove undefined parameters from the query object
    Object.keys(query).forEach(
      (key) => query[key] === undefined && delete query[key]
    );

    // Use the constructed query object to filter the data
    const data = await AddPaymentAndCharge.find(query, { "unit.$": 1 });

    // Iterate through the result and calculate "Total" and "Balance" for each element
    const processedData = data.map((item) => ({
      ...item.toObject(), // Convert Mongoose document to plain JavaScript object
      unit: item.unit.map((unitItem) => ({
        ...unitItem.toObject(),
        paymentAndCharges: unitItem.paymentAndCharges.map((charge) => ({
          ...charge.toObject(),
          Balance: charge.type === "Charge" ? charge.amount : -charge.amount,
          Total: 0, // Initialize Total to 0
        })),
      })),
    }));

    // Iterate through the result and calculate "Total" and "RunningTotal" for each element
    processedData.forEach((item) => {
      item.unit.forEach((unit) => {
        let runningTotal = 0;

        unit.paymentAndCharges.forEach((charge) => {
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
        paymentAndCharges: unitItem.paymentAndCharges.sort(
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

// Working Proper
// router.get("/xyz", async (req, res) => {
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
//           "unit.unit": unit,
//         },
//       },
//       {
//         $addFields: {
//           "unit.paymentAndCharges": {
//             $filter: {
//               input: "$unit.paymentAndCharges",
//               as: "charge",
//               cond: {
//                 $eq: ["$$charge.tenant_id", tenant_id],
//               },
//             },
//           },
//         },
//       },
//       {
//         $match: {
//           "unit.paymentAndCharges": { $ne: [] },
//         },
//       },
//       {
//         $addFields: {
//           "unit.paymentAndCharges": {
//             $map: {
//               input: "$unit.paymentAndCharges",
//               as: "charge",
//               in: {
//                 $mergeObjects: [
//                   "$$charge",
//                   {
//                     // Index: { $add: ["$$charge.Index", 1] }, // Index starts from 1
//                     Total: 0, // Initialize Total to 0
//                   },
//                 ],
//               },
//             },
//           },
//         },
//       },
//       {
//         $addFields: {
//           "unit.paymentAndCharges": {
//             $map: {
//               input: "$unit.paymentAndCharges",
//               as: "charge",
//               in: {
//                 $mergeObjects: [
//                   "$$charge",
//                   {
//                     Balance: {
//                       $cond: {
//                         if: { $eq: ["$$charge.type", "Charge"] },
//                         then: "$$charge.amount",
//                         else: { $subtract: [0, "$$charge.amount"] }, // for Payment type
//                       },
//                     },
//                   },
//                 ],
//               },
//             },
//           },
//         },
//       },
//       {
//         $addFields: {
//           "unit.paymentAndCharges": {
//             $map: {
//               input: "$unit.paymentAndCharges",
//               as: "charge",
//               in: {
//                 $mergeObjects: [
//                   "$$charge",
//                   {
//                     Total: {
//                       $add: ["$$charge.Total", "$$charge.Balance"], // Update Total with Balance
//                   },
//                 }
//                 ],
//               },
//             },
//           },
//         },
//       },
//       {
//         $group: {
//           _id: "$_id",
//           properties: { $first: "$properties" },
//           unit: { $push: "$unit" },
//         },
//       },
//     ]);

//     // Iterate through the result and calculate "Total" and "RunningTotal" for each element
//     data.forEach((item) => {
//       item.unit.forEach((unit) => {
//         let runningTotal = 0;

//         unit.paymentAndCharges.forEach((charge) => {
//           charge.RunningTotal = runningTotal;
//           charge.Total = runningTotal + charge.Balance;
//           runningTotal = charge.Total;
//         });
//       });
//     });

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

//  Sort
// router.get("/xyz", async (req, res) => {
//     try {
//         const { rental_adress, property_id, unit, tenant_id } = req.query;

//         const data = await AddPaymentAndCharge.aggregate([
//             {
//                 $match: {
//                     "properties.rental_adress": rental_adress,
//                     "properties.property_id": property_id,
//                 },
//             },
//             {
//                 $unwind: "$unit",
//             },
//             {
//                 $match: {
//                     "unit.unit": unit,
//                 },
//             },
//             {
//                 $addFields: {
//                     "unit.paymentAndCharges": {
//                         $filter: {
//                             input: "$unit.paymentAndCharges",
//                             as: "charge",
//                             cond: {
//                                 $eq: ["$$charge.tenant_id", tenant_id],
//                             },
//                         },
//                     },
//                 },
//             },
//             {
//                 $group: {
//                     _id: "$_id",
//                     properties: { $first: "$properties" },
//                     unit: { $push: "$unit" },
//                 },
//             },
//         ]);

//         // Client-side sorting of paymentAndCharges array based on date (new to old)
//         const sortedData = data.map((item) => ({
//             ...item,
//             unit: item.unit.map((unitItem) => ({
//                 ...unitItem,
//                 paymentAndCharges: unitItem.paymentAndCharges.sort((a, b) =>
//                     new Date(b.date) - new Date(a.date)
//                 ),
//             })),
//         }));

//         res.json({
//             statusCode: 200,
//             data: sortedData,
//             message: "Read Filtered PaymentAndCharge",
//         });
//     } catch (error) {
//         res.json({
//             statusCode: 500,
//             message: error.message,
//         });
//     }
// });

router.get("/financial_unit", async (req, res) => {
  try {
    const { rental_adress, property_id, unit, tenant_id } = req.query;
    console.log(req.query, "-------------------------");

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
                    // Index: { $add: ["$$charge.Index", 1] }, // Index starts from 1
                    Total: 0, // Initialize Total to 0
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
                        if: { $eq: ["$$charge.type", "Charge"] },
                        then: "$$charge.amount",
                        else: { $subtract: [0, "$$charge.amount"] }, // for Payment type
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

    // Iterate through the result and calculate "Total" and "RunningTotal" for each element
    data.forEach((item) => {
      item.unit.forEach((unit) => {
        let runningTotal = 0;

        unit.paymentAndCharges.forEach((charge) => {
          charge.RunningTotal = runningTotal;
          charge.Total = runningTotal + charge.Balance;
          runningTotal = charge.Total;
        });
      });
    });

    const sortedData = data.map((item) => ({
      ...item,
      unit: item.unit.map((unitItem) => ({
        ...unitItem,
        paymentAndCharges: unitItem.paymentAndCharges.sort(
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