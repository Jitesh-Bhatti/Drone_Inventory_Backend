import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';

// We already wrote the service, so we just import it
const addProductFromTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Get data from the request
    const { projectId } = req.params;
    const { templateId, productName } = req.body;

    // 2. A simple validation check
    if (!templateId) {
      return res.status(400).json({ message: 'templateId is required' });
    }

    // 3. Call the Service to do the work
    const result = await ProjectService.addProductFromTemplate(
      projectId,
      templateId,
      productName
    );

    // 4. Send a success response
    return res.status(201).json(result);
  } catch (error) {
    // 5. If the service throws an error (like "Out of stock"),
    // pass it to our main error handler
    next(error);
  }
};
const updateProjectStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;
    const { status, dispatchDetails } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    if (status === 'dispatched' && !dispatchDetails) {
      return res
        .status(400)
        .json({ message: 'Dispatch details are required for dispatched status' });
    }

    const updatedProject = await ProjectService.updateProjectStatus(
      projectId,
      status,
      dispatchDetails,
    );

    res.status(200).json(updatedProject);
  } catch (error) {
    next(error);
  }
};

// ADD THESE NEW FUNCTIONS:

const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, assigneeIds = [] } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    const project = await ProjectService.createProject({
      name,
      description,
      assigneeIds,
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await ProjectService.getAllProjects();
    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const project = await ProjectService.getProjectById(id);
    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const project = await ProjectService.updateProject(id, { name, description });
    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await ProjectService.deleteProject(id);
    res.status(200).json({ message: 'Project deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

// const assignUserToProject = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { projectId } = req.params;
//     const { userId } = req.body;
//     if (!userId) {
//       return res.status(400).json({ message: 'userId is required' });
//     }
//     const assignment = await ProjectService.assignUserToProject(projectId, userId);
//     res.status(201).json(assignment);
//   } catch (error) {
//     next(error);
//   }
// };

// const removeUserFromProject = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { projectId, userId } = req.params;
//     await ProjectService.removeUserFromProject(projectId, userId);
//     res.status(200).json({ message: 'User removed from project' });
//   } catch (error) {
//     next(error);
//   }
// };

// ... (all your other project controller functions are here) ...

// --- DELETE these two functions ---
// const assignUserToProject = async (...) => { ... }
// const removeUserFromProject = async (...) => { ... }

// --- ADD THIS NEW FUNCTION ---
const updateProjectTeam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;
    const { assigneeIds } = req.body; // Expect an array of user IDs

    if (!Array.isArray(assigneeIds)) {
      return res
        .status(400)
        .json({ message: 'assigneeIds must be an array' });
    }

    const result = await ProjectService.updateProjectTeam(projectId, assigneeIds);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ADD THIS NEW FUNCTION:
const getProjectTotalParts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params; // Project ID from URL
    const totals = await ProjectService.getProjectTotalParts(id);
    res.status(200).json(totals);
  } catch (error) {
    next(error);
  }
};

export const ProjectController = {
  addProductFromTemplate,
  updateProjectStatus,
  createProject, // <-- ADD THIS
  getAllProjects, // <-- ADD THIS
  getProjectById, // <-- ADD THIS
  updateProject, // <-- ADD THIS
  deleteProject, // <-- ADD THIS
  // assignUserToProject, // <-- ADD THIS
  // removeUserFromProject, // <-- ADD THIS
  updateProjectTeam,
  getProjectTotalParts,
};