var express = require("express");
var router = express.Router();
var Unit = require("../../../modals/superadmin/Unit");
var Admin_Register = require("../../../modals/superadmin/Admin_Register");
const moment = require("moment");

// ===================  Super Admin============================

router.get("/unit/:admin_id", async (req, res) => {
  try {
    const admin_id = req.params.admin_id;

    var data = await Unit.aggregate([
      {
        $match: { admin_id: admin_id }, 
      },
      {
        $sort: { createdAt: -1 }, 
      },
    ]);

    for (let i = 0; i < data.length; i++) {
      const admin_id = data[i].admin_id;

      const admin_data = await Admin_Register.findOne(
        { admin_id: admin_id },
        "admin_id first_name last_name"
      );

      data[i].admin_data = admin_data;
    }

    const count = data.length;

    res.json({
      statusCode: 200,
      data: data,
      count: count,
      message: "Read All Request",
    });
  } catch (error) {
    res.json({
      statusCode: 500,
      message: error.message,
    });
  }
});

router.post("/search", async (req, res) => {
  try {
    const searchValue = req.body.search;
    const adminId = req.body.admin_id;

    let query = {
      admin_id: adminId,
    };

    if (searchValue) {
      query.$or = [
        { rental_unit: { $regex: new RegExp(searchValue, "i") } },
        { rental_unit_adress: { $regex: new RegExp(searchValue, "i") } },
      ];
    }

    const data = await Unit.find(query);

    const promises = data.map((unit_data) => {
      return Unit.findOne({ admin_id: unit_data.admin_id });
    });

    const adminDataArray = await Promise.all(promises);

    const updatedData = data.map((unit_data, index) => {
      return {
        ...unit_data._doc,
        admin_data: adminDataArray[index],
      };
    });

    const dataCount = updatedData.length;

    res.json({
      statusCode: 200,
      data: updatedData,
      count: dataCount,
      message: "Search successful",
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: error.message,
    });
  }
});

// ====================  Admin  ==================================

router.get("/rental_unit/:rental_id", async (req, res) => {
  try {
    const rental_id = req.params.rental_id;

    var data = await Unit.aggregate([
      {
        $match: { rental_id: rental_id },
      },
    ]);

    res.json({
      statusCode: 200,
      data: data,
      message: "Read All Rentals",
    });
  } catch (error) {
    res.json({
      statusCode: 500,
      message: error.message,
    });
  }
});

router.put("/unit/:unit_id", async (req, res) => {
  try {
    const { unit_id } = req.params;

    // Ensure that updatedAt field is set
    req.body.updatedAt = moment().format("YYYY-MM-DD HH:mm:ss");

    const result = await Unit.findOneAndUpdate(
      { unit_id: unit_id },
      { $set: req.body },
      { new: true }
    );

    if (result) {
      res.json({
        statusCode: 200,
        data: result,
        message: "Unit Updated Successfully",
      });
    } else {
      res.status(404).json({
        statusCode: 404,
        message: "Unit not found",
      });
    }
  } catch (err) {
    res.status(500).json({
      statusCode: 500,
      message: err.message,
    });
  }
});

router.post("/unit", async (req, res) => {
  try {
    let findUnitName = await Unit.findOne({
      rental_id: req.body.rental_id,
      rental_unit: req.body.rental_unit,
    });
    if (!findUnitName) {
      const timestamp = Date.now();
      const uniqueId = `${timestamp}`;
      req.body["unit_id"] = uniqueId;
      req.body["createdAt"] = moment().format("YYYY-MM-DD HH:mm:ss");
      req.body["updatedAt"] = moment().format("YYYY-MM-DD HH:mm:ss");
      var data = await Unit.create(req.body);
      res.json({
        statusCode: 200,
        data: data,
        message: "Add Umit Successfully",
      });
    } else {
      res.json({
        statusCode: 500,
        message: `${req.body.rental_unit} Name Already Added`,
      });
    }
  } catch (error) {
    res.json({
      statusCode: 500,
      message: error.message,
    });
  }
});

module.exports = router;