import React, { useEffect } from 'react';
import styled from 'styled-components';
import config from '../config';

const ApiKeyContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin-bottom: 0.5rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusIndicator = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#4CAF50' : '#F44336'};
`;







const ApiKeyInput = () => {
  // No need for useEffect or API key handling - just a static component

  return (
    <ApiKeyContainer>
      <Title>
        <StatusIndicator active={true} />
        DeepSeek AI Status
      </Title>
      
      <p>Connected to DeepSeek AI API</p>
    </ApiKeyContainer>
  );
};

export default ApiKeyInput;
