const express = require("express");
const router = express.Router();
const {
  getUser,
  updateUser,
  deleteUser,
  forgotPassword
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/:userId", authMiddleware, getUser);
router.patch("/update", authMiddleware, updateUser);
router.post("/delete", authMiddleware, deleteUser);
router.post("/forgot-password", forgotPassword);

module.exports = router;
