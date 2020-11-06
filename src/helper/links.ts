import express from "express";
import db from "../models";
import rand from "rand-token";
const RANDOM_URI_LENGTH = 5;
import bcrypt from "bcrypt";
import crypto from "crypto";

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
        return res.status(401).render("auth");
      } else {
        res.redirect(`/${req.params.source}`);
      }
    })
}

exports.authAndFollowLink = (req: express.Request, res: express.Response) => {
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

exports.postLink = (req: express.Request, res: express.Response) => {
  if (req.body.max_access === "") {
    delete req.body.max_access;
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
};

export = exports;