import express from "express";
import db from "../models";

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

exports.postLink = (req: express.Request, res: express.Response) => {
  if (req.body.source === "") {
    delete req.body.source;
  }

  if (req.body.max_access === "") {
    req.body.max_access = -1;
  }
  
  db.create(req.body)
    .then(newLink => {
      res.status(201).render("success", { newLink });
    })
    .catch((err: any) => {
      res.send(err);
    });
};

export = exports;