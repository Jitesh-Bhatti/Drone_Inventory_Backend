import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';

const router = Router();

// POST /api/v1/activities (for receiving, issuing, QA, etc.)
router.post('/', ActivityController.createActivity);

// GET /api/v1/activities (for the activity log)
router.get('/', ActivityController.getAllActivities);

export { router as activityRouter };