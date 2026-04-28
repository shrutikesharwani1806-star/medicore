# MediCore - Full-Stack Appointment Booking System

## ✅ Completed Features
1. **Authentication & Roles**
   - Registered/login as Patient or Doctor using real JWT/password authentication.
   - Admin role is predefined.
   - Strict Route Protection using middlewares (Admin routes, Doctor routes, Patient routes).

2. **Doctor Registration Flow**
   - Doctors register with "Pending" status and cannot access dashboard.
   - Admin can approve/reject doctor requests.
   - Mandatory profile form completion for doctors after approval (Specialization, Experience, Fees, Available days/time slots, QR code).

3. **Doctor Listing & Filtering**
   - Patients can view all approved doctors with data strictly fetched from the database.
   - Filter doctors by dynamically generated category/specialization.
   - View detailed doctor profiles including real-time slot availability and fees.

4. **Appointment Booking System**
   - Patient selects doctor, date, and available time slot (slots are validated against database to prevent double-booking).
   - Appointment request goes to the doctor.
   - Doctor can approve or reject the appointment (with a mandatory rejection reason if rejected).
   - Dynamic status flow: Pending → Approved / Rejected / Completed.

5. **Payment System (Credits Based)**
   - Patients must use **credits** to book appointments.
   - Admin uploads QR code; Patients use "Buy Credits" to pay and notify admin.
   - Admin approves credit requests to update the patient's balance.
   - Charges flow strictly implemented:
     - ₹150 Consultation Fee (Split: ₹20 to Admin, ₹130 to Doctor).
     - ₹50 Booking Fee (Goes directly to Admin).
     - Total upfront deduction for patient: ₹200.

6. **Doctor Earnings**
   - Automatic calculation and tracking of doctor earnings per appointment.
   - Automatic calculation and tracking of admin earnings separately.
   - Real-time display of earnings on the respective dashboards.

7. **Online Consultation**
   - Patient can upload prescription or medical files on the Reports page.
   - Doctor can write and manage prescriptions directly from the Doctor panel.

8. **Admin Payment Dashboard**
   - Track precise payment breakdowns (10% credit fee, Consultation Share, Subscription tracking).
   - Display doctor subscription status (Autopay tracked).

9. **Appointment History & Video Calling**
   - Patient Dashboard shows upcoming and past appointments, and reports.
   - Doctor Dashboard shows assigned and completed appointments.
   - Integrated @jitsi/react-sdk for seamless, in-app video consultations for confirmed appointments.

9. **Notifications**
   - Automatic email notifications via Nodemailer on:
     - Doctor application approved/rejected.
     - Appointment approved/rejected.
   - Socket.io powered real-time web notifications for instant updates.

10. **Chatbot Feature**
   - Integrated AI chatbot using Gemini API for patients to ask medical/help queries.

11. **Database Rules**
   - Completely transitioned from mock data to MongoDB.
   - No hardcoded data remains (e.g. FindDoctor specializations are dynamically derived, Dashboards use real API analytics).

12. **Security & Logout**
   - Protected routes using `authMiddleware` on backend and `ProtectedRoute` on frontend.
   - Logout confirmation modal implemented to prevent accidental sign-outs.

13. **UI Requirements**
   - Clean, role-specific dashboards with Tailwind CSS.
   - Interactive Doctor cards and booking flow.

14. **Payment Gateway Integration**
   - Replaced manual QR code credit top-ups with Razorpay for automated, instant credit purchases.
   - Integrated Razorpay checkout script on frontend and order creation/verification endpoints on backend.
   - User credits are updated instantly upon successful verification.
15. **Real File Storage**
   - Integrated Cloudinary for persistent, secure cloud storage.
   - Migrated local `/uploads` directory usage to Cloudinary using `multer-storage-cloudinary`.
   - File URLs are dynamically served directly from Cloudinary's CDN.

16. **Video Call Integration**
   - Integrated `@jitsi/react-sdk` for seamless, in-app video consultations.
   - Patients and doctors can join a secure, unique video room for confirmed appointments directly from their dashboards.

17. **Doctor Platform Subscription System (₹500/month)**
   - Doctors MUST pay ₹500 credits/month to accept appointments (enforced on both frontend and backend).
   - Subscription status is checked monthly — expired subscriptions auto-reset to "unpaid".
   - Dashboard shows clear subscription banner with "Pay Now" and "Buy Credits" actions.
   - Admin earns subscription revenue tracked in the Payment Dashboard.

18. **Doctor Credits & Withdrawal System**
   - Doctors have their own credit balance (displayed in navbar + dashboard).
   - Doctors can buy credits via Razorpay (same flow as patients) to pay platform fees.
   - Doctors can request withdrawal of earnings — admin sees doctor's QR code and approves/rejects.
   - Full financial lifecycle: Patient pays → Doctor earns → Doctor withdraws → Admin transfers via QR.

19. **Doctor QR Code Upload**
   - Doctors must upload payment QR code during profile setup (mandatory for profile completion).
   - QR code is displayed to admin when processing withdrawal requests.
   - File upload UI with preview (base64 encoded).

20. **SMS & Phone Notifications (Simulated)**
    - Implemented `smsService` to simulate phone notifications for critical events.
    - Automated notifications sent when:
      - Appointment is confirmed (to both Doctor and Patient).
      - Doctor requests withdrawal.
      - Admin confirms payment/withdrawal (with credit timing message).
      - Monthly platform subscription is due (after 1 month of non-payment).

21. **Doctor Profile Management & Image Upload**
    - Optimized redirection: Doctors with completed profiles go directly to Dashboard; others are sent to Setup.
    - Added "Edit Profile" button to Doctor Dashboard for easy updates.
    - Integrated Profile Image upload (base64) along with QR code upload.
    - Doctors can update specialization, fees, availability, and about section anytime.

22. **Enhanced Doctor Card Interactions**
    - Doctors clicking their own card are redirected to their profile instead of booking.
    - "YOU" badge added to the doctor's own card for clear identification.
    - "Book Now" disabled for own profile to prevent self-booking.

24. **Secure Real-Time Chat System**
    - Enforced strict access control: Chat is ONLY available for users with a **confirmed** appointment.
    - Integrated Socket.io for instant message delivery and read receipts.
    - Added support for **File Sharing**: Patients and Doctors can share images and PDF documents directly in the chat.
    - Chat history is persisted in MongoDB with automatic message grouping.

25. **Integrated Video Consultation**
    - Secure, 1:1 video rooms powered by Jitsi.
    - Both **Doctors and Patients** can initiate video calls from the chat page.
    - Video call generates a shared room ID so both parties join the same session.
    - In-app consultation experience with camera/mic controls.

26. **Digital Prescription Workflow**
    - Doctors can fill a structured digital prescription form (medicines, dosage, frequency, duration).
    - Prescriptions are stored in the database and linked to specific appointments.
    - Patients can view and download prescriptions after paying the consultation fee (if applicable).

27. **In-Chat Prescription Sharing**
    - Doctors can share prescriptions directly within the chat using a popup form.
    - Prescription form includes diagnosis, medicines (add/remove), dosage, frequency, duration, and instructions.
    - Prescriptions appear as visually distinct **green gradient** chat bubbles with structured formatting.
    - No page navigation required — everything stays within the chat flow.

28. **In-Chat Report Sharing**
    - All users (Patients, Doctors, Admins) can share medical reports directly in chat.
    - Dedicated report upload button (📄) accepts PDF, JPG, JPEG, PNG files.
    - Reports appear as visually distinct **blue gradient** chat bubbles for easy identification.
    - Files are uploaded to Cloudinary and linked in the chat message.

29. **Production Deployment Configuration**
    - Environment-variable based backend URL configuration (`VITE_BACKEND_URL`).
    - Centralized Socket.io connection module with WebSocket-first transport.
    - Proper CORS whitelist configuration for both Express and Socket.io.
    - All `localhost` references replaced with environment variable fallbacks.
    - `.env` files gitignored to prevent secret exposure.
    - Ready for Render (Backend) and Render/Vercel (Frontend) deployment.

159. **Strict Doctor-Patient Privacy**
    - Enforced relationship-based access: Doctors can ONLY view detailed profiles and reports of patients they have had appointments with.
    - Added backend checks to prevent unauthorized access to patient data via ID manipulation.

160. **Doctor Personal Appointment Management**
    - Doctors can now book appointments as patients and manage them through a dedicated `/doctor/personal-appointments` page.
    - Added "Personal Bookings" stat card to Doctor Dashboard for better visibility of personal checkups.
    - Restricted doctors from accessing generic `/patient` dashboard routes to maintain professional context.

161. **Chat & Communication Enhancements**
    - **WhatsApp Style Messaging**: Redesigned chat bubbles with light green colors for sent messages, checkmarks (read/unread), and refined typography.
    - **Message & Chat Deletion**: Users can now delete individual messages they've sent or wipe the entire conversation history.
    - **Real-Time Notifications**: Implemented a global notification system that alerts users with a toast when they receive a message, even if they aren't on the chat page.
    - **Self-Messaging UI**: If a user messages themselves, they appear as "You" in the chat header and sidebar.
    - **Video Call Restriction**: Prevented users from initiating video calls with themselves.

162. **Doctor Visibility & Status**
    - Added a real-time **Active/Inactive** status badge to doctor cards.
    - Status is dynamically determined based on the doctor's approval and availability settings.

163. **Unified Profile Updates**
    - Implemented secure profile update route (`PUT /api/auth/profile`) for patients and doctors to manage their personal info.
    - Verified that all information fetching consistently uses the `userId` derived from the secure authentication token.

164. **Doctor Pending "Demo Mode"**
    - Implemented a specialized access level for doctors awaiting approval.
    - Pending doctors can explore the public website and patient dashboard to "watch the demo website" as a user.
    - Strictly blocked pending doctors from professional clinical tools and finalized appointment bookings.

165. **Mandatory Post-Approval Profile Setup**
    - Enforced a strict profile setup requirement immediately after account approval.
    - Approved doctors with incomplete profiles are locked out of all other dashboards and redirected to the `/doctor/profile` setup form.
    - Mandatory fields include specialization, experience, fees, availability, and payment QR code.

166. **Enhanced Admin Management Dashboard**
    - Unified the User Management interface with a quick-access modal for both Patients and Doctors.
    - **Activation & Suspension**: Added one-click toggles for `Activate/Deactivate` and `Block/Unblock` status management.
    - **Direct Credit Injection**: Enabled administrators to manually add credits to any user's account with real-time balance updates.
    - **Deep Analytics Integration**: Provided a direct path from the management modal to comprehensive doctor analytics and scheduling pages.

167. **Strict Security & Blocking Policy**
    - **Login Isolation**: Any account marked as `isBlocked` is instantly prohibited from entering the system.
    - **Dual-Identifier Security**: Supported both Email and Phone Number login methods, with the block check enforced on both to prevent bypasses.
    - **Password Reset Protection**: Suspended users are strictly blocked from receiving OTPs or using password recovery features.

168. **Role-Specific Dashboard Routing**
    - Optimized the Landing Page "Dashboard" link to intelligently route users:
        - Admins → `/admin`
        - Approved Doctors → `/doctor`
        - Pending Doctors → `/patient` (Demo Mode)
        - Patients → `/patient`

- **Razorpay Sandbox Testing:** Add valid Razorpay keys to environment variables to ensure the checkout iframe doesn't crash on invalid mock keys.

