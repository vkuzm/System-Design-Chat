const ChatTabs = ({ chats, activeChat, selectActiveChat }) => {
  return (
    <ul>
      {
        chats.map((chat) => (
          <li
            key={chat.id}
            className={activeChat === chat.id ? 'active' : ''}
            onClick={() => selectActiveChat(chat.id)}>{chat.name}</li>
        ))
      }
    </ul>
  );
}

export default ChatTabs;