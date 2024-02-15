import mongoose, {Schema} from "mongoose";

const leaveSchema = new Schema(
    {
      teacher : {
                  type: mongoose.Types.ObjectId,
                  ref: "User"
                },
      leaveStart :{
                    type: Date,
                    required: true
                  },
      leaveEnd : {
                   type: Date,
                   required: true
                 }
    },
    {
        timestamps: true
    }
)

export const Leave = mongoose.model("Leave", leaveSchema)