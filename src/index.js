import dotenv from "dotenv";
import {app} from "./app.js"
import connectionDB from "./db/db.connection.js";


dotenv.config({
    path : "./.env"
})

connectionDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log(error)
        throw error
    })

    app.listen(process.env.PORT || 8000 , ()=>{
        console.log('server is running at  : ', process.env.PORT)
    })
})
.catch((err)=>{
    console.log("MongoDb connection faield", err)
})

