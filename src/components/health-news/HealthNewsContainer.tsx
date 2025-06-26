import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, Filter, RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react';
import NewsCard from './NewsCard';
import NewsFilter from './NewsFilter';
import { MOCK_NEWS_ARTICLES } from './MockNewsData';

// News API key
const NEWS_API_KEY = '28bb9dbf87b34e54b430bbfeff6d9b37';

// News categories
const NEWS_CATEGORIES = [
  'general',
  'health',
  'science',
  'technology'
];

interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

const HealthNewsContainer: React.FC = () => {
  const { t } = useTranslation();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('health');
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  // Fetch news from the API
  const fetchNews = useCallback(async (category: string = 'health', query: string = '') => {
    setLoading(true);
    setError(null);

    try {
      let url = '';

      if (query) {
        // Search for specific query
        url = `https://newsapi.org/v2/everything?q=${query}+health&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
      } else {
        // Get top headlines by category
        url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&apiKey=${NEWS_API_KEY}`;
      }

      console.log('Fetching news from URL:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('News API response:', data);

      if (data.status === 'ok') {
        setNews(data.articles || []);
        setFilteredNews(data.articles || []);
        setLastUpdated(new Date());
        setUsingMockData(false);
      } else {
        console.error('News API error:', data.message || 'Unknown error');
        console.log('Using mock data as fallback');
        setNews(MOCK_NEWS_ARTICLES);
        setFilteredNews(MOCK_NEWS_ARTICLES);
        setLastUpdated(new Date());
        setUsingMockData(true);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      console.log('Using mock data as fallback due to error');
      setNews(MOCK_NEWS_ARTICLES);
      setFilteredNews(MOCK_NEWS_ARTICLES);
      setLastUpdated(new Date());
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Initial fetch
  useEffect(() => {
    try {
      fetchNews(selectedCategory);
    } catch (err) {
      console.error('Error in initial news fetch:', err);
      setError(err instanceof Error ? err.message : t('healthNews.errorFetching', 'Failed to fetch news articles'));
    }
  }, [fetchNews, selectedCategory, t]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchNews(selectedCategory, searchQuery);
    } else {
      fetchNews(selectedCategory);
    }
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery('');
    fetchNews(category);
    setShowFilters(false);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchNews(selectedCategory, searchQuery);
  };

  return (
    <div className="health-news-container">
      <div className="news-controls">
        <form onSubmit={handleSearch} className="news-search">
          <div className="search-input-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('healthNews.searchPlaceholder', 'Search health topics...')}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <Search size={18} />
            </button>
          </div>
        </form>

        <div className="news-actions">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="action-button"
            onClick={() => setShowFilters(!showFilters)}
            aria-label={t('healthNews.filter', 'Filter')}
          >
            <Filter size={18} />
            <span>{t('healthNews.filter', 'Filter')}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="action-button"
            onClick={handleRefresh}
            aria-label={t('healthNews.refresh', 'Refresh')}
          >
            <RefreshCw size={18} />
            <span>{t('healthNews.refresh', 'Refresh')}</span>
          </motion.button>
        </div>
      </div>

      {showFilters && (
        <NewsFilter
          categories={NEWS_CATEGORIES}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}

      {lastUpdated && (
        <div className="last-updated">
          {t('healthNews.lastUpdated', 'Last updated')}: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {usingMockData && (
        <motion.div
          className="mock-data-warning"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AlertTriangle size={18} />
          <span>{t('healthNews.mockDataWarning', 'Using sample data. News API may be unavailable.')}</span>
        </motion.div>
      )}

      {loading ? (
        <div className="news-loading">
          <div className="loading-spinner"></div>
          <p>{t('healthNews.loading', 'Loading health news...')}</p>
        </div>
      ) : error ? (
        <div className="news-error">
          <AlertCircle size={24} />
          <p>{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="retry-button"
            onClick={handleRefresh}
          >
            {t('healthNews.retry', 'Retry')}
          </motion.button>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="no-news">
          <p>{t('healthNews.noResults', 'No news articles found.')}</p>
        </div>
      ) : (
        <div className="news-grid">
          {filteredNews.map((article, index) => (
            <NewsCard key={`${article.title}-${index}`} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthNewsContainer;
