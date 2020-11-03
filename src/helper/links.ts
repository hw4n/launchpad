import express from "express";
import db from "../models";

exports.followLink = (req: express.Request, res: express.Response) => {
  db.findOne({ source: req.params.source })
    .then(link => {
      if (!link) {
        return res.status(404).render("404");
      }

      if (link.max_access === 0) {
        return res.send({error: "max access exceeded"});
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

exports.getLinks = (req: express.Request, res: express.Response) => {
  db.find()
    .then(links => {
      res.status(200).json(links);
    })
    .catch((err: any) => {
      res.send(err);
    })
}

exports.postLink = (req: express.Request, res: express.Response) => {
  db.create(req.body)
    .then(newLink => {
      res.status(201).json(newLink);
    })
    .catch((err: any) => {
      res.send(err);
    });
};

export = exports;