import routes from './routes';
import metadataRoutes from './routes/metadataRoutes';
import { errorHandler } from './middleware/errorHandler';

// API Routes
app.use('/', routes);
app.use('/api/metadata', metadataRoutes);

// Error handler
app.use(errorHandler); 