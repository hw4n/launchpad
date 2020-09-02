import express from "express";
const app = express();
const PORT = process.env.PORT || 8080

import bodyParser from "body-parser";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

import apiRoute from "./routes"
app.use("/", apiRoute);

app.listen(PORT, () => {
  console.log(`started at ${PORT}`)
})