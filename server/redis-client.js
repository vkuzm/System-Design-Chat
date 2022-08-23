const redis = require('redis');

const onRedisError = (err) => {console.error(err)};
const onRedisConnect = () => {console.log('Redis connected')};
const onRedisReconnecting = () => {console.log('Redis reconnecting')};
const onRedisReady = () => {console.log('Redis ready!')};

module.exports = async function () {
  const client = redis.createClient({
    url: 'redis://localhost:6379'
  });

  client.on('error', onRedisError);
  client.on('connect', onRedisConnect);
  client.on('reconnecting', onRedisReconnecting);
  client.on('ready', onRedisReady);

  await client.connect();

  return client;
}