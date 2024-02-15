import { asyncHandler } from "../utils/asyncHandlere.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import  Jwt  from "jsonwebtoken";
import mongoose from "mongoose";

// Metod for generate Token during login
const generateAccessAndRefreshToken = async (userid) => {
    try {
     // console.log("in side user registration controller")
      const user = await User.findById(userid)
  
      const accessToken = user.generateAccessToken()
     // console.log(acessToken);
      const refereshToken = user.generateRefreshToken()
     // console.log(refereshToken)
  
      user.refreshToken = refereshToken
     // user.accessToken= accessToken
      //console.log("user.retocken  : ", user.refereshToken)
      await user.save({ validateBeforeSave: false })
  
      return { accessToken, refereshToken }
    }
    catch (error) {
      throw new ApiError(500, "somethis went wrong while generate Access or Referesh Token")
    }
  }


// 1 Sign UP user

const registerUser = asyncHandler( async (req, res) => {
try{
    const {email, username, password } = req.body
   // console.log("email: ", email);
     
    if (
        [ email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
  
    const existedUser = await User.findOne({ email })
  
    if (existedUser) {
        throw new ApiError(409, "User with email already exists")
    }
    //console.log(req.files);
    //  if(!existedUser)
    //  {
    //   console.log("user not in db")
    //  }

    const user = await User.create({
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
  
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
  
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
  
  }
  catch(err){
     if(err instanceof ApiError){
      console.log(err.message)
      res.send(err.message)
     } 
  }
  
  
  })


// Log in 
const loginUser = asyncHandler(async (req, res) => {
    try{
    //1.  take data from user
    const { email, password } = req.body
    //2. data validate
    console.log(  email, password)
    if (!email) {
      throw new ApiError(400, " Email is required")
    }
    //3. find user from DB
    const user = await User.findOne(
      {
          email 
      }
    )
    
   // console.log("---user", user)
    //check user data base se find huaa ya nhi
    if (!user) {
      console.log("---user", user)
      throw new ApiError(404, "User does not exist, go for registration")
    }
    // console.log("---user", user)
    // now user find then password validate and compaire with DB sored password
    const isPasswordValid = await user.isPasswordCorrect(password)
    // console.log("..password check ", isPasswordValid)
    // validate with DB password
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password")
    }
  
    //5. generate access token using method in above according to user id
    const { accessToken, refereshToken } = await generateAccessAndRefreshToken(user._id)
  
    //6. send throw coolis
    const loginUser = await User.findById(user._id).select("-password -refreshToken")
  
    const option = {
      httpOnly: true,
      secure: true
    }
  
    return res.status(200).cookie("accessToken", accessToken, option)
      .cookie("refereshToken", refereshToken, option)
      .json(new ApiResponse(
        200,
        {
          user: loginUser, accessToken, refereshToken
        },
        "User logged in sucessfully"
      ))
   }
   catch(error){
        if(error instanceof ApiError)
        {
          res.send(error.message)
        }
      }
  })

// log out
const logOutUser = asyncHandler(async(req, res)=>{
    try{
         // get response from verifyJWT controller from middleware->auth.middleware.js-> here check userlogin or not
         // and if log in then send responce , in responce got here all things of user
         //then task 1) update DB refresh token ->undefined i.e not access to use now without login 
          await User.findByIdAndUpdate(
                                        req.user._id,
                                        {
                                          
                                          $unset: {
                                            refreshToken: 1 
                                        }
                                        },
                                        {
                                          new: true
                                        }
                                       )

          // task 2) send response
          // option user for not change response value by user, only change by server or Backend
           const options ={
                            httpOnly: true,
                            secure: true
                          }
            return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User successfully LogOut"))
       }
    catch(error){
                  res.send(error.message)
                }
})

// refresh token 
const refreshAccessToken = asyncHandler(async(req, res)=>{
    try{
       // 1) take refresh token
        const incommingRefreshToken= req.cookies.refereshToken || req.body.refereshToken
    // console.log(incommingRefreshToken)
        if(!incommingRefreshToken)
        {
          throw new ApiError(401, "UnAuthorized Request")
        }
        //2 got refresh Token then decode it
        const decodeRefreshToken= Jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRT)
  
        //3 find from DB 
        const user= await User.findById(decodeRefreshToken?._id)
  
        if(!user)
        {
          throw new ApiError(401, "Invalid refresh Token ")
        }
      //console.log("user r t:  ", user)
      // 4 now compire commingRefreshToken and DB refresh Token
        if( incommingRefreshToken !== user?.refreshToken)
        {
          throw new ApiError(401, "Refresh Token is expired or used ")
        }
  
  
        //5 generate token both 
        const {accessToken, newRefreshToken}=await generateAccessAndRefreshToken(user._id)
  
        // 6 response send
         const options ={
                          httpOnly: true,
                          secure: true
                        }
        
  
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, 
                              {accessToken, refreshToken:newRefreshToken},
                              "Access Token Refreshed"
                             ))
  
       }
    catch(error){
                 if(error instanceof ApiError)
                 {
                   res.send(error.message)
                 }
                //  else 
                //     res.send(error.message)
                }
  })

//Update Password
const changePassword = asyncHandler(async(req, res)=>{
    try{
        //1 take data from body
        const {oldPassword, newPassword}= req.body
        //2 find user from db
        const user= await User.findById(req.user._id)
  
        //3 check oldPassword with DB
        const isPassword= await user.isPasswordCorrect(oldPassword)
  
        if(!isPassword)
        {
          throw new ApiError(401, "Invalid old Password")
        }
  
        // change DB password with new password
        user.password= newPassword
        // save in DB
        await user.save({validateBeforeSave: false})
  
        // return response
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password change SuccessFully"))
  
       }
    catch(error){
                  if(error instanceof ApiError)
                  {
                    res.send(error.message)
                  }
                }
  })
 
  


  
  export {
    registerUser,
    loginUser,
    // testcontroller
    logOutUser,
    refreshAccessToken,
    changePassword,
    
  }