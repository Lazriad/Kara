import React from 'react';

function MessageList({ messages, currentUserId }) {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <div key={message.id} className={`message ${message.sender_id === currentUserId ? 'sent' : 'received'}`}>
          <p>{message.message_text}</p>
          <small>{new Date(message.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}

export default MessageList;