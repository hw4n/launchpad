import express from "express";
const router = express.Router();
import helper from "../helper/links";

router.route("/")
  .get((req, res) => {
    res.render('form');
  })

router.route("/:source")
  .get(helper.followLink);

router.route("/:source/auth")
  .get(helper.displayAuthForm)
  .post(helper.authAndFollowLink);

router.route("/api/links")
  .post(helper.postLink);

router.route("*")
  .get((req, res) => {
    res.render('404');
  })

export = router;