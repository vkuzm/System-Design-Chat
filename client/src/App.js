import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useRef, useState } from 'react';
import './App.css';
import ChatTabs from './components/chat-tabs';
import MessageSendBox from './components/message-send-box';
import MessageViewBox from './components/message-view-box';

const App = () => {
  const ws = useRef(null);
  const chatBoxRef = useRef(null);

  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([{
    id: '1',
    image: '',
    name: 'Test 1'
  },
  {
    id: '2',
    image: '',
    name: 'Test 2'
  },
  {
    id: '3',
    image: '',
    name: 'Test 3'
  }]);
  const [activeChat, selectChat] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
      setUser(user);

    } else {
      const userId = prompt("Please enter your user id");
      const userName = prompt("Please enter your user name");
      const user = { userId, userName };

      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    }

    return () => {
      ws.close();
    }
  }, []);

  useEffect(() => {
    if (user) {
      ws.current = new WebSocket(`ws://localhost:5000/userId=${user.userId}`);

      ws.current.onopen = () => {
        console.log('WS connection is open');
        scrollChatToRecent();
      }

      ws.current.onmessage = ({ data }) => {
        const responseMessage = JSON.parse(data);
        if (!responseMessage) {
          return;
        }

        if (responseMessage.operation === 'MESSAGE') {
          const cachedMessages = getCachedMessages(responseMessage.chatId);
          const messages = [...cachedMessages, responseMessage];

          saveMessagesToCache(responseMessage.chatId, messages);
          setMessages(messages);
          scrollChatToRecent();
          console.log('MESSAGE', responseMessage);
        }

        if (responseMessage.operation === 'UPDATE') {
          responseMessage.messages.forEach((message) => {
            const cachedMessages = getCachedMessages(message.receiverId)
              .filter((cachedMessage) => message.messageId !== cachedMessage.messageId);

            saveMessagesToCache(message.receiverId, [...cachedMessages, message]);
          });

          scrollChatToRecent();
          console.log('UPDATE', responseMessage);
        }

        if (responseMessage.operation === 'DELIVERY') {
          console.log('DELIVERY', responseMessage);
        }
      }
    }

  }, [user, messages]);

  const scrollChatToRecent = () => {
    if (chatBoxRef && chatBoxRef.current) {
      chatBoxRef.current.scrollTo(0, chatBoxRef.current.scrollHeight);
    }
  }

  const selectActiveChat = (chatId) => {
    const messages = getCachedMessages(chatId);

    setMessages(messages);
    selectChat(chatId);
  }

  const getCachedMessages = (chatId) => {
    return JSON.parse(localStorage.getItem(`messages_${chatId}`)) || [];
  }

  const saveMessagesToCache = (chatId, messages) => {
    localStorage.setItem(`messages_${chatId}`, JSON.stringify(messages));
  }

  return (
    <div className="App">
      <div className="container">
        <div className="chat-main">
          <div className="chat-left">
            <ChatTabs
              chats={chats}
              activeChat={activeChat}
              selectActiveChat={selectActiveChat}
            />
          </div>
          <div className="chat-right">
            {activeChat &&
              <>
                <MessageViewBox
                  messages={messages}
                  childRef={chatBoxRef}
                />
                <MessageSendBox
                  activeChat={activeChat}
                  user={user}
                  ws={ws}
                />
              </>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;