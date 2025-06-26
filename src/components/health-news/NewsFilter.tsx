import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface NewsFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const NewsFilter: React.FC<NewsFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange
}) => {
  const { t } = useTranslation();

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health':
        return '🏥';
      case 'science':
        return '🔬';
      case 'technology':
        return '💻';
      case 'general':
      default:
        return '📰';
    }
  };

  // Get translated category name
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'health':
        return t('healthNews.categoryHealth', 'Health');
      case 'science':
        return t('healthNews.categoryScience', 'Science');
      case 'technology':
        return t('healthNews.categoryTechnology', 'Technology');
      case 'general':
        return t('healthNews.categoryGeneral', 'General');
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  return (
    <motion.div
      className="news-filter"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="filter-header">
        <h3>{t('healthNews.filterByCategory', 'Filter by Category')}</h3>
      </div>
      
      <div className="category-buttons">
        {categories.map((category) => (
          <motion.button
            key={category}
            className={`category-button ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onCategoryChange(category)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="category-icon">{getCategoryIcon(category)}</span>
            <span className="category-name">{getCategoryName(category)}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default NewsFilter;
