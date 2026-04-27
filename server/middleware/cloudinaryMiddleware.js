import { v2 as cloudinary } from 'cloudinary'
import fs from "node:fs"
import dotenv from "dotenv"
import { error } from 'node:console'

dotenv.config()

//configuration
cloudinary.config({
    cloud_name: 'drbeecmoi',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadToCloudinary = async (fileLink) => {

    //upload an image
    const uploadResult = await cloudinary.uploader
        .upload(
            fileLink, {
            resource_type: "auto"
        }
        )
        .catch((error) => {
            console.log(error);
            //if fails remove files from our server
            fs.unlinkSync(fileLink)
        })

    return uploadResult
}

export default uploadToCloudinary