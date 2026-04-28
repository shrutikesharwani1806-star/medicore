import asyncHandler from "express-async-handler";
import Review from "../models/reviewModel.js";
import Appointment from "../models/apointmentModel.js";
import User from "../models/userModel.js";

// @desc    Add a review for a doctor
// @route   POST /api/reviews
export const addReview = asyncHandler(async (req, res) => {
    const { doctorId, rating, comment } = req.body;
    const patientId = req.user._id;

    if (!doctorId || !rating || !comment) {
        res.status(400);
        throw new Error("Please provide all required fields (doctorId, rating, comment).");
    }

    console.log(`Submitting review: Patient ${patientId} -> Doctor ${doctorId}, Rating: ${rating}`);

    // Check if patient has any confirmed or completed appointment with this doctor
    const appointment = await Appointment.findOne({
        patientId,
        doctorId,
        status: { $in: ["confirmed", "completed"] }
    });

    if (!appointment) {
        console.log(`Review failed: No confirmed/completed appointment found for Patient ${patientId} and Doctor ${doctorId}`);
        res.status(403);
        throw new Error("You can only review a doctor you have had an appointment with.");
    }

    // Check if review already exists for this patient-doctor pair
    const existingReview = await Review.findOne({ patientId, doctorId });
    if (existingReview) {
        console.log(`Review failed: Existing review found for Patient ${patientId} and Doctor ${doctorId}`);
        res.status(400);
        throw new Error("You have already reviewed this doctor.");
    }

    const review = await Review.create({
        patientId,
        doctorId,
        rating,
        comment
    });

    // Update doctor's average rating
    try {
        const doctor = await User.findById(doctorId);
        if (doctor) {
            const reviews = await Review.find({ doctorId });
            const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
            doctor.averageRating = totalRating / reviews.length;
            doctor.totalRatings = reviews.length;
            await doctor.save();
            console.log(`Doctor stats updated: ${doctor.name}, Avg: ${doctor.averageRating}, Total: ${doctor.totalRatings}`);
        }
    } catch (err) {
        console.error("Error updating doctor rating:", err);
    }

    res.status(201).json(review);
});

// @desc    Get reviews for a doctor
// @route   GET /api/reviews/:doctorId
export const getDoctorReviews = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const reviews = await Review.find({ doctorId }).populate("patientId", "name image").sort({ createdAt: -1 });
    res.json(reviews);
});

const reviewController = { addReview, getDoctorReviews };
export default reviewController;
