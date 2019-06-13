import { AssertionError, notEqual } from 'assert';
import { Request, Response, Router } from 'express';

import { PAGES, ROLES } from '../config';
import mongo from '../mongo';
import { MongoError, ObjectID } from 'mongodb';

import * as moment from 'moment';
import * as slug from 'slug';

var pages = Router();

pages.use((req:Request, res:Response, next:Function) => {
  // mongo.selectDb('blog');
  next();
});

pages.get('/count', (req:Request, res:Response) => {
  try {
    mongo.collection('pages').count((err:MongoError,count:number) => {
      if (err) return res.status(500).send();
      return res.status(200).send({ count: count, perPage: PAGES.PER_PAGE });
    })
  } catch(err) {
    res.status(500).send();
  }
});

pages.get('/:niceTitle', (req:Request, res:Response) => {
  try {
    mongo.collection('pages').findOne({ niceTitle: req.params.niceTitle })
      .then((doc:any) => {
        if ( ! doc)
          return res.status(404).send();
        res.status(200).send(doc);
      })
      .catch(() => res.status(500).send());
  } catch(err) {
    res.status(500).send();
  }
});

pages.get('/id/:_id', (req:Request, res:Response) => {
  try {
    mongo.collection('pages').findOne({ _id: new ObjectID(req.params._id) })
      .then((doc:any) => {
        if ( ! doc)
          return res.status(404).send();
        res.status(200).send(doc);
      })
      .catch(() => res.status(500).send());
  } catch(err) {
    res.status(500).send();
  }
});

pages.get('/page/:page', (req:Request, res:Response) => {
  try {
    const query = {
      limit: PAGES.PER_PAGE,
      skip: PAGES.PER_PAGE * (req.params.page - 1)
    };
    mongo.collection('pages').find({}, query).toArray()
      .then((docs:any) => {
        res.status(200).send(docs);
      })
      .catch(() => res.status(500).send());
  } catch(err) {
    res.status(500).send();
  }
});

pages.put('/', (req:any, res:Response) => {
  try {
    if (req.session.role != ROLES.ADMIN)
      return res.status(403).send();

    notEqual(req.body.title, undefined);
    notEqual(req.body.content, undefined);

    var page:Blog.Page = {
      author: req.session.username,
      title: req.body.title,
      niceTitle: slug(req.body.title.toLowerCase()),
      date: moment().format("YYYY-MM-DD[T]HH:mm:ss"),
      content: req.body.content
    };

    mongo.collection('pages').insertOne(page)
      .then(() => {
        res.status(200).send();
      })
      .catch(() => res.status(500).send());
  } catch(err) {
    if (err instanceof AssertionError)
      return res.status(400).send();
    res.status(500).send();
  }
});

pages.post('/update/:_id', (req:any, res:Response) => {
  try {
    if (req.session.role != ROLES.ADMIN)
      return res.status(403).send();

    notEqual(req.body.title, undefined);
    notEqual(req.body.date, undefined);
    notEqual(req.body.content, undefined);

    var page = {
      title: req.body.title,
      niceTitle: slug(req.body.title.toLowerCase()),
      date: req.body.date,
      content: req.body.content
    }

    mongo.collection('pages').updateOne({ _id: new ObjectID( req.params._id )}, {$set: page})
      .then(() => {
        res.status(200).send();
      })
      .catch(() => {
        res.status(500).send();
      });
  } catch (err) {
    res.status(500).send();
  }
});

pages.delete('/:_id', (req:any, res:Response) => {
  try {
    if (req.session.role != ROLES.ADMIN)
      return res.status(403).send();

    mongo.collection('pages').remove({ _id: new ObjectID(req.params._id) })
      .then((outcome:any) => {
        if (outcome.result.n === 0)
          return res.status(422).send();
        res.status(200).send(outcome);
      })
      .catch(() => res.status(500).send());
  } catch(err) {
    res.status(500).send();
  }
});

export default pages;
