import axios from 'axios';
import config from '../config';

/**
 * Utility functions for handling knowledge base operations
 */
const knowledgeBaseUtils = {
  /**
   * Load all knowledge base files for a specific category
   * @param {string} category - Category name (e.g., 'Marketing', 'Keuangan', 'Manajemen')
   * @returns {Promise<string>} - Combined content from all knowledge base files
   */
  loadKnowledgeBase: async (category) => {
    try {
      // Get files for the selected category from config
      const categoryFiles = config.knowledgeBase.files;

      // Get files for the selected category
      const files = categoryFiles[category] || [];
      
      if (files.length === 0) {
        return `No knowledge base files found for category: ${category}`;
      }

      // Load all files content
      const fileContents = await Promise.all(
        files.map(async (fileName) => {
          try {
            const response = await axios.get(`/knowledge/${category}/${fileName}`);
            return response.data;
          } catch (error) {
            console.error(`Error loading file ${fileName}:`, error);
            return '';
          }
        })
      );

      // Combine all file contents
      return fileContents.join('\n\n');
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      return 'Error loading knowledge base.';
    }
  },

  /**
   * Simple text-based search when DeepSeek API is not available
   * @param {string} query - User's question
   * @param {string} knowledgeBaseContent - Content from knowledge base files
   * @returns {string} - Best matching content
   */
  simpleTextSearch: (query, knowledgeBaseContent) => {
    // Split knowledge base into paragraphs
    const paragraphs = knowledgeBaseContent.split('\n\n');
    
    // Convert query to lowercase for case-insensitive matching
    const queryLower = query.toLowerCase();
    
    // Find paragraphs that contain any word from the query
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 3);
    
    // Score each paragraph based on how many query words it contains
    const scoredParagraphs = paragraphs.map(paragraph => {
      const paragraphLower = paragraph.toLowerCase();
      let score = 0;
      
      // Count how many query words appear in the paragraph
      queryWords.forEach(word => {
        if (paragraphLower.includes(word)) {
          score += 1;
        }
      });
      
      return { paragraph, score };
    });
    
    // Sort paragraphs by score (highest first)
    scoredParagraphs.sort((a, b) => b.score - a.score);
    
    // Return the highest scoring paragraph or a default message
    if (scoredParagraphs.length > 0 && scoredParagraphs[0].score > 0) {
      return scoredParagraphs[0].paragraph;
    } else {
      return "Maaf, saya tidak menemukan informasi yang relevan dengan pertanyaan Anda dalam basis pengetahuan saat ini.";
    }
  }
};

export default knowledgeBaseUtils;
