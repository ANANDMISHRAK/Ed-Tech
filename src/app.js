import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import userRouter from './routes/user.router.js'
import classRouter from './routes/classesRouter.js'
import leaveRouter from './routes/leaveRouter.js'

const app = express()

app.use(cors({origin:process.env.CORS_ORIGN}))

app.use(express.json({limit:"150kb"}))
app.use(express.urlencoded({extended: true, limit:"200kb"}))
//app.use(express.static())

app.use(cookieParser());


app.use('/api/v1/user', userRouter)
app.use('/api/v1/class', classRouter)
app.use('/api/v1/leave', leaveRouter)



export {app}