import axios from 'axios';
import config from '../config';

/**
 * Utility functions for handling knowledge base operations
 */
const knowledgeBaseUtils = {
  /**
   * Load all knowledge base files for a specific category
   * @param {string} category - Category name (e.g., 'Marketing', 'Branding', 'Keuangan')
   * @returns {Promise<string>} - Combined content from all knowledge base files
   */
  loadKnowledgeBase: async (category) => {
    try {
      // Get files for the selected category from config
      const categoryFiles = config.knowledgeBase.files;

      // Get files for the selected category
      const files = categoryFiles[category] || [];
      
      if (files.length === 0) {
        console.warn(`No knowledge base files found for category: ${category}`);
        return `No knowledge base files found for category: ${category}`;
      }

      // Load all files content
      const fileContents = await Promise.all(
        files.map(async (fileName) => {
          try {
            const response = await axios.get(`${config.knowledgeBase.basePath}/${category}/${fileName}`);
            console.log(`Successfully loaded file: ${category}/${fileName}`);
            return response.data;
          } catch (error) {
            console.error(`Error loading file ${category}/${fileName}:`, error);
            // Try alternative path (for backward compatibility)
            try {
              const response = await axios.get(`/knowledge/${category}/${fileName}`);
              console.log(`Successfully loaded file from alternative path: /knowledge/${category}/${fileName}`);
              return response.data;
            } catch (altError) {
              console.error(`Error loading file from alternative path: /knowledge/${category}/${fileName}`, altError);
              return '';
            }
          }
        })
      );

      // Filter out empty contents
      const validContents = fileContents.filter(content => content.length > 0);
      
      if (validContents.length === 0) {
        console.warn(`No valid content found in knowledge base files for category: ${category}`);
        return `No valid content found in knowledge base files for category: ${category}`;
      }

      // Combine all file contents
      return validContents.join('\n\n');
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      return 'Error loading knowledge base.';
    }
  },

  /**
   * Load knowledge base from multiple categories based on query relevance
   * @param {string} query - User's question
   * @returns {Promise<{content: string, categories: string[]}>} - Combined content and categories used
   */
  loadRelevantKnowledgeBase: async (query) => {
    try {
      const queryLower = query.toLowerCase();
      const allCategories = config.knowledgeBase.categories;
      
      // Determine relevant categories based on query keywords
      const relevantCategories = allCategories.filter(category => {
        // Check if category name appears in the query
        return queryLower.includes(category.toLowerCase());
      });
      
      // If no direct category matches, use all categories or a subset based on common business terms
      const categoriesToUse = relevantCategories.length > 0 ? 
        relevantCategories : 
        determineRelevantCategoriesByKeywords(query, allCategories);
      
      // Load content from all relevant categories
      const contentPromises = categoriesToUse.map(category => 
        knowledgeBaseUtils.loadKnowledgeBase(category)
      );
      
      const contents = await Promise.all(contentPromises);
      
      // Combine all contents
      return {
        content: contents.join('\n\n'),
        categories: categoriesToUse
      };
    } catch (error) {
      console.error('Error loading relevant knowledge base:', error);
      return {
        content: 'Error loading knowledge base.',
        categories: []
      };
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
          
          // Boost score for exact phrase matches
          if (paragraphLower.includes(queryLower)) {
            score += 3;
          }
          
          // Boost score for title or heading matches
          if (paragraph.startsWith('#') && paragraphLower.includes(word)) {
            score += 2;
          }
        }
      });
      
      return { paragraph, score };
    });
    
    // Sort paragraphs by score (highest first)
    scoredParagraphs.sort((a, b) => b.score - a.score);
    
    // Get top 3 paragraphs if they have a score > 0
    const topParagraphs = scoredParagraphs
      .filter(item => item.score > 0)
      .slice(0, 3)
      .map(item => item.paragraph);
    
    // Return the highest scoring paragraphs or a default message
    if (topParagraphs.length > 0) {
      return topParagraphs.join('\n\n');
    } else {
      return "Maaf, saya tidak menemukan informasi yang relevan dengan pertanyaan Anda dalam basis pengetahuan saat ini.";
    }
  }
};

/**
 * Helper function to determine relevant categories based on keywords in the query
 * @param {string} query - User's question
 * @param {string[]} allCategories - All available categories
 * @returns {string[]} - List of relevant categories
 */
function determineRelevantCategoriesByKeywords(query, allCategories) {
  const queryLower = query.toLowerCase();
  
  // Define keyword mappings to categories
  const keywordToCategoryMap = {
    // Marketing related keywords
    'marketing': 'Marketing',
    'promosi': 'Marketing',
    'iklan': 'Marketing',
    'digital': 'Marketing',
    'sosial media': 'Marketing',
    'pasar': 'Marketing',
    
    // Branding related keywords
    'brand': 'Branding',
    'merek': 'Branding',
    'logo': 'Branding',
    'identitas': 'Branding',
    
    // Finance related keywords
    'keuangan': 'Keuangan',
    'uang': 'Keuangan',
    'investasi': 'Keuangan',
    'modal': 'Keuangan',
    'biaya': 'Keuangan',
    'harga': 'Keuangan',
    
    // Management related keywords
    'manajemen': 'Manajemen',
    'kelola': 'Manajemen',
    'mengatur': 'Manajemen',
    'strategi': 'Manajemen',
    
    // Leadership related keywords
    'leadership': 'Leadership',
    'pemimpin': 'Leadership',
    'memimpin': 'Leadership',
    'kepemimpinan': 'Leadership',
    
    // Legal related keywords
    'legal': 'Legalitas',
    'hukum': 'Legalitas',
    'izin': 'Legalitas',
    'perizinan': 'Legalitas',
    
    // Business mindset related keywords
    'mindset': 'MindsetBisnis',
    'pola pikir': 'MindsetBisnis',
    'mental': 'MindsetBisnis',
    
    // Operations related keywords
    'operasi': 'Operasional',
    'operasional': 'Operasional',
    'proses': 'Operasional',
    'produksi': 'Operasional',
    
    // HR related keywords
    'sdm': 'SDMbisnis',
    'karyawan': 'SDMbisnis',
    'pegawai': 'SDMbisnis',
    'rekrut': 'SDMbisnis',
    'sumber daya': 'SDMbisnis'
  };
  
  // Find matching categories based on keywords
  const matchedCategories = new Set();
  
  // Check each keyword in the map against the query
  Object.entries(keywordToCategoryMap).forEach(([keyword, category]) => {
    if (queryLower.includes(keyword) && allCategories.includes(category)) {
      matchedCategories.add(category);
    }
  });
  
  // If no matches found, return a default set of categories
  if (matchedCategories.size === 0) {
    // Return a subset of general business categories
    return ['MindsetBisnis', 'Manajemen', 'Marketing'].filter(cat => 
      allCategories.includes(cat)
    );
  }
  
  return Array.from(matchedCategories);
}

export default knowledgeBaseUtils;
