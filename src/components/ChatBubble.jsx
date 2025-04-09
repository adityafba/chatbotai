import React from 'react';
import styled from 'styled-components';

const BubbleContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  align-items: ${(props) => (props.isUser ? 'flex-end' : 'flex-start')};
`;

const Bubble = styled.div`
  max-width: 70%;
  padding: 0.8rem 1.2rem;
  border-radius: 18px;
  background-color: ${(props) => (props.isUser ? '#4a90e2' : '#f1f0f0')};
  color: ${(props) => (props.isUser ? 'white' : '#333')};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
`;

const SenderName = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.3rem;
  margin-left: ${(props) => (props.isUser ? '0' : '0.5rem')};
  margin-right: ${(props) => (props.isUser ? '0.5rem' : '0')};
`;

const ChatBubble = ({ message, isUser }) => {
  return (
    <BubbleContainer isUser={isUser}>
      <SenderName isUser={isUser}>{isUser ? 'Anda' : 'AI Assistant'}</SenderName>
      <Bubble isUser={isUser}>{message}</Bubble>
    </BubbleContainer>
  );
};

export default ChatBubble;
