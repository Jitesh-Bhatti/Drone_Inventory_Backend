import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';

const router = Router();

router.post('/', CategoryController.createCategory);
router.get('/', CategoryController.getAllCategories);
router.patch('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

export { router as categoryRouter };