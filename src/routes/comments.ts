import { AssertionError, notEqual } from 'assert';
import { Request, Response, Router } from 'express';
import * as moment from 'moment';
import mongo from '../mongo';
import { MongoError, ObjectID } from 'mongodb';
import { ROLES } from '../config';

var comments = Router();

comments.get('/:_postId', (req:Request, res:Response) => {
  try {
    mongo.collection('comments').find({ _postId: req.params._postId }).toArray()
      .then((comments:any) => {
        var _ids = [];
        comments.forEach((comment:any) => {
          _ids.push(new ObjectID(comment._authorId));
        });
        mongo.collection('users').find({ _id: { $in: _ids }}, { username: 1 }).toArray()
          .then((users:any) => {
            for (var c in comments)
              users.forEach((user:any) => {
                if (comments[c]._authorId == user._id)
                  comments[c]['username'] = user.username;
              });
            res.status(200).send(comments);
          })
          .catch((err:Error) => {
            console.log(err);
            res.status(500).send();
          })
      })
      .catch((err:Error) => {
        console.log(err);
        res.status(500).send();
      })
  } catch(err) {
    res.status(500).send();
  }
});

comments.put('/:_postId', (req:any, res:Response) => {
  try {
    if ( ! req.session.role)
      return res.status(403).send();

    notEqual(req.body.content, undefined);

    const comment:Blog.Comment = {
      _authorId: req.session._userId,
      _postId: req.params._postId,
      date: moment().format("YYYY-MM-DD[T]HH:mm:ss"),
      content: req.body.content
    };

    mongo.collection('comments').insertOne(comment)
      .then(() => res.status(200).send())
      .catch(() => res.status(500).send());
  } catch (err) {
    if (err instanceof AssertionError)
      return res.status(400).send();
    res.status(500).send();
  }
});

comments.delete('/:_id', (req:any, res:Response) => {
  try {
    if (req.session.role != ROLES.ADMIN)
      res.status(403).send();

    mongo.collection('comments').remove({ _id: new ObjectID(req.params._id) })
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

export default comments;
