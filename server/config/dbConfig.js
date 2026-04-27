import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`DB CONNECTED : ${conn.connection.name}`.bgGreen)
    } catch (error) {
        console.log(`DB CONNECTION FAILED : ${error.message}`.bgRed.white)
    }
}

export default connectDB