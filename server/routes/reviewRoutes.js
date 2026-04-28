import express from 'express';
import { addReview, getDoctorReviews } from '../controller/reviewController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect.forUser, addReview);
router.get('/:doctorId', getDoctorReviews);

export default router;
