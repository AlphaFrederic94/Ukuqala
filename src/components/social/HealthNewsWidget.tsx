import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ExternalLink, RefreshCw, AlertTriangle, Newspaper } from 'lucide-react';
import { MOCK_NEWS_ARTICLES } from '../health-news/MockNewsData';

// News API key
const NEWS_API_KEY = '28bb9dbf87b34e54b430bbfeff6d9b37';

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

const HealthNewsWidget: React.FC = () => {
  const { t } = useTranslation();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showNewContentBadge, setShowNewContentBadge] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(300); // 5 minutes in seconds

  // Fetch news from the API
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get top health headlines
      const url = `https://newsapi.org/v2/top-headlines?category=health&language=en&pageSize=5&apiKey=${NEWS_API_KEY}`;

      console.log('Fetching health news for social page');

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'ok') {
        // Check if we have new content
        const oldTitles = news.map(article => article.title);
        const hasNewContent = data.articles?.some(article => !oldTitles.includes(article.title));

        setNews(data.articles || []);
        setLastUpdated(new Date());
        setUsingMockData(false);

        // Show new content badge if we have new articles
        if (hasNewContent && lastUpdated !== null) {
          setShowNewContentBadge(true);
          // Hide the badge after 5 seconds
          setTimeout(() => setShowNewContentBadge(false), 5000);
        }
      } else {
        console.error('News API error:', data.message || 'Unknown error');
        console.log('Using mock data as fallback');
        setNews(MOCK_NEWS_ARTICLES.slice(0, 5));
        setLastUpdated(new Date());
        setUsingMockData(true);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      console.log('Using mock data as fallback due to error');
      setNews(MOCK_NEWS_ARTICLES.slice(0, 5));
      setLastUpdated(new Date());
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh every 5 minutes
  useEffect(() => {
    try {
      fetchNews();
      setRefreshCountdown(300); // Reset to 5 minutes

      // Set up auto-refresh every 5 minutes
      const refreshInterval = setInterval(() => {
        console.log('Auto-refreshing health news...');
        fetchNews();
        setRefreshCountdown(300); // Reset countdown after refresh
      }, 5 * 60 * 1000); // 5 minutes in milliseconds

      // Set up countdown timer
      const countdownInterval = setInterval(() => {
        setRefreshCountdown(prev => {
          if (prev <= 1) return 300; // Should never happen, but just in case
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(refreshInterval);
        clearInterval(countdownInterval);
      };
    } catch (err) {
      console.error('Error in initial news fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch news articles');
    }
  }, [fetchNews]);

  // Format the publication date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  // Format the countdown timer
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Default image if none is provided
  const defaultImage = '/images/default-news.jpg';

  return (
    <div className="health-news-widget">
      <div className="widget-header">
        <div className="widget-title">
          <Newspaper size={18} />
          <h2>{t('healthNews.title', 'Health News')}</h2>
          {showNewContentBadge && (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="new-content-badge"
            >
              {t('healthNews.new', 'New!')}
            </motion.span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`refresh-button ${loading ? 'refreshing' : ''}`}
          onClick={fetchNews}
          disabled={loading}
          aria-label={t('healthNews.refresh', 'Refresh')}
        >
          <RefreshCw size={16} />
        </motion.button>
      </div>

      {usingMockData && (
        <div className="mock-data-notice">
          <AlertTriangle size={14} />
          <span>{t('healthNews.usingMockData', 'Sample data')}</span>
        </div>
      )}

      {loading ? (
        <div className="widget-loading">
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="widget-error">
          <p>{error}</p>
        </div>
      ) : (
        <div className="news-list">
          {news.map((article, index) => (
            <a
              key={`${article.title}-${index}`}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="news-item"
            >
              <div className="news-image">
                <img
                  src={article.urlToImage || defaultImage}
                  alt={article.title}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = defaultImage;
                  }}
                />
              </div>
              <div className="news-content">
                <h3 className="news-title">{article.title}</h3>
                <div className="news-meta">
                  <span className="news-source">{article.source.name}</span>
                  <span className="news-date">{formatDate(article.publishedAt)}</span>
                </div>
              </div>
              <ExternalLink size={14} className="external-icon" />
            </a>
          ))}
        </div>
      )}

      <div className="widget-footer">
        <div className="widget-footer-content">
          <a
            href="https://newsapi.org"
            target="_blank"
            rel="noopener noreferrer"
            className="powered-by"
          >
            {t('healthNews.poweredBy', 'Powered by News API')}
          </a>

          <div className="refresh-countdown" title={t('healthNews.autoRefresh', 'Auto-refreshes in')}>
            <RefreshCw size={12} className="countdown-icon" />
            <span>{formatCountdown(refreshCountdown)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthNewsWidget;
