import { MongoClient, MongoError } from 'mongodb';
const assert = require('assert');

var client:MongoClient = null;
var db:any = null;

export default {
  connect: (url:string) => {
    if (client !== null)
      return;

     client = new MongoClient(url, {
      useNewUrlParser: true
    });

    client.connect((err:MongoError) => {
      assert.equal(err, null);
      console.log('connected to db');
    });
  },

  close: () => {
    if (client === null)
      return;
    client.close();
  },

  client: () => {
    return client;
  },

  selectDb: (database:string) => {
    db = client.db(database);
  },

  collection: (collection:string) => {
    if (db === null)
      return;

    return db.collection(collection);
  }
}
