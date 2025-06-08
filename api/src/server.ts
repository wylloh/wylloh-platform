import express from 'express';
import routes from './routes';
import metadataRoutes from './routes/metadataRoutes';
import { errorHandler } from './middleware/errorHandler';

const app: express.Application = express();

// API Routes
app.use('/', routes);
app.use('/api/metadata', metadataRoutes);

// Error handler
app.use(errorHandler);

export default app; 