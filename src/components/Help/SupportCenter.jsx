import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import { 
  HelpCircle, Mail, MessageCircle, BookOpen, 
  FileText, Shield, Clock, CheckCircle, Search, Phone
} from 'lucide-react';

export default function SupportCenter({ onClose }) {
  const [activeSection, setActiveSection] = useState('help');
  const [helpArticles, setHelpArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Fetch help articles from database
  useEffect(() => {
    fetchHelpArticles();
  }, []);

  const fetchHelpArticles = async () => {
    try {
      // For now, use mock data since table might not exist
      const mockArticles = [
        {
          id: '1',
          category: 'getting-started',
          title: 'Uploading Your First File',
          content: `## How to Upload Files

### Step 1: Access the Upload Feature
- Click the "Upload" button in the dashboard
- Or drag and drop files directly

### Step 2: File Selection
- Select files from your device
- Maximum file size: 100MB
- Supported formats: PDF, DOC, TXT, Images

### Step 3: Encryption Process
- Files are automatically encrypted using homomorphic encryption
- Encryption happens client-side for maximum security
- You'll see a progress indicator

### Step 4: Verification
- Wait for file verification to complete
- Green checkmark indicates successful upload
- Files are now securely stored and searchable

### Troubleshooting
- **Upload fails**: Check file size and format
- **Slow upload**: Large files may take longer to encrypt
- **Verification failed**: Try re-uploading the file`
        },
        {
          id: '2',
          category: 'security',
          title: 'Understanding Homomorphic Encryption',
          content: `## What is Homomorphic Encryption?

Homomorphic encryption allows computations to be performed on encrypted data without decrypting it first.

### How It Protects You:
- **Privacy**: We never see your actual file content
- **Security**: Files remain encrypted during processing
- **Searchability**: You can search encrypted files safely

### Technical Details:
- Uses SEAL (Simple Encrypted Arithmetic Library)
- Supports addition and multiplication on encrypted data
- Military-grade security standards

### Benefits for You:
- Secure file sharing
- Private content analysis
- Compliance with data protection regulations`
        },
        {
          id: '3',
          category: 'troubleshooting',
          title: 'Common Upload Issues',
          content: `## Solving Upload Problems

### File Too Large
- Maximum file size: 100MB
- Solution: Compress files or split large documents

### Unsupported Format
- Supported: PDF, DOC, DOCX, TXT, PNG, JPG
- Unsupported: EXE, ZIP, DMG
- Solution: Convert to supported format

### Network Issues
- Check your internet connection
- Try refreshing the page
- Contact support if persistent`
        },
        {
          id: '4',
          category: 'security',
          title: 'Two-Factor Authentication Setup',
          content: `## Enable 2FA for Extra Security

### Why Use 2FA?
- Protects your account from unauthorized access
- Required for sensitive operations
- Adds an extra layer of security

### Setup Steps:
1. Go to Profile → Security Settings
2. Click "Two-Factor Authentication"
3. Scan QR code with Google Authenticator
4. Enter verification code
5. Save backup codes

### Recovery Options:
- Use backup codes if you lose your device
- Contact support for account recovery
- Keep your recovery codes in a safe place`
        }
      ];
      
      setHelpArticles(mockArticles);
      
      // Try to fetch from database if table exists
      const { data, error } = await supabase
        .from('help_articles')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setHelpArticles(data);
      }
    } catch (error) {
      console.error('Error fetching help articles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group articles by category
  const articlesByCategory = helpArticles.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {});

  // Filter articles based on search
  const filteredArticles = helpArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help via email',
      details: 'hemanshupatil2@gmail.com',
      responseTime: 'Within 24 hours',
      action: () => {
        window.open('mailto:hemanshupatil2@gmail.com?subject=SecureFile Support Request&body=Hello Support Team,');
        logSupportRequest('Email Support');
      }
    },
    {
      icon: Phone,
      title: 'Phone Support', 
      description: 'Call us directly',
      details: '+91 9545985937',
      responseTime: 'Available 9AM-6PM EST',
      action: () => {
        window.open('tel:+919545985937');
        logSupportRequest('Phone Support');
      }
    },
    {
      icon: MessageCircle,
      title: 'Live Chat', 
      description: 'Real-time assistance',
      details: 'Click to start chat',
      responseTime: 'Immediate',
      action: () => {
        alert('Live chat session starting... Our team will be with you shortly.');
        logSupportRequest('Live Chat');
      }
    },
    {
      icon: FileText,
      title: 'Submit Ticket',
      description: 'Detailed technical support',
      details: 'For complex issues',
      responseTime: 'Within 48 hours',
      action: () => {
        const ticketNumber = Math.random().toString(36).substr(2, 9).toUpperCase();
        alert(`Support ticket #${ticketNumber} created! We'll contact you soon.`);
        logSupportRequest('Support Ticket', ticketNumber);
      }
    }
  ];

  const logSupportRequest = async (method, ticketNumber = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('support_requests')
        .insert({
          user_id: user?.id,
          contact_method: method,
          ticket_number: ticketNumber,
          status: 'open',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging support request:', error);
      }
    } catch (error) {
      console.error('Error in support request logging:', error);
    }
  };

  const handleContactSupport = async (method) => {
    method.action();
  };

  // Article Modal Component
  const ArticleModal = ({ article, onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden border ${
          theme === 'dark'
            ? 'bg-slate-800 border-white/20'
            : 'bg-white border-gray-200'
        }`}
      >
        <div className={`p-6 border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {article.title}
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className={theme === 'dark' ? 'text-gray-400 mt-2' : 'text-gray-600 mt-2'}>
            Category: {article.category.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </p>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className={`prose max-w-none ${
            theme === 'dark' ? 'prose-invert text-gray-300' : 'text-gray-700'
          }`}>
            {article.content.split('\n').map((paragraph, index) => {
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={index} className={`text-xl font-bold mt-6 mb-3 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              } else if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className={`text-lg font-semibold mt-4 mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              } else if (paragraph.startsWith('- **')) {
                const boldText = paragraph.match(/\*\*(.*?)\*\*/);
                const normalText = paragraph.replace(/\*\*(.*?)\*\*/, '');
                return (
                  <p key={index} className="flex items-start mt-2">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>{boldText ? boldText[1] : ''}</strong>
                      {normalText.replace('- ', '')}
                    </span>
                  </p>
                );
              } else if (paragraph.startsWith('- ')) {
                return (
                  <p key={index} className="flex items-start mt-2">
                    <span className="mr-2">•</span>
                    <span>{paragraph.replace('- ', '')}</span>
                  </p>
                );
              } else if (paragraph.startsWith('###')) {
                return null; // Skip empty headers
              } else if (paragraph.trim() === '') {
                return <br key={index} />;
              } else {
                return (
                  <p key={index} className="mt-3">
                    {paragraph}
                  </p>
                );
              }
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );

  // Article Card Component
  const ArticleCard = ({ article, theme, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick(article)}
      className={`p-4 rounded-xl border cursor-pointer ${
        theme === 'dark'
          ? 'bg-white/5 border-white/10 hover:bg-white/10'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      }`}
    >
      <h5 className={`font-semibold mb-2 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {article.title}
      </h5>
      <p className={`text-sm ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {article.content.substring(0, 100)}...
      </p>
      <div className={`mt-2 px-2 py-1 rounded-full text-xs inline-block ${
        theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/15 text-blue-600'
      }`}>
        {article.category.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')}
      </div>
    </motion.div>
  );

  // Contact Section Component
  const ContactSection = ({ contactMethods, onContact, theme }) => (
    <div className="space-y-6">
      <h3 className={`text-xl font-semibold ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        Contact Support
      </h3>
      <div className="grid md:grid-cols-2 gap-6">
        {contactMethods.map((method, index) => (
          <motion.div
            key={method.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-xl border ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${
                theme === 'dark' ? 'bg-green-500/20' : 'bg-green-500/15'
              }`}>
                <method.icon className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-500'
                }`} />
              </div>
              <div>
                <h4 className={`font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {method.title}
                </h4>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {method.description}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className={`font-medium ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {method.details}
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className={`w-4 h-4 ${
                  theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'
                }`} />
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Response: {method.responseTime}
                </span>
              </div>
            </div>
            <button 
              onClick={() => onContact(method)}
              className={`w-full mt-4 py-2 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'border-green-500/50 text-green-400 hover:bg-green-500/20'
                  : 'border-green-500/30 text-green-600 hover:bg-green-500/15'
              }`}
            >
              Contact Now
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );

   return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl w-full max-w-4xl border flex flex-col ${
          theme === 'dark'
            ? 'bg-slate-800 border-white/20'
            : 'bg-white border-gray-200'
        }`}
        style={{ 
          maxHeight: '90vh',
          height: '90vh'
        }}
      >
        {/* Header with Search - FIXED HEIGHT */}
        <div className={`p-6 border-b flex-shrink-0 ${
          theme === 'dark' ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-500/15'
              }`}>
                <HelpCircle className={`w-6 h-6 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
                }`} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Help & Support
                </h2>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Get help with SecureFile
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                theme === 'dark'
                  ? 'bg-white/10 border-white/20 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        {/* Main Content Area - FLEXIBLE */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar - FIXED WIDTH */}
          <div className={`w-64 border-r flex-shrink-0 ${
            theme === 'dark' ? 'border-white/10 bg-slate-900/50' : 'border-gray-200 bg-gray-50'
          }`}>
            <nav className="p-4 space-y-2 h-full overflow-y-auto">
              <button
                onClick={() => setActiveSection('help')}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-left transition-all ${
                  activeSection === 'help'
                    ? theme === 'dark'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      : 'bg-blue-500/20 text-blue-700 border border-blue-400/30'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">Help Center</span>
              </button>
              <button
                onClick={() => setActiveSection('contact')}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-left transition-all ${
                  activeSection === 'contact'
                    ? theme === 'dark'
                      ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                      : 'bg-green-500/20 text-green-700 border border-green-400/30'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span className="font-medium">Contact Support</span>
              </button>
            </nav>
          </div>

          {/* Content Area - SCROLLABLE */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              {activeSection === 'help' && (
                <div className="space-y-6">
                  <h3 className={`text-xl font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {searchQuery ? `Search Results for "${searchQuery}"` : 'Help Center'}
                  </h3>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : searchQuery ? (
                    // Search Results
                    <div className="space-y-4">
                      {filteredArticles.length === 0 ? (
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          No articles found for "{searchQuery}"
                        </p>
                      ) : (
                        filteredArticles.map((article) => (
                          <ArticleCard 
                            key={article.id} 
                            article={article} 
                            theme={theme}
                            onClick={setSelectedArticle}
                          />
                        ))
                      )}
                    </div>
                  ) : (
                    // Categories View
                    <div className="space-y-6">
                      {Object.entries(articlesByCategory).map(([category, articles]) => (
                        <div key={category}>
                          <h4 className={`text-lg font-semibold mb-4 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {category.split('-').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {articles.map((article) => (
                              <ArticleCard 
                                key={article.id} 
                                article={article} 
                                theme={theme}
                                onClick={setSelectedArticle}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'contact' && (
                <ContactSection 
                  contactMethods={contactMethods} 
                  onContact={handleContactSupport}
                  theme={theme}
                />
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Article Modal */}
      {selectedArticle && (
        <ArticleModal 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
        />
      )}
    </div>
  );
}