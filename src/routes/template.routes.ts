import { Router } from 'express';
import { TemplateController } from '../controllers/template.controller';

const router = Router();

router.post('/', TemplateController.createTemplate);
router.get('/', TemplateController.getAllTemplates);

// Special route for checking availability must come before '/:id'
router.get('/:id/availability', TemplateController.checkTemplateAvailability);

router.get('/:id', TemplateController.getTemplateById);
router.patch('/:id', TemplateController.updateTemplate);
router.delete('/:id', TemplateController.deleteTemplate);

export { router as templateRouter };