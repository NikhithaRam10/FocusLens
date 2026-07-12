const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const { isStudent } = require("../middleware/role");

router.get(
  "/dashboard",
  auth,
  isStudent,
  (req, res) => {
    res.json({
      message: "Welcome Student",
      user: req.user,
    });
  }
);

module.exports = router;