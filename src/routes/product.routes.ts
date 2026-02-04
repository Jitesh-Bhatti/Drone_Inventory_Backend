import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();

// Routes for a specific product
router.patch('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

// --- Routes for parts within a product ---
router.post('/:id/parts', ProductController.addPartToProduct);
router.patch('/:id/parts/:partId', ProductController.updatePartInProduct);
router.delete('/:id/parts/:partId', ProductController.removePartFromProduct);

export { router as productRouter };