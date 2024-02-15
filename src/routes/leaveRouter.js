import express from 'express'

import { verifyJWT } from '../middleware/auth.middleware.js'
import { cancelLeave, leaveSchedule } from '../controller/leave.controller.js'

const router = express()

// schedule class

router.route('/schedule').post(verifyJWT, leaveSchedule)

// cancel leave 
router.route('/cancel/:leaveid').patch(verifyJWT, cancelLeave)


export default router