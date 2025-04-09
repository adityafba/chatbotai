import React from 'react';
import styled from 'styled-components';
import config from '../config';

const CategoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 1rem;
  text-align: center;
`;

const CategoryButton = styled.button`
  padding: 0.8rem 1.5rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;

  &:hover {
    background-color: #357abD;
  }

  &.active {
    background-color: #2a5298;
  }
`;

const CategorySelection = ({ onSelectCategory, selectedCategory }) => {
  const categories = config.knowledgeBase.categories;

  return (
    <CategoryContainer>
      <Title>Pilih Kategori</Title>
      {categories.map((category) => (
        <CategoryButton
          key={category}
          onClick={() => onSelectCategory(category)}
          className={selectedCategory === category ? 'active' : ''}
        >
          {category}
        </CategoryButton>
      ))}
    </CategoryContainer>
  );
};

export default CategorySelection;
