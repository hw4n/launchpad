import express from "express";
import db from "../models";

exports.followLink = (req: express.Request, res: express.Response) => {
  db.findOne({ source: req.params.source_url })
    .then((link: any) => {
      res.redirect(link.destination)
    })
}

exports.getLinks = (req: express.Request, res: express.Response) => {
  db.find()
    .then((links: any) => {
      res.status(200).json(links);
    })
    .catch((err: any) => {
      res.send(err);
    })
}

exports.postLink = (req: express.Request, res: express.Response) => {
  db.create(req.body)
    .then((newLink: any) => {
      res.status(201).json(newLink);
    })
    .catch((err: any) => {
      res.send(err);
    });
};

export = exports;