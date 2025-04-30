const express = require('express');
const router = express.Router();
const { getReviewsByTutor, createReview, updateReview } = require('../controllers/reviewController');

router.get('/:tutorId', getReviewsByTutor);
router.post('/', createReview);
router.put('/', updateReview);

module.exports = router;    