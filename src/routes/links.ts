import { notEqual } from 'assert';
import { Router, Request, Response } from 'express';
import mongo from '../mongo';
import redis from '../redis';
import { ObjectID } from 'bson';

var links = Router();

links.post('/', (req:Request, res:Response) => {
  try {
    notEqual(req.body.apiKey, undefined);
    notEqual(req.body.title, undefined);
    notEqual(req.body.href, undefined);

    mongo.collection('api').findOne({ key: req.body.apiKey, active: 1 })
      .then((access:any) => {
        if ( ! access)
          return res.status(403).send();

        redis.connect();
        var throttle = redis.throttle(req.body.apiKey, 10, 1)
        throttle.then(() => {
          const link = {
            _authorId: access._userId,
            title: req.body.title,
            href: req.body.href
          }
          mongo.collection('links').insertOne(link)
            .then(() => res.status(200).send())
            .catch(() => res.status(500).send());
        })
        .catch((err:any) => {
          console.log(err);
          res.status(429).send();
        });
      })
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

links.get('/:_id', (req:Request, res:Response) => {
  try {
    mongo.collection('links').findOne({ _id: new ObjectID(req.params._id) })
      .then((link:any) => {
        res.status(200).send(link);
      })
      .catch((err:Error) => {
        console.log(err);
        res.status(500).send();
      })
  } catch(err) {
    console.log(err);
    res.status(500).send();
  }
});

export default links;
