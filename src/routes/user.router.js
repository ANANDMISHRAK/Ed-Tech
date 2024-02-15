import express from 'express'

import { verifyJWT } from '../middleware/auth.middleware.js'
import { 
        changePassword,
        logOutUser,
        loginUser,
        refreshAccessToken,
        registerUser,

       } from '../controller/user.controller.js'

const router = express()

// sign up
router.route("/register").post(registerUser)
 
//log in
router.route('/login').post(loginUser)
// log out
router.route('/logout').post(verifyJWT, logOutUser)

// refresh access token router
router.route('/refresh-token').post(refreshAccessToken)

  //change password
router.route('/change-password').post(verifyJWT ,changePassword)

export default router