const Stomp = require('stomp-client');

module.exports = function () {
  const client = new Stomp('127.0.0.1', 61613);

  return new Promise(function (resolve, reject) {
    const failureCallback = function (err) {
      if (err.reconnectionFailed) {
        reject("could not connect");
      } else {
        reject(err);
      }
    }
    client.once('error', failureCallback);
    client.connect(function (sessionId) {
      client.removeListener('error', failureCallback);

      resolve({
        onMessage: function (queueName, onMessage) {
          client.subscribe(queueName, onMessage);
        },
        putMessage: function (queueName, message) {
          client.publish(queueName, message);
        }
      });
    });
  });
};