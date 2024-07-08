const express = require('express');
const router = express.Router();
const { getNews, getNewsById, createNews } = require('../controllers/newsController');
const authMiddleware = require('../middlewares/authMiddleware');

module.exports = router;

router.post('/', authMiddleware, createNews);
router.get('/', getNews);
router.get('/:id', getNewsById);

module.exports = router;
