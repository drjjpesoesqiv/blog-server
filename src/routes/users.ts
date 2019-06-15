import { AssertionError, notEqual } from 'assert';
import { compareSync, hashSync } from 'bcrypt';
import { Request, Response, Router } from 'express';
import axios from 'axios';

import mongo from '../mongo';
import { MongoError, ObjectID } from 'mongodb';

import { MAIL_SERVICE_URL, ROLES, USERS } from '../config';
import { REGISTRATION_EMAIL } from '../locale.json';

import * as qs from 'querystring';

var users = Router();

users.use((req:Request, res:Response, next:Function) => {
  // mongo.selectDb('blog');
  next();
});

users.get('/hydrate', (req:any, res:Response) => {
  try {
    if ( ! req.session.username)
      return res.status(200).send();
    
    return res.status(200).send({
      role: req.session.role,
      username: req.session.username
    })
  } catch(err) {
    res.status(500).send();
  }
});

users.get('/count', (req:Request, res:Response) => {
  try {
    mongo.collection('users').count((err:MongoError,count:number) => {
      if (err) return res.status(500).send();
      return res.status(200).send({ count: count, perPage: USERS.PER_PAGE });
    })
  } catch(err) {
    res.status(500).send();
  }
});

users.post('/login', (req:any, res:Response) => {
  try  {
    notEqual(req.body.username, undefined);
    notEqual(req.body.password, undefined);

    mongo.collection('users').findOne({ username: req.body.username })
      .then((user:any) => {
        if (user && compareSync(req.body.password, user.password)) {
          req.session._userId = user._id;
          req.session.role = user.role;
          req.session.username = user.username;
          res.status(200).send({ role: user.role, username: user.username });
        } else {
          res.status(403).send();
        }
      })
      .catch(() => { res.status(403).send() });
  } catch(err) {
    if (err instanceof AssertionError)
      return res.status(400).send();
    res.status(500).send();
  }
});

users.get('/logout', (req:any, res:Response) => {
  try {
    req.session.destroy();
    res.status(200).send();
  } catch(err) {
    res.status(500).send();
  }
})

users.get('/page/:page', (req:Request, res:Response) => {
  try {
    const query = {
      limit: USERS.PER_PAGE,
      skip: USERS.PER_PAGE * (req.params.page - 1)
    };

    mongo.collection('users').find({}, query).toArray()
      .then((users:any) => {
        if ( ! users.length)
          return res.status(404).send();
        res.status(200).send(users);
      }).catch(() => { res.status(500).send() });
  } catch(err) {
    res.status(500).send();
  }
});

users.get('/:_id', (req:Request, res:Response) => {
  try {
    mongo.collection('users').findOne({ _id: new ObjectID(req.params._id) })
      .then((user:any) => {
        if ( ! user)
          return res.status(404).send();
        user['password'] = '';
        res.status(200).send(user);
      })
      .catch(() => res.status(500).send());
  } catch(err) {
    res.status(500).send();
  }
});

users.post('/register', (req:any, res:Response, next:Function) => {
  try {
    notEqual(req.body.email, undefined);
    notEqual(req.body.username, undefined);
    notEqual(req.body.password, undefined);

    const user:Blog.User = {
      role: ROLES.GENERIC,
      email: req.body.email,
      username: req.body.username,
      password: hashSync(req.body.password, 10)
    };

    mongo.collection('users').insertOne(user)
      .then((outcome:any) => {
        axios.post(MAIL_SERVICE_URL, qs.stringify({
          to: req.body.email,
          subject: REGISTRATION_EMAIL.SUBJECT,
          message: REGISTRATION_EMAIL.MESSAGE
        }),{
          headers: {
            'Content-Type': "application/x-www-form-urlencoded"
          }
        });

        req.session._userId = outcome.ops[0]._id;
        req.session.role = ROLES.GENERIC;
        req.session.username = req.body.username;
        
        res.status(200).send({
          role: req.session.role,
          username: req.session.username
        })
      })
      .catch(() => res.status(500).send() );
  } catch(err) {
    if (err instanceof AssertionError)
      res.status(400).send();
  }
});

users.put('/', (req:any, res:Response) => {
  try {
    if (req.session.role != ROLES.ADMIN)
      return res.status(403).send();

    notEqual(req.body.role, undefined);
    notEqual(req.body.email, undefined);
    notEqual(req.body.username, undefined);
    notEqual(req.body.password, undefined);

    const user:Blog.User = {
      role: req.body.role,
      email: req.body.email,
      username: req.body.username,
      password: hashSync(req.body.password, 10)
    };

    mongo.collection('users').insertOne(user)
      .then(() => res.status(200).send() )
      .catch(() => res.status(500).send() );
  } catch(err) {
    if (err instanceof AssertionError)
      res.status(400).send();
  }
});

users.post('/update/:_id', (req:any, res:Response) => {
  try {
    if (req.session.role != ROLES.ADMIN)
      return res.status(403).send();

    notEqual(req.body.role, undefined);
    notEqual(req.body.email, undefined);
    notEqual(req.body.username, undefined);

    var user:any = {
      role: req.body.role,
      email: req.body.email,
      username: req.body.username
    };

    if (req.body.password)
      user['password'] = hashSync(req.body.password, 10);

    mongo.collection('users').updateOne({ _id: new ObjectID(req.params._id)}, { $set: user })
      .then(() => res.status(200).send() )
      .catch(() => res.status(500).send() );
  } catch(err) {
    if (err instanceof AssertionError)
      res.status(400).send();
  }
});

users.delete('/:_id', (req:any, res:Response) => {
  try {
    if (req.session.role != ROLES.ADMIN)
      return res.status(403).send();

    mongo.collection('users').remove({ _id: new ObjectID(req.params._id) })
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

export default users;
