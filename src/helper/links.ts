import express from "express";
import db from "../models";
import rand from "rand-token";
const RANDOM_URI_LENGTH = 5;
import bcrypt from "bcrypt";
import crypto from "crypto";
import axios from "axios";
import { Mongoose } from "mongoose";
const RECAPTCHA_URL = "https://www.google.com/recaptcha/api/siteverify";
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
const RECAPTCHA_SITEKEY = process.env.RECAPTCHA_SITEKEY;

exports.displayForm = (req: express.Request, res: express.Response) => {
  res.render("form", { RECAPTCHA_SITEKEY });
}

exports.followLink = (req: express.Request, res: express.Response) => {
  db.findOne({ source: req.params.source })
    .then(link => {
      if (!link) {
        return res.status(404).render("404", {
          message: `So this means the link <span class="not-italic text-white">/${req.params.source}</span> doesn't exist anymore, or it's never been.`
        });
      }

      if (link.max_access === 0) {
        return db.findOneAndDelete({ _id: link._id })
          .then(() => {
            res.status(404).render("404", {
              message: `The link <span class="not-italic text-white">/${req.params.source}</span> has reached the maximum number of accesses, and now it's deleted.`
            });
          });
      }

      if (link.password) {
        return res.status(302).redirect(`/${req.params.source}/auth`);
      }

      if (link.max_access > 0) {
        db.findByIdAndUpdate(link._id, { max_access: link.max_access - 1}, { new: true })
          .then(updatedLink => {
            if (!updatedLink) {
              return;
            }
            console.log(`(${link.source}) max_access--; -> ${updatedLink.max_access}`);
          });
      }
      res.redirect(link.destination);
    })
}

exports.displayAuthForm = (req: express.Request, res: express.Response) => {
  db.findOne({ source: req.params.source })
    .then(link => {
      if (!link) {
        return res.status(404).render("404");
      }

      if (link.max_access === 0) {
        return db.findOneAndDelete({ _id: link._id })
          .then(() => {
            res.status(404).render("404", {
              message: `The link <span class="not-italic text-white">/${req.params.source}</span> has reached the maximum number of accesses, and now it's deleted.`
            });
          });
      }

      if (link.password !== undefined && link.password.length > 0) {
        return res.status(401).render("auth", { RECAPTCHA_SITEKEY });
      } else {
        res.redirect(`/${req.params.source}`);
      }
    })
}

exports.authAndFollowLink = (req: express.Request, res: express.Response) => {
  axios.post(RECAPTCHA_URL, null, {
    params: {
      secret: RECAPTCHA_SECRET,
      response: req.body["g-recaptcha-response"]
    }
  }).then(res => res.data)
    .then(captcha => {
      if (captcha.success === false) {
        return res.render("error", { message: "reCaptcha failed! Please try again." });
      } else {
        db.findOne({ source: req.params.source })
          .then(link => {
            if (!link) {
              return res.status(404).render("404");
            }

            bcrypt.compare(req.body.password, link.password, (err, same) => {
              if (same) {
                const iv = link.password_iv;
                const key = crypto.createHash("SHA256").update(req.body.password).digest("base64").slice(0, 32);
                const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
                let decrypted = decipher.update(link.destination, "hex", "utf8");
                decrypted += decipher.final("utf8");

                if (link.max_access > 0) {
                  db.findByIdAndUpdate(link._id, { max_access: link.max_access - 1}, { new: true })
                    .then(updatedLink => {
                      if (!updatedLink) {
                        console.log(`could not find ${link._id}`);
                        return;
                      }
                    });
                }
                res.redirect(decrypted);
              } else {
                res.status(401).render("error", { message: "Wrong password" });
              }
            })
          })
      }
    })
}

async function sourceIsUnique(source: string = rand.generate(RANDOM_URI_LENGTH)) {
  let unique = false;
  let collided = false;
  while (!unique) {
    try {
      const link = await db.findOne({ source });
      if (!link) {
        unique = true;
      } else {
        source = rand.generate(RANDOM_URI_LENGTH);
        collided = true;
      }
    } catch (e) {
      console.log(`error: ${e}`);
      unique = true;
    }
  }
  return { source, collided };
}

const DAY_IN_MILLISECOND = 1000 * 60 * 60 * 24;
const expireEnum = [
  DAY_IN_MILLISECOND,
  DAY_IN_MILLISECOND * 7,
  DAY_IN_MILLISECOND * 30,
  DAY_IN_MILLISECOND * 30 * 3,
  DAY_IN_MILLISECOND * 30 * 6,
  DAY_IN_MILLISECOND * 30 * 12,
  DAY_IN_MILLISECOND * 30 * 36,
  DAY_IN_MILLISECOND * 30 * 1200,
];

exports.postLink = (req: express.Request, res: express.Response) => {
  axios.post(RECAPTCHA_URL, null, {
    params: {
      secret: RECAPTCHA_SECRET,
      response: req.body["g-recaptcha-response"]
    }
  }).then(res => res.data)
    .then(captcha => {
      if (captcha.success === false) {
        return res.render("error", { message: "reCaptcha failed! Please try again." });
      } else {
        if (req.body.max_access === "") {
          delete req.body.max_access;
        }

        if (!isNaN(req.body.expireDate)) {
          req.body.max_date = new Date(+new Date() + expireEnum[req.body.expireDate]);
        } else {
          req.body.max_date = new Date(+new Date() + expireEnum[5]);
        }
        
        if (req.body.source === "") {
          delete req.body.source;
        }
      
        if (req.body.password !== undefined && req.body.password.length > 0) {
          const iv = crypto.randomBytes(16).toString("hex").slice(0, 16);
          req.body.password_iv = iv;
      
          const key = crypto.createHash("SHA256").update(req.body.password).digest("base64").slice(0, 32);
          const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
          let encrypted = cipher.update(req.body.destination, "utf8", "hex");
          encrypted += cipher.final("hex");
      
          req.body.destination = encrypted;
          req.body.password = bcrypt.hashSync(req.body.password, 10);
        }
      
        sourceIsUnique(req.body.source)
          .then(d => {
            req.body.source = d.source;
      
            if (d.collided) {
              return res.status(409).render("error", { message: "Sorry, your URI tag was collided" });
            }
      
            db.create(req.body)
              .then(newLink => {
                const encrypted = req.body.password !== undefined;
                res.status(201).render("success", { newLink, encrypted });
              })
              .catch((err: any) => {
                res.send(err);
              });;
          })
      }
    })
};

export = exports;