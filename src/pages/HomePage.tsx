import PersonalizedRecommendations from '../components/recommendations/PersonalizedRecommendations';
import RecommendationsList from '../components/recommendations/RecommendationsList';
import { RecommendationType } from '../services/recommendation.service';

// Inside the render, after the featured content section and before the features section
      {/* Featured Content Section - Only shown when content is available */}
      {featuredContent.length > 0 && (
        <Container maxWidth="lg" sx={{ mb: 8 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
            Featured Films
          </Typography>
          <Grid container spacing={4}>
            {featuredContent.map((content) => (
              <Grid item xs={12} sm={6} md={4} key={content.id}>
                <Card 
                  elevation={0}
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <CardActionArea 
                    component={Link} 
                    to={`/marketplace/${content.id}`}
                    sx={{ height: '100%' }}
                  >
                    <CardMedia
                      component="img"
                      height="300"
                      image={content.imageUrl}
                      alt={content.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Typography variant="h6" gutterBottom noWrap>
                        {content.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        by {content.creator}
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {content.price}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {/* Personalized Recommendations Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <PersonalizedRecommendations 
          showReasons={true}
          fallbackToTrending={true}
          maxItems={6}
        />
      </Container>

      {/* New Releases Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <RecommendationsList
          title="New Releases"
          type={RecommendationType.NEW_RELEASES}
          maxItems={6}
          showViewAllLink={true}
          viewAllUrl="/discover?filter=new"
        />
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Grid container spacing={4}> 