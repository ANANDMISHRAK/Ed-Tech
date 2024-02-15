import mongoose, {Schema} from "mongoose";

const classesSchema = new Schema(
    {
      teacher : {
                  type: Schema.Types.ObjectId,
                  ref: "User"
                } ,
      className: {
                   type: String,
                   require: true
                 },
      startTime: {
                   type: Date,
                   require: true
                 },
       endTime:{
                 type: Date,
                 require: true
               }
    },
    {
     timestamps: true
    }
)

export const Classes = mongoose.model("Classes", classesSchema)