import { AssertionError, notEqual } from 'assert';
import { compareSync, hashSync } from 'bcrypt';
import { Request, Response, Router } from 'express';

import mongo from '../mongo';
import { ROLES, USERS } from '../config';
import { MongoError, ObjectID } from 'mongodb';

var users = Router();

users.use((req:Request, res:Response, next:Function) => {
  mongo.selectDb('blog');
  next();
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

users.put('/', (req:any, res:Response) => {
  try {
    if (req.session.role != ROLES.ADMIN)
      return res.status(403).send();

    notEqual(req.body.role, undefined);
    notEqual(req.body.email, undefined);
    notEqual(req.body.username, undefined);
    notEqual(req.body.password, undefined);

    const user:any = {
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

    const user:any = {
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
