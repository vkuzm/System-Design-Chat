import { useRef } from 'react';

const MessageSendBox = ({ user, activeChat, ws }) => {
  const messageInput = useRef(null);

  const send = () => {
    const message = messageInput.current.value;

    if (user && activeChat && message.length) {
      const createdMessage = {
        senderId: user.userId,
        userName: user.userName,
        receiverId: activeChat,
        text: message
      };

      ws.current.send(JSON.stringify(createdMessage));
    }
  }

  return (
    <div className="message-send-box">
      <h2>Your username: {user.userName}</h2>
      <div className="form-group">
        <label>Message</label>
        <textarea className="form-control" ref={messageInput}></textarea>
      </div>
      <br />
      <button type="button" className="btn btn-primary" onClick={() => send()}>Send</button>
    </div>
  );
}

export default MessageSendBox;