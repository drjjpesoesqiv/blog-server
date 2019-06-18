import { AssertionError, notEqual } from 'assert';
import { Request, Response, Router } from 'express';
import * as moment from 'moment';
import * as crypto from 'crypto';
import mongo from '../mongo';
import { MongoError, ObjectID } from 'mongodb';
import { ROLES } from '../config';

var api = Router();

api.post('/grant', (req:any, res:Response) => {
  try {
    if (req.session.role !== ROLES.ADMIN)
      return res.status(403).send();

    notEqual(req.body._userId, undefined);
    
    var cred = {
      _userId: req.body._userId,
      key: crypto.randomBytes(20).toString('hex'),
      created: moment().format("YYYY-MM-DD[T]HH:mm:ss"),
      active: 1
    };

    var query = { _userId: req.body._userId };
    mongo.collection('api').update(query, cred, { upsert: true })
      .then(() => {
        res.status(200).send();
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

api.post('/revoke', (req:any, res:Response) => {
  try {
    if (req.session.role !== ROLES.ADMIN)
      res.status(403).send();

    notEqual(req.body._userId, undefined);

    var query = { _userId: req.body._userId };
    mongo.collection('api').update(query, { $set: { active: 0 } })
      .then(() => {
        res.status(200).send();
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

export default api;
