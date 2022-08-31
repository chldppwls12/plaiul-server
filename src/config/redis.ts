import 'dotenv/config';
import { createClient } from 'redis';

const redisClient = createClient();

redisClient.on('error', err => console.log(err));

(async () => {
  await redisClient.connect();
})();

export default redisClient;
