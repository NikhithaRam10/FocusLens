const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const { isInstructor } = require("../middleware/role");

router.get(
  "/dashboard",
  auth,
  isInstructor,
  (req, res) => {
    res.json({
      message: "Welcome Instructor",
      user: req.user,
    });
  }
);

module.exports = router;