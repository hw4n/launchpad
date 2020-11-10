import mongoose from "mongoose";
import Link from "./link";
const DBURI = process.env.DBURI || "";

mongoose.set("debug", true);

mongoose.connect(DBURI, { useNewUrlParser: true, useUnifiedTopology: true });

export default Link;

const HOUR_IN_MILLISECONDS = 1000 * 60 * 60;
setInterval(() => {
  Link.deleteMany( {
    $or: [{
      max_date: {
        $lte: new Date()
      }
    }, {
      max_access: {
        $eq: 0
      }
    }]
  }).then(query => {
    if (query.ok) {
      console.log(`${new Date()} - ${query.deletedCount} links cleaned up!`);
    } else {
      console.log(`${new Date()} - Interval link cleanup failed!`);
    }
  })
}, HOUR_IN_MILLISECONDS);
