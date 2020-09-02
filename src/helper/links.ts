import express from "express";
import db from "../models";

exports.followLink = (req: express.Request, res: express.Response) => {
  db.findOne({ source: req.params.source })
    .then(link => {
      if (!link) {
        return;
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