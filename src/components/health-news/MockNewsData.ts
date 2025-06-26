// Mock news data to use as a fallback when the News API is unavailable
export const MOCK_NEWS_ARTICLES = [
  {
    source: {
      id: "mock-1",
      name: "Health Journal"
    },
    author: "Dr. Jane Smith",
    title: "New Study Shows Benefits of Mediterranean Diet for Heart Health",
    description: "A comprehensive study has found that following a Mediterranean diet can significantly reduce the risk of heart disease and stroke.",
    url: "#",
    urlToImage: "/images/default-news.jpg",
    publishedAt: new Date().toISOString(),
    content: "Researchers have found that a diet rich in olive oil, nuts, fruits, vegetables, and fish can reduce cardiovascular risks by up to 30%."
  },
  {
    source: {
      id: "mock-2",
      name: "Medical News Today"
    },
    author: "Dr. Michael Johnson",
    title: "Breakthrough in Alzheimer's Research Offers New Hope",
    description: "Scientists have identified a new biomarker that could lead to earlier diagnosis and better treatment options for Alzheimer's disease.",
    url: "#",
    urlToImage: "/images/default-news.jpg",
    publishedAt: new Date().toISOString(),
    content: "The newly discovered biomarker appears in blood tests up to 10 years before symptoms begin, potentially allowing for much earlier intervention."
  },
  {
    source: {
      id: "mock-3",
      name: "Wellness Weekly"
    },
    author: "Sarah Thompson",
    title: "The Importance of Sleep for Mental Health",
    description: "New research highlights the critical role that quality sleep plays in maintaining good mental health and cognitive function.",
    url: "#",
    urlToImage: "/images/default-news.jpg",
    publishedAt: new Date().toISOString(),
    content: "Studies show that consistent, quality sleep of 7-9 hours per night can significantly reduce anxiety, depression, and improve overall brain function."
  },
  {
    source: {
      id: "mock-4",
      name: "Nutrition Science"
    },
    author: "Dr. Robert Chen",
    title: "The Role of Gut Health in Overall Wellness",
    description: "Emerging research continues to show the importance of gut microbiome health for immunity, mental health, and disease prevention.",
    url: "#",
    urlToImage: "/images/default-news.jpg",
    publishedAt: new Date().toISOString(),
    content: "Scientists now believe that maintaining a healthy gut microbiome may be one of the most important factors in preventing a wide range of diseases."
  },
  {
    source: {
      id: "mock-5",
      name: "Fitness Today"
    },
    author: "Alex Rodriguez",
    title: "Short, Intense Workouts Show Same Benefits as Longer Exercise Sessions",
    description: "Research confirms that high-intensity interval training (HIIT) can provide similar health benefits to longer, moderate exercise in less time.",
    url: "#",
    urlToImage: "/images/default-news.jpg",
    publishedAt: new Date().toISOString(),
    content: "Just 20 minutes of HIIT three times a week can improve cardiovascular health, insulin sensitivity, and help with weight management."
  },
  {
    source: {
      id: "mock-6",
      name: "Global Health Initiative"
    },
    author: "Dr. Lisa Wong",
    title: "Advances in Vaccine Technology Promise Better Protection Against Viruses",
    description: "New mRNA vaccine technology is being adapted to fight a wider range of infectious diseases with greater effectiveness.",
    url: "#",
    urlToImage: "/images/default-news.jpg",
    publishedAt: new Date().toISOString(),
    content: "The success of mRNA vaccines for COVID-19 has accelerated research into using this technology for influenza, HIV, and even certain types of cancer."
  }
];
