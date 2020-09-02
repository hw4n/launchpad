import mongoose from "mongoose";
import Link from "./link";
const DBURI = process.env.DBURI || "mongodb+srv://";

mongoose.set("debug", true);

mongoose.connect(DBURI, { useNewUrlParser: true, useUnifiedTopology: true });

export default Link;