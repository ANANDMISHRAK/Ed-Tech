import { asyncHandler } from "../utils/asyncHandlere.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Classes } from "../models/class.model.js";
import { Leave } from "../models/leave.model.js";


// schedule a new class
const scheduleClass = asyncHandler(async(req, res)=>{
    try{
         
        const {className, startTime, endTime } = req.body;
        if (
            [ className, startTime, endTime ].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required")
          }

        // Check for overlap with existing classes
        const overlap = await Classes.exists({
        teacher:req.user._id,
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
          { startTime: { $gte: startTime, $lt: endTime } },
          { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
        ],
      });
  
      if (overlap) {
        throw new ApiError(401, "Class time overlaps with an existing class")
        
      }
  
      // If no overlap, add the new class to the database
      const newClass = new Classes({ teacher:req.user._id, className, startTime, endTime });
      await newClass.save();
  
    
       return res
       .status(200)
       .json(new ApiResponse(200, newClass, "Class scheduled successfully"))
       }
    catch(err){
        if(err instanceof ApiError){
           res.send(err.message)
        } 
     }
})


// cancel Class using class id
const cancelClass = asyncHandler(async(req, res)=>{
    try{
         const {classid} = req.params

         if(!classid)
                    {
                      throw new ApiError(401, "Class id is required")
                    }
    // check jo user video delete krna cahta hai kya o owner hai video ka then hi delete krega
      // find video from db
      const classDel = await Classes.findById(classid)

      if(!classDel)
      {
        throw new ApiError(401, "Class does not exist")
      }

      if(classDel.teacher.toString() !== req.user?._id.toString())
      {
        throw new ApiError(401, " Unauthorized to cancel leave")
      }

      const cancelClasses = await Classes.findByIdAndDelete(classid)
        if(!cancelClasses)
        {
            throw new ApiError(401, " not cancel Class")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, cancelClasses, "Successfully Cancel this Class"))
       }
    catch(error)
    {
        if(error instanceof ApiError)
        {
            res.send(error.message)
        }
    }
})


// find monthely report
const monthelyreportTeacherWise = asyncHandler(async(req, res)=>{
    try{
          const {year, month}= req.params
          if(!year || !month)
          {
            throw new ApiError(401, " Year and Month are required for generate monthely report")
          }

        // MongoDb Pipeline aggregration
          const monthlyReport = await Classes.aggregate([
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$startTime' }, parseInt(year)] },
                    { $eq: [{ $month: '$startTime' }, parseInt(month)] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$teacher',
                teacherName: { $first: '$teacher' },
                totalClasses: { $sum: 1 },
                totaltimeInMiliSecond: { $sum: { $subtract: ['$endTime', '$startTime'] } },
               
              },
            },
            {
              $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                      },
            },
        
            {
               $addFields:{
                          totalTimeInHours: {
                             $divide: ["$totaltimeInMiliSecond", 3600000] 
                            },  
                          }
            },
            {
                 $addFields:{
                              totalhours:{
                                           $floor: "$totalTimeInHours"
                                         }
                            }
            },
            {
               $addFields: {
                             hoursInMS:{ $multiply:["$totalhours",  3600000]  }    
                            }
            },
            {
                $addFields:{
                         restTotalMininMS: { $subtract:[ "$totaltimeInMiliSecond","$hoursInMS"]}
                }
            },
            {
                $addFields :{ totalMints :{$floor: {$divide:["$restTotalMininMS", 60000]}}}
            },
            {
              $project: {
                teacherName: { $arrayElemAt: ['$user.username', 1] },
                user:{
                      username:1,
                      email:1
                     },
                totalClasses: 1,
                totaltimeInMiliSecond: 1,
                totalhours:1,
                totalMints:1,
                _id: 0,
              },
            },
          ]);
      // leave
      const leaveReport = await Leave.aggregate([
        {
          $match: {
            $expr: {
              $and: [
                { $eq: [{ $year: '$leaveStart' }, parseInt(year)] },
                { $eq: [{ $month: '$leaveStart' }, parseInt(month)] },
              ],
            },
          },
        },
        {
          $group: {
            _id: '$teacher',
            teacherName: { $first: '$teacher' },
            totalLeaveInMS: { $sum: { $subtract: ['$leaveEnd', '$leaveStart'] } },
          },
        },
        {
          $addFields:{
                     totalLeaveTimeInHours: {
                        $divide: ["$totalLeaveInMS", 3600000] 
                       },  
                     }
       },
       {
            $addFields:{
                         totalLeaveInhours:{
                                      $floor: "$totalLeaveTimeInHours"
                                    }
                       }
       },
       {
           $addFields:{
                       totalLeaveInDays:{
                                        $divide: ["$totalLeaveInhours", 24]
                                   }
                      }
       },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },

        {
          $project: {
            user:{username:1},
            totalLeaveInhours:1,
            totalLeaveInDays: 1,
            _id: 0,
          },
        },
      ]);
  
      return res
      .status(200)
      .json(new ApiResponse(200,{ monthlyReport,leaveReport}, "successfully featch monthely report of teacher"))
       }
    catch(error)
    {
        if(error instanceof ApiError)
        {
            res.send(error.message)
        }
    }
})


export {
    scheduleClass,
    cancelClass,
    monthelyreportTeacherWise
}