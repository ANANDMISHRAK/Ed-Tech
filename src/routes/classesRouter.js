import express from 'express'

import { Admin, verifyJWT } from '../middleware/auth.middleware.js'
import { cancelClass, monthelyreportTeacherWise, scheduleClass } from '../controller/class.controller.js'

const router = express()

// schedule class

router.route('/schedule').post(verifyJWT, scheduleClass)

router.route('/cancel/:classid').patch(verifyJWT, cancelClass)

// monthely report
router.route('/monthly-report/:year/:month').patch(verifyJWT, Admin ,monthelyreportTeacherWise)

export default router