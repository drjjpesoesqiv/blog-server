import { Request, Response, Router } from 'express';
import { AssertionError, notEqual } from 'assert';
import { hashSync } from 'bcrypt';
import mongo from '../mongo';

import { ROLES } from '../config';

var install = Router();

install.get('/', (req:Request, res:Response) => {
  try {
    notEqual(req.query['email'], undefined);

    mongo.collection('users').find().toArray()
      .then((docs:any) => {
        if (docs.length)
          return res.status(405).send();

        const user:Blog.User = {
          role: ROLES.ADMIN,
          email: req.query['email'],
          username: 'admin',
          password: hashSync('admin', 10)
        };

        mongo.collection('users').insertOne(user)
          .then(() => res.status(200).send() )
          .catch(() => res.status(500).send() );
      })
      .catch(() => res.status(500).send());
  } catch(err) {
    if (err instanceof AssertionError)
      res.status(400).send();
  }
});

export default install;