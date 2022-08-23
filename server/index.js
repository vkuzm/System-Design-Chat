const WebSocket = require('ws');
const stompClient = require('./stomp-client');
const redisClient = require('./redis-client');

const webSocketServer = new WebSocket.Server({ port: 5000 });
const users = new Map();

webSocketServer.on('connection', async (ws, req) => {
  const userId = req.url.replace(/\/userId=(.+)/, '$1');
  users.set(userId, ws);

  if (userId === 'null') {
    return;
  }

  // Load old chat messages from history
  // const client = await redisClient();
  // const oldMessagesJson = await client.get(`messages_${userId}`);

  // if (oldMessagesJson) {
  //   const oldParsedMessages = JSON.parse(oldMessagesJson);

  //   if (oldParsedMessages && Array.isArray(oldParsedMessages)) {
  //     // const oldMessages = oldParsedMessages
  //     //   .map(async (message) => {
  //     //     const senderUser = await client.get(`users_${message.senderId}`);
  //     //     return { ...message, senderUser };
  //     //   });

  //     console.log(oldParsedMessages);
  //     ws.send('test');
  //   }
  // }

  const messageQueue = await stompClient();
  messageQueue.onMessage(`/queue/user_${userId}`, function (body, headers) {
    const message = JSON.parse(body);

    const jsonMessage = {
      messageId: message.messageId,
      userName: message.userName,
      userId: message.senderId,
      chatId: message.chatId,
      text: message.text,
      date: message.date
    }

    users.get(message.receiverId).send(JSON.stringify(jsonMessage));
  });

  ws.on('message', async (data) => {
    //const client = await redisClient();
    const { senderId, receiverId, userName, text } = JSON.parse(data);

    const messageToSave = {
      messageId: Math.floor(Math.random() * 1000 + 1),
      senderId: senderId,
      userName: userName,
      text: text,
      date: new Date()
    }

    // const messages = await client.get(`messages_${receiverId}`);

    // if (messages && Array.isArray(messages)) {
    //   const newMessages = [...JSON.parse(messages), messageToSave];
    //   await client.set(`messages_${receiverId}`, JSON.stringify(newMessages));
    // } else {
    //   await client.set(`messages_${receiverId}`, JSON.stringify([messageToSave]));
    // }

    // const senderUser = await client.get(`users_${senderId}`);

    const messageToSend = {
      ...messageToSave
    }

    if (senderId === receiverId) {
      return;
    }

    // check if there is a receiver id in user table

    messageQueue.putMessage(`/queue/user_${senderId}`, JSON.stringify({ ...messageToSend, receiverId: senderId, chatId: receiverId }));
    messageQueue.putMessage(`/queue/user_${receiverId}`, JSON.stringify({ ...messageToSend, receiverId: receiverId, chatId: senderId }));
  });
});

// (async function populateTestUsers() {
//   const client = await redisClient();
//   const existedUser = await client.get('users_1');

//   if (!existedUser) {
//     await client.set(`users_1`, JSON.stringify({
//       userId: 1,
//       username: 'test 1'
//     }));

//     await client.set(`users_2`, JSON.stringify({
//       userId: 2,
//       username: 'test 2'
//     }));
//   }
// })();