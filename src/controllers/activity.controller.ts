import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service';

// Controller for POST /activities
const createActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { event_type, actor_name } = req.body;
    if (!event_type || !actor_name) {
      return res.status(400).json({ message: 'event_type and actor_name are required' });
    }
    
    // The service just creates the activity.
    // The database trigger handles all the inventory math.
    const newActivity = await ActivityService.createActivity(req.body);
    res.status(201).json(newActivity);
  } catch (error) {
    next(error);
  }
};

// Controller for GET /activities
const getAllActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Read pagination values from query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await ActivityService.getAllActivities(page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const ActivityController = {
  createActivity,
  getAllActivities,
};