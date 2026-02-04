import express from 'express';
import cors from 'cors';
import { projectRouter } from './routes/project.routes';
import { partRouter } from './routes/part.routes';
import { categoryRouter } from './routes/category.routes';
import { activityRouter } from './routes/activity.routes';
import { templateRouter } from './routes/template.routes';
import { userRouter } from './routes/user.routes';
import { productRouter } from './routes/product.routes';
import { errorHandler } from './middleware/errorHandler';


const app = express();

// --- Middleware ---
// Enable Cross-Origin Resource Sharing (so your React app can call the API)
app.use(cors());
// Parse incoming JSON request bodies
app.use(express.json());

// --- Routes ---
// All routes related to projects will be handled by this router
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/parts', partRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/activities', activityRouter);
app.use('/api/v1/templates', templateRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);

// --- Error Handling ---
// A custom middleware to catch errors from your services
app.use(errorHandler);

// --- Start the Server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});