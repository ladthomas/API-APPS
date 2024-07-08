const ContactSubmission = require('../models/ContactSubmission');

exports.submitContactForm = async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const submission = await ContactSubmission.create({ name, email, message });
    res.status(201).json({ message: 'Submission received' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getContactSubmissions = async (req, res) => {
  try {
    const submissions = await ContactSubmission.findAll();
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
