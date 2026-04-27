import nodemailer from "nodemailer";

// Create a transporter — uses Ethereal (test) by default.
// Set real SMTP credentials in .env for production.
let transporter = null;

const getTransporter = async () => {
    if (transporter) return transporter;

    // Check if real SMTP credentials are provided
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // Use Ethereal for testing (emails visible at ethereal.email)
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }

    return transporter;
};

export const sendEmail = async (to, subject, html) => {
    try {
        const t = await getTransporter();
        const info = await t.sendMail({
            from: process.env.SMTP_FROM || '"MediCore" <noreply@medicore.com>',
            to,
            subject,
            html
        });
        // Log Ethereal preview URL for testing
        const previewUrl = nodemailer.getTestMessageUrl(info);
        return info;
    } catch (error) {
        // Don't throw — email failure shouldn't block the main operation
        return null;
    }
};
