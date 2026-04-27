# 🏥 MediCore — Hospital Management + AI Assistant

MediCore is a full-stack MERN application designed to streamline hospital operations and enhance patient-doctor interaction. It includes appointment booking, prescription management, real-time updates, and AI-powered healthcare assistance.

---

## 🚀 Features

### 👤 Patient Panel

* Register/Login with OTP authentication
* Search and find doctors by specialization
* Book appointments in real-time
* View appointment history
* Upload lab reports (PDF)
* AI-powered lab report summary (frontend simulation)
* Chat with doctors (UI)

---

### 🩺 Doctor Panel

* Login with approval-based access
* Manage availability slots
* View and manage appointments
* Accept/Reject booking requests
* Create prescriptions
* View patient details

---

### 🛠️ Admin Panel

* Dashboard with analytics (users, doctors, appointments)
* Approve or reject doctor registrations
* Manage users
* Monitor system activity

---

### 🤖 AI Features (UI + Backend Ready)

* Symptom → Doctor suggestion system
* Lab report analyzer (PDF → summary + abnormal values)
* Prescription OCR parsing (text extraction)

---

### ⚡ Real-Time Features

* Appointment notifications (Socket.io)
* Instant UI updates

---

## 🧱 Tech Stack

### Frontend

* React.js (JSX only)
* Tailwind CSS v4.2
* Zustand (state management)
* React Router

### Backend (Planned / Extendable)

* Node.js
* Express.js
* MongoDB
* JWT Authentication
* Multer (file uploads)
* OpenAI API (AI features)
* Socket.io

---

## 📁 Project Structure

```
MediCore/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── patient/
│   │   │   ├── doctor/
│   │   │   ├── admin/
│   │   ├── store/
│   │   ├── routes/
│   │   └── App.jsx
│
├── backend/ (optional/extendable)
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
│
└── README.md
```

---

## 🔐 Authentication Flow

1. User enters email/phone
2. OTP is sent (simulated in UI)
3. User verifies OTP
4. Role-based redirection:

   * Patient → Dashboard
   * Doctor → Approval Pending (until approved)
   * Admin → Admin Dashboard

---

## 🔄 User Roles & Access

| Role    | Access Level                 |
| ------- | ---------------------------- |
| Patient | Full access without approval |
| Doctor  | Requires admin approval      |
| Admin   | Full system control          |

---

## 🎨 UI Design Principles

* Clean healthcare design (no neon theme)
* Light background with soft shadows
* Fully responsive layout
* Reusable components
* Minimal and user-friendly UX

---

## 🛠️ Installation & Setup

### 1. Clone the repository

```
git clone https://github.com/your-username/medicore.git
cd medicore
```

### 2. Install dependencies

```
cd frontend
npm install
```

### 3. Run the app

```
npm run dev
```

---

## 📦 Environment Variables (Backend - Optional)

Create a `.env` file:

```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_api_key
```

---

## 🔮 Future Improvements

* Real AI integration for reports and OCR
* Video consultation (WebRTC)
* Payment gateway integration
* Email/SMS OTP integration
* Notification system with push alerts

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork this repo and submit a pull request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 💡 Author

**Shruti Kesharwani**
MERN Stack Developer

---

## ⭐ Final Note

This project is designed as a **production-level portfolio project** showcasing:

* Scalable architecture
* Clean UI/UX
* Real-world healthcare workflows
* AI-powered enhancements

---
