const WebSocket = require('ws');
const stompClient = require('./stomp-client');
const createRedisClient = require('./redis-client');

const webSocketServer = new WebSocket.Server({ port: 5000 });
const users = new Map();
let messageQueue = null;
let redisClient = null;

const OPERATIONS = {
  MESSAGE: 'MESSAGE',
  UPDATE: 'UPDATE',
  DELIVERY: 'DELIVERY'
}

webSocketServer.on('connection', async (ws, req) => {
  const userId = getUserIdFromURL(req.url);
  if (!userId) {
    return;
  }

  users.set(userId, ws);

  try {
    redisClient = await createRedisClient();
    const cachedMessages = await redisClient.lRange(`messages_${userId}`, 0, -1);
    
    if (cachedMessages) {
      const messages = cachedMessages.map((cachedMessage) => {
        return JSON.parse(cachedMessage);
      });

      if (messages.length) {
        sendResponse({
          operation: OPERATIONS.UPDATE,
          sendTo: userId,
          messages: messages
        });
      }
    }

  } catch (error) {
    console.log(error);
  }

  messageQueue = await stompClient();
  messageQueue.onMessage(getUserMessageQueue(userId), function (body, headers) {
    const message = JSON.parse(body);

    if (users.has(message.receiverId)) {
      const jsonMessage = {
        messageId: message.messageId,
        userName: message.userName,
        userId: message.senderId,
        chatId: message.chatId,
        text: message.text,
        date: message.date
      }

      try {
        sendResponse({
          operation: OPERATIONS.MESSAGE,
          sendTo: message.receiverId,
          chatId: message.chatId,
          message: jsonMessage
        });
      } catch (error) {
        console.log(error);
      }
    }
  });

  ws.on('message', async (data) => {
    const { senderId, receiverId, ...message } = JSON.parse(data);

    if (senderId === receiverId) {
      return;
    }

    // TODO check if there is a receiver id in user table

    const messageToSend = {
      messageId: Math.floor(Math.random() * 1000 + 1),
      senderId: senderId,
      receiverId: receiverId,
      date: new Date(),
      ...message
    }

    try {
      await saveMessageToCache(messageToSend);

      sendResponse({
        operation: OPERATIONS.MESSAGE,
        sendTo: senderId,
        chatId: receiverId,
        message: messageToSend
      });

      sendMessage({
        operation: OPERATIONS.MESSAGE,
        sendTo: receiverId,
        chatId: senderId,
        message: messageToSend
      });
    } catch (error) {
      console.log(error);
    }
  });
});

const saveMessageToCache = async (message) => {
  if (message.senderId && message.receiverId) {
    const jsonMessage = JSON.stringify(message);

    await redisClient.rPush(`messages_${message.senderId}`, jsonMessage);
    await redisClient.rPush(`messages_${message.receiverId}`, jsonMessage);
  }
}

const sendResponse = ({ sendTo, ...values }) => {
  if (users.has(sendTo)) {
    users.get(sendTo).send(generateJsonMessage(values));
  }
}

const sendMessage = ({ sendTo, ...values }) => {
  if (sendTo && messageQueue) {
    messageQueue.putMessage(getUserMessageQueue(sendTo), generateJsonMessage(values));
  }
}

const generateJsonMessage = ({ operation, chatId, ...values }) => {
  return JSON.stringify({
    operation: operation,
    chatId: chatId,
    ...values
  });
}

const getUserMessageQueue = (userId) => {
  return `/queue/user_${userId}`;
}

const getUserIdFromURL = (url) => {
  const userId = url.replace(/\/userId=(.+)/, '$1');
  return userId && userId !== 'null' ? userId : null;
}