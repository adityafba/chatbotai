/**
 * Application configuration
 */
const config = {
  // DeepSeek AI API configuration
  deepseek: {
    apiUrl: import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions',
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-bc6819a2bdcb4676987fb2bb2e054709',
    model: 'deepseek-chat', // Replace with appropriate DeepSeek model
  },
  
  // Knowledge base configuration
  knowledgeBase: {
    basePath: '/knowledge',
    categories: ['Marketing', 'Branding', 'Keuangan', 'Manajemen', 'Leadership', 'Legalitas', 'MindsetBisnis', 'Operasional', 'SDMbisnis'],
    files: {
      'Marketing': ['digital_marketing.txt', 'branding.txt'],
      'Branding': ['brandingtips.txt'],
      'Keuangan': ['keuangan.txt'],
      'Manajemen': ['manajemen.txt'],
      'Leadership': ['leadership.txt'],
      'Legalitas': ['tipslegalitas.txt'],
      'MindsetBisnis': ['mindsetbisnis.txt'],
      'Operasional': ['tipsoperasional.txt'],
      'SDMbisnis': ['sdmbisnis.txt']
    }
  }
};

export default config;
