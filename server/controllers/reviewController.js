const Review = require('../models/Review');

exports.getReviewsByTutor = async (req, res) => {
  try {
    const reviews = await Review.find({ tutorId: req.params.tutorId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Помилка при отриманні відгуків' });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { tutorId, rating, comment, parentName, userId } = req.body;
    const existing = await Review.findOne({ tutorId, userId });
    if (existing) return res.status(400).json({ message: 'Ви вже залишали відгук для цього викладача' });

    const review = new Review({ tutorId, rating, comment, parentName, userId });
    await review.save();
    res.status(201).json({ message: 'Відгук додано', review });
  } catch (err) {
    res.status(500).json({ message: 'Помилка при створенні відгуку' });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { reviewId, rating, comment } = req.body;
    const review = await Review.findByIdAndUpdate(reviewId, { rating, comment }, { new: true });
    res.json({ message: 'Відгук оновлено', review });
  } catch (err) {
    res.status(500).json({ message: 'Помилка при оновленні відгуку' });
  }
};