import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Calendar, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

interface NewsCardProps {
  article: NewsArticle;
}

const NewsCard: React.FC<NewsCardProps> = ({ article }) => {
  const { t } = useTranslation();
  
  // Format the publication date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Default image if none is provided
  const defaultImage = '/images/default-news.jpg';
  
  return (
    <motion.div
      className="news-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="news-card-image">
        <img 
          src={article.urlToImage || defaultImage} 
          alt={article.title}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = defaultImage;
          }}
        />
        <div className="news-source">{article.source.name}</div>
      </div>
      
      <div className="news-card-content">
        <h3 className="news-title">{article.title}</h3>
        
        <p className="news-description">
          {article.description || t('healthNews.noDescription', 'No description available.')}
        </p>
        
        <div className="news-meta">
          <div className="news-date">
            <Calendar size={14} />
            <span>{formatDate(article.publishedAt)}</span>
          </div>
          
          {article.author && (
            <div className="news-author">
              <User size={14} />
              <span>{article.author}</span>
            </div>
          )}
        </div>
        
        <a 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="news-read-more"
        >
          {t('healthNews.readMore', 'Read More')}
          <ExternalLink size={14} />
        </a>
      </div>
    </motion.div>
  );
};

export default NewsCard;
