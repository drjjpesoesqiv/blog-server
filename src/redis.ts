import * as redis from 'redis';
import { REDIS_PORT, REDIS_URL } from './config';

var client:redis.RedisClient;

export default {
  connect: () => {
    if ( ! client)
      client = redis.createClient(REDIS_PORT, REDIS_URL);
    return client;
  },

  throttle: (id:string, limit:number, penalty:number) => {
    var key = `throttle:${id}`;
    return new Promise((resolve:Function, reject:Function) =>  {
      client.incr(key, (err:Error, count:number) => {
        client.expire(key, penalty);
        if (count > limit)
          return reject();
        resolve();
      });
    });
  }
}
