const PORT = process.argv[2];

const express = require('express');
const session = require('express-session');
const cors = require('cors');

import mongo from './mongo';
mongo.connect('mongodb://127.0.0.1:27017', 'blog');

import installRoute from './routes/install';
import commentsRoute from './routes/comments';
import navigationRoute from './routes/navigation';
import pagesRoute from './routes/pages';
import postsRoute from './routes/posts';
import usersRoute from './routes/users';

const app = express();
app.use(cors({
  origin: ["http://localhost:3000","http://localhost:3001"],
  credentials: true
}));
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

app.use(express.json())

app.use('/install', installRoute);
app.use('/comments', commentsRoute);
app.use('/navigation', navigationRoute);
app.use('/pages', pagesRoute);
app.use('/posts', postsRoute);
app.use('/users', usersRoute);

app.get('/', (req:any, res:any) => {
  res.status(200).send('howdy');
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});