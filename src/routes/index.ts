import express from "express";
const router = express.Router();
import helper from "../helper/links";

router.route("/:source")
  .get(helper.followLink)

router.route("/api/links")
  .get(helper.getLinks)
  .post(helper.postLink);

export = router;