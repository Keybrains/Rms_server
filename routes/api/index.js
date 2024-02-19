var express = require("express");
var router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const Admin_Register = require("../../modals/superadmin/Admin_Register");
const { hashCompare } = require("../../authentication");
const bcrypt = require("bcrypt");

const crypto = require("crypto");

const decrypt = (text) => {
  // Make sure to require the crypto module
  const decipher = crypto.createDecipher("aes-256-cbc", "mansi");
  let decrypted = decipher.update(text, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
};

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/test/:admin_id", async (req, res) => {
  try {
    const admin_id = req.params.admin_id;

    // Fetch the admin record from your database based on adminId
    const adminRecord = await Admin_Register.findOne({ admin_id: admin_id });

    if (!adminRecord) {
      return res.status(404).send("Admin record not found.");
    }

    // Hash the password retrieved from the database
    // const hashedPassword = await hashPassword(adminRecord.password);
    const pass = decrypt(adminRecord.password);
    adminRecord.password = pass;

    // Launch a headful browser
    // const browser = await puppeteer.launch({ headless: false });
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ["--start-maximized"],
    });

    // Open a new page
    const page = await browser.newPage();

    const pages = await browser.pages();
    if (pages.length > 1) {
      await pages[0].close();
    }

    // Navigate to the login page
    await page.goto("http://localhost:3000/auth/login");

    // Wait for the login form to appear
    await page.waitForSelector('input[name="email"]');

    // Fill in email and password fields with admin's email and hashed password
    await page.type('input[name="email"]', adminRecord.email);
    await delay(2000);
    await page.type('input[name="password"]', pass); // Use hashed password here
    await delay(2000);

    // Click on the login button
    await page.click('button[type="submit"]');
    await delay(2000);

    // Wait for the login process to complete
    await page.waitForNavigation();
    await delay(2000);

    // Maximize the tab by pressing keyboard shortcut
    await page.keyboard.down("Control");
    await page.keyboard.down("Shift");
    await page.keyboard.press("F");

    res.send("Login successful.");
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send("An error occurred while logging in.");
  }
});

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const fs = require('fs');

// // Create a storage engine for multer
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Set the destination directory for uploaded files
//     const dir = 'Uploadfile/';
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir);
//     }
//     cb(null, dir);
//   },
//   filename: function (req, file, cb) {
//     // Set the file name for uploaded files
//     cb(null, file.originalname);
//   },
// });

// // Create an instance of multer with the storage engine
// const upload = multer({ storage: storage });

// /* GET home page. */
// router.get('/', function (req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// // Handle file upload
// router.post('/uploadfile', upload.single('file'), function (req, res, next) {
//   // The 'file' in `upload.single('file')` should match the name attribute of your file input in the form.

//   if (req.file) {
//     console.log(`File ${req.file.originalname} uploaded successfully`);
//     res.send('File uploaded successfully'); // Send a simple success message
//   } else {
//     res.status(400).send('File upload failed');
//   }
// });

// module.exports = router;
