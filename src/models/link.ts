import mongoose from "mongoose";

export interface ILink extends mongoose.Document {
  created_date: Date,
  source: string,
  destination: string,
  password: string,
  max_access: number,
  max_date: Date
}

const linkSchema = new mongoose.Schema({
  created_date: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  password: {
    type: String
  },
  max_access: {
    type: Number,
    default: -1
  },
  max_date: {
    type: Date,
    default: new Date(+new Date() + 7*24*60*60*1000)
  },
}, {
  versionKey: false,
});

export default mongoose.model<ILink>("Link", linkSchema);