/**
 * Application configuration
 */
const config = {
  // DeepSeek AI API configuration
  deepseek: {
    apiUrl: import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-bc6819a2bdcb4676987fb2bb2e054709',
    model: 'deepseek-chat', // Replace with appropriate DeepSeek model
  },
  
  // Knowledge base configuration
  knowledgeBase: {
    basePath: '/knowledge',
    categories: ['Marketing', 'Keuangan', 'Manajemen'],
    files: {
      'Marketing': ['digital_marketing.txt', 'branding.txt'],
      'Keuangan': ['investasi.txt'],
      'Manajemen': ['leadership.txt']
    }
  }
};

export default config;
