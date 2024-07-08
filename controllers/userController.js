const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { User } = require("../models");
const transporter = require("../config/mailer");

exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ["password"] },
    });
    console.log("====",user)
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { name, email, password } = req.body;
  console.log("req.body",req.body)
  try {
    const user = await User.findByPk(req.userId);
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: "User updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.destroy({ where: { id: req.userId } });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await transporter.sendMail({
      from: "no-reply@example.com",
      to: user.email,
      subject: "Password Reset",
      text: `Your new password is: ${newPassword}`,
    });

    res.json({ message: "New password sent to your email" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
