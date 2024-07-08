const { News } = require('../models');

exports.createNews = async (req, res) => {
  const { title, content } = req.body;
  try {
    const news = await News.create({ title, content });
    res.status(201).json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNews = async (req, res) => {
  try {
    const news = await News.findAll();
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNewsById = async (req, res) => {
  const { id } = req.params;
  try {
    const news = await News.findByPk(id);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};