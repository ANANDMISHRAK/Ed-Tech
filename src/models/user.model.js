import mongoose, {Schema} from "mongoose";
import bcrypt from 'bcrypt'
import  jwt  from "jsonwebtoken";


const userSchema = new Schema(
    {
        username:{
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
    email :{
        type:String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password:{
         type: String,
         required: true
    },
    admin:{
            type: Boolean,
            default: false 
          },
    refreshToken: {
        type: String
    },
    accessToken:{
        type: String
      }
    },
    {
        timestamps: true
    }
)

// middleware passsword hash
userSchema.pre("save", async function(next)
{
    if(this.isModified("password"))
    {
     // console.log("wait for bcrypt password in userSchema pre middleware")
      this.password= await bcrypt.hash(this.password, 10)
     // console.log(this.password)
    }
    next() 
})

// compair password
userSchema.methods.isPasswordCorrect = async function(password)
  {
    // console.log("copm pass word in userschema")
    return await bcrypt.compare(password, this.password)
  }

  // generate Access token Method 
  userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        email:this.email,
        username: this.userName,
        
    },
    process.env.ACCESS_TOKEN_SECRT,
    {
     expiresIn: process.env.ACCESS_TOKEN_EXPIRY   
    })
  }

  // generate Refresh Token Method
  userSchema.methods.generateRefreshToken =function(){
    return jwt.sign({
        _id: this._id,
        email:this.emai,
        username: this.userName,
        
    },
    process.env.REFRESH_TOKEN_SECRT,
    {
     expiresIn: process.env.REFRESH_TOKEN_EXPIRY   
    }) 
  }


export const User = mongoose.model("User", userSchema)