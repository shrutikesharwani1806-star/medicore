/**
 * Simulated SMS Service for MediCore
 * In a production environment, this would integrate with Twilio, MSG91, or similar services.
 */

export const sendSMS = async (phoneNumber, message) => {
    console.log(`\n--- SMS NOTIFICATION ---`);
    console.log(`TO: ${phoneNumber}`);
    console.log(`MESSAGE: ${message}`);
    console.log(`TIMESTAMP: ${new Date().toLocaleString()}`);
    console.log(`---------------------------\n`);

    // Simulate API delay
    return true;
};

export const notifyBookingConfirmed = async (patient, doctor, appointment) => {
    const patientMsg = `Hello ${patient.name}, your appointment with Dr. ${doctor.name} on ${appointment.date} at ${appointment.slot} is CONFIRMED. Thank you for choosing MediCore!`;
    const doctorMsg = `Dr. ${doctor.name}, you have a confirmed appointment with ${patient.name} on ${appointment.date} at ${appointment.slot}.`;

    await sendSMS(patient.phone, patientMsg);
    await sendSMS(doctor.phone, doctorMsg);
};

export const notifyWithdrawalRequested = async (doctor, amount) => {
    const message = `Hello Dr. ${doctor.name}, your withdrawal request for ₹${amount} has been received. Admin will process it soon.`;
    await sendSMS(doctor.phone, message);
};

export const notifyPaymentReceived = async (doctor, amount) => {
    const message = `Hello Dr. ${doctor.name}, your payment of ₹${amount} has been confirmed by Admin. The amount will be credited to your account within 2-3 days. Thank you!`;
    await sendSMS(doctor.phone, message);
};

export const notifySubscriptionDue = async (doctor) => {
    const message = `Hello Dr. ${doctor.name}, your monthly platform subscription for MediCore is due. Please pay ₹500 to continue receiving new bookings.`;
    await sendSMS(doctor.phone, message);
};
