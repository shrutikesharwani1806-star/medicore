import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxkufsejm', // Dummy fallback
  api_key: process.env.CLOUDINARY_API_KEY || '626786847842323',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'gqFv1R9zH67HWe850XhH8E-gNTE',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "medicore_reports",
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export default upload;