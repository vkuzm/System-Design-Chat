const redis = require('redis');

module.exports = async function () {
  const client = redis.createClient({
    url: 'redis://localhost:6379'
  });

  client.on('error', (error) => console.log('Redis Client Error', error));

  await client.connect();

  return client;
}