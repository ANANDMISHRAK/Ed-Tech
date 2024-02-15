import { asyncHandler } from "../utils/asyncHandlere.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Leave } from "../models/leave.model.js";


// Schedule Leave

const leaveSchedule = asyncHandler(async(req, res)=>{
    try{
        const {leaveStart, leaveEnd } = req.body;
        if (
            [ leaveStart, leaveEnd ].some((field) => field?.trim() === "")
           ) {
                throw new ApiError(400, "All fields are required")
             }

     // Check for valid leave dates (endDate should be after startDate)
      if (leaveStart >= leaveEnd) {
        throw new ApiError(401, "Invalid leave dates. End date should be after start date")
      }
 
       // Check for overlapping leave dates
       const overlap = await Leave.exists({
                                           teacher: req.user._id,
                                           $or: [
                                                 { leaveStart: { $lt: leaveEnd }, leaveEnd: { $gt: leaveStart } },
                                                 { leaveStart: { $gte: leaveStart, $lt: leaveEnd } },
                                                 { leaveStart: { $lte: leaveStart }, leaveEnd: { $gte: leaveEnd } },
                                                ],
                                          }); 
      
      if (overlap) {
        throw new ApiError(401, "Leave dates overlap with an existing leave")
      }
  
  
      // If no overlap and valid dates, add the new leave to the database
      const newLeave = new Leave(
                                 {  
                                    teacher: req.user._id , 
                                    leaveStart,
                                    leaveEnd 
                                 });
      await newLeave.save();
     
      return res
      .status(200)
      .json(new ApiResponse(200, newLeave, "Leave scheduled successfully"))
       }
    catch(error)
    {
        if(error instanceof ApiError)
        {
            res.send(error.message)
        }
    }

})

// cancel leave using leave doc if 
const cancelLeave = asyncHandler(async(req, res)=>{
    try{
         const {leaveid} = req.params

         if(!leaveid)
                    {
                      throw new ApiError(401, "Leave id is required")
                    }
    // check jo user video delete krna cahta hai kya o owner hai video ka then hi delete krega
      // find video from db
      const leaveDel = await Leave.findById(leaveid)

      if(!leaveDel)
      {
        throw new ApiError(401, "Leave does not exist")
      }

      if(leaveDel.teacher.toString() !== req.user?._id.toString())
      {
        throw new ApiError(401, " Unauthorized to cancel leave")
      }

      const cancelLeaves = await Leave.findByIdAndDelete(leaveid)
        if(!cancelLeaves)
        {
            throw new ApiError(401, " not cancel leave")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, cancelLeaves, "Successfully Cancel this Leave"))
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
        leaveSchedule ,
        cancelLeave 
       }