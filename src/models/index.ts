import mongoose from "mongoose";
import Link from "./link";
const DBURI = process.env.DBURI || "";

mongoose.set("debug", true);

mongoose.connect(DBURI, { useNewUrlParser: true, useUnifiedTopology: true });

export default Link;