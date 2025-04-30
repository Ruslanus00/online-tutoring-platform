const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const { getProfile, updateProfile, getAllTutors, getUserById } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile);

router.get('/tutors', getAllTutors);
router.get('/:id', authMiddleware, getUserById);

module.exports = router;
