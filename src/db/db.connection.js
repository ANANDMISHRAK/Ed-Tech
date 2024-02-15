
import mongoose from "mongoose";

const connectionDB = async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}`)

        console.log("MongoDB connected : " , connectionInstance.connection.host)
    }
    catch(error)
    {
        console.log("MongoDB connection faiueld", error)
        process.exit(1)
    }
}
 
export default connectionDB;