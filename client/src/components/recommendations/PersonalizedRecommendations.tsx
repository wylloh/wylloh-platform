import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import RecommendationsList, { RecommendationItem } from './RecommendationsList';

interface PersonalizedRecommendationsProps {
  userId?: string;
  maxItems?: number;
  onItemClick?: (item: RecommendationItem) => void;
  onPlayClick?: (item: RecommendationItem) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`recommendation-tabpanel-${index}`}
      aria-labelledby={`recommendation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  userId,
  maxItems = 8,
  onItemClick,
  onPlayClick,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for different recommendation categories
  const mockRecommendations: Record<string, RecommendationItem[]> = {
    forYou: [
      {
        id: 'rec-1',
        title: 'The Filmmaker\'s Journey',
        description: 'An inspiring documentary about independent filmmakers breaking into Hollywood.',
        thumbnail: 'https://via.placeholder.com/300x400/1976d2/ffffff?text=Filmmaker%27s+Journey',
        genre: ['Documentary', 'Biography'],
        rating: 4.7,
        duration: '2h 15m',
        year: 2023,
        director: 'Sarah Chen',
        type: 'documentary',
        price: 12.99,
      },
      {
        id: 'rec-2',
        title: 'Digital Dreams',
        description: 'A sci-fi thriller exploring the intersection of technology and creativity.',
        thumbnail: 'https://via.placeholder.com/300x400/7c3aed/ffffff?text=Digital+Dreams',
        genre: ['Sci-Fi', 'Thriller'],
        rating: 4.3,
        duration: '1h 58m',
        year: 2024,
        director: 'Marcus Rodriguez',
        type: 'movie',
        price: 15.99,
      },
    ],
    trending: [
      {
        id: 'trend-1',
        title: 'Blockchain Chronicles',
        description: 'A deep dive into the world of decentralized technology and its impact on media.',
        thumbnail: 'https://via.placeholder.com/300x400/059669/ffffff?text=Blockchain+Chronicles',
        genre: ['Documentary', 'Technology'],
        rating: 4.5,
        duration: '1h 45m',
        year: 2024,
        director: 'Alex Thompson',
        type: 'documentary',
        price: 9.99,
      },
      {
        id: 'trend-2',
        title: 'The Creator\'s Dilemma',
        description: 'A thought-provoking drama about artists navigating the digital age.',
        thumbnail: 'https://via.placeholder.com/300x400/dc2626/ffffff?text=Creator%27s+Dilemma',
        genre: ['Drama', 'Art'],
        rating: 4.2,
        duration: '2h 8m',
        year: 2023,
        director: 'Emma Wilson',
        type: 'movie',
        price: 14.99,
      },
    ],
    newReleases: [
      {
        id: 'new-1',
        title: 'Future of Film',
        description: 'Exploring how emerging technologies are reshaping the film industry.',
        thumbnail: 'https://via.placeholder.com/300x400/ea580c/ffffff?text=Future+of+Film',
        genre: ['Documentary', 'Technology'],
        rating: 4.6,
        duration: '1h 52m',
        year: 2024,
        director: 'David Park',
        type: 'documentary',
        price: 11.99,
      },
      {
        id: 'new-2',
        title: 'Indie Revolution',
        description: 'The story of how independent filmmakers are changing Hollywood.',
        thumbnail: 'https://via.placeholder.com/300x400/7c2d12/ffffff?text=Indie+Revolution',
        genre: ['Documentary', 'Biography'],
        rating: 4.4,
        duration: '2h 22m',
        year: 2024,
        director: 'Lisa Chang',
        type: 'documentary',
        price: 13.99,
      },
    ],
    watchAgain: [
      {
        id: 'watch-1',
        title: 'The Art of Storytelling',
        description: 'A masterclass in narrative techniques from legendary filmmakers.',
        thumbnail: 'https://via.placeholder.com/300x400/1e40af/ffffff?text=Art+of+Storytelling',
        genre: ['Documentary', 'Education'],
        rating: 4.8,
        duration: '3h 15m',
        year: 2022,
        director: 'Robert Martinez',
        type: 'documentary',
        isOwned: true,
      },
      {
        id: 'watch-2',
        title: 'Cinema Verite',
        description: 'An exploration of documentary filmmaking and its impact on society.',
        thumbnail: 'https://via.placeholder.com/300x400/be185d/ffffff?text=Cinema+Verite',
        genre: ['Documentary', 'History'],
        rating: 4.5,
        duration: '2h 35m',
        year: 2021,
        director: 'Jennifer Lee',
        type: 'documentary',
        isOwned: true,
      },
    ],
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getCurrentRecommendations = (): RecommendationItem[] => {
    const categories = ['forYou', 'trending', 'newReleases', 'watchAgain'];
    const currentCategory = categories[tabValue];
    return mockRecommendations[currentCategory] || [];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Personalized for You
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="personalized recommendations tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="For You" />
          <Tab label="Trending" />
          <Tab label="New Releases" />
          <Tab label="Watch Again" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <RecommendationsList
          recommendations={getCurrentRecommendations()}
          maxItems={maxItems}
          onItemClick={onItemClick}
          onPlayClick={onPlayClick}
          showActions={true}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <RecommendationsList
          recommendations={getCurrentRecommendations()}
          maxItems={maxItems}
          onItemClick={onItemClick}
          onPlayClick={onPlayClick}
          showActions={true}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <RecommendationsList
          recommendations={getCurrentRecommendations()}
          maxItems={maxItems}
          onItemClick={onItemClick}
          onPlayClick={onPlayClick}
          showActions={true}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <RecommendationsList
          recommendations={getCurrentRecommendations()}
          maxItems={maxItems}
          onItemClick={onItemClick}
          onPlayClick={onPlayClick}
          showActions={true}
        />
      </TabPanel>
    </Box>
  );
};

export default PersonalizedRecommendations; 