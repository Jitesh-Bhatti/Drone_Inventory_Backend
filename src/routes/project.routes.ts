import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { ProductController } from '../controllers/product.controller';

const router = Router();


// --- Core Project Routes ---
router.post('/', ProjectController.createProject);
router.get('/', ProjectController.getAllProjects);
router.get('/:id', ProjectController.getProjectById);
router.patch('/:id', ProjectController.updateProject);
router.delete('/:id', ProjectController.deleteProject);


// --- Helper/Summary Route ---
router.get('/:id/part-summary', ProjectController.getProjectTotalParts); // <-- ADD THIS

// --- Project Assignees ---
// router.post('/:projectId/assignees', ProjectController.assignUserToProject);
// router.delete(
//   '/:projectId/assignees/:userId',
//   ProjectController.removeUserFromProject,
// );

// ... (all your other project routes are here) ...

// --- Project Assignees ---
// DELETE these two lines:
// router.post('/:projectId/assignees', ProjectController.assignUserToProject);
// router.delete('/:projectId/assignees/:userId', ProjectController.removeUserFromProject);

// ADD THIS NEW LINE:
router.patch('/:projectId/team', ProjectController.updateProjectTeam);

// --- Product/Part Management ---
// ... (product routes are here) ...

// This tells Express:
// When a POST request comes to '/:projectId/products-from-template',
// execute the 'addProductFromTemplate' function from our controller.
router.post(
  '/:projectId/products-from-template',
  ProjectController.addProductFromTemplate
);

router.patch('/:projectId/status', ProjectController.updateProjectStatus);
// You will add other project routes here later
// router.get('/', ProjectController.getAllProjects);
// router.post('/', ProjectController.createProject);


// ADD THIS NEW LINE FOR CREATING AN EMPTY PRODUCT:
router.post('/:projectId/products', ProductController.createProduct);

export { router as projectRouter };