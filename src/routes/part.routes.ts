import { Router } from 'express';
import { PartController } from '../controllers/part.controller';

const router = Router();

// Define the routes and map them to controller functions
router.post('/', PartController.createPart);
router.get('/', PartController.getAllParts);
router.get('/:id', PartController.getPartById);
router.patch('/:id', PartController.updatePart);
router.delete('/:id', PartController.deletePart);

export { router as partRouter };