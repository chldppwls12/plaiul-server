import 'dotenv/config';
import { createClient } from 'redis';

const redisClient = createClient();

redisClient.on('error', err => console.log(err));

export default redisClient;
