import { AssertionError, notEqual } from 'assert';
import { Request, Response, Router } from 'express';

import { ROLES } from '../config';
import mongo from '../mongo';
import { MongoError, ObjectID } from 'mongodb';

var navigation = Router();

navigation.use((req:Request, res:Response, next:Function) => {
  // mongo.selectDb('blog');
  next();
});

navigation.get('/', (req:Request, res:Response) => {
  try {
    mongo.collection('navigation').find().toArray()
      .then((docs:any) => {
        docs.sort((a:any,b:any) => {
          if (a.order < b.order) return -1;
          if (a.order > b.order) return  1;
          else return 0;
        });
        res.status(200).send(docs);
      })
      .catch(() => {
        res.status(500).send();
      });
  } catch(err) {
    res.status(500).send();
  }
});

navigation.put('/', (req:any, res:Response) => {
  try {
    if (req.session.role != ROLES.ADMIN)
      return res.status(403).send();

    notEqual(req.body.title, undefined);
    notEqual(req.body.href, undefined);
    notEqual(req.body.order, undefined);

    const link:Blog.Link = {
      title: req.body.title,
      href: req.body.href,
      order: req.body.order
    }

    mongo.collection('navigation').insertOne(link)
      .then(() => {
        res.status(200).send();
      })
      .catch(() => {
        res.status(500).send();
      });
  } catch(err) {
    if (err instanceof AssertionError)
      return res.status(400).send();
    res.status(500).send();
  }
});

navigation.post('/update', (req:any, res:Response) => {
  try {
    if (req.session.role != ROLES.ADMIN)
      return res.status(403).send();

    notEqual(req.body.items, undefined);

    mongo.collection('navigation').remove({})
      .then(() => {
        mongo.collection('navigation').insertMany(req.body.items)
          .then(() => res.status(200).send())
          .catch(() => res.status(500).send());
      })
      .catch(() => res.status(500).send());
  } catch(err) {
    if (err instanceof AssertionError)
      return res.status(400).send();
    res.status(500).send();
  }
})

navigation.post('/update/:_id', (req:any, res:Response) => {
  try {
    if (req.session.role != ROLES.ADMIN)
      return res.status(403).send();

    notEqual(req.body.title, undefined);
    notEqual(req.body.href, undefined);

    const link = {
      title: req.body.title,
      href: req.body.href
    }

    mongo.collection('navigation').updateOne({ _id: new ObjectID(req.params._id) }, { $set: link })
      .then(() => {
        res.status(200).send();
      })
      .catch(() => {
        res.status(500).send();
      });
  } catch(err) {
    if (err instanceof AssertionError)
      return res.status(400).send();
    res.status(500).send();
  }
});

navigation.delete('/:_id', (req:any, res:Response) => {
  res.status(200).send();
});

export default navigation;
