import mongoose from "mongoose";
import rand from "rand-token";

export interface Link extends mongoose.Document {
  created_date: Date,
  source: String,
  destination: String,
  password: String,
  max_access: Number,
  max_date: Date
}

const linkSchema = new mongoose.Schema({
  created_date: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    default: () => {
      return rand.generate(5);
    }
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

export const Link = mongoose.model("Link", linkSchema);