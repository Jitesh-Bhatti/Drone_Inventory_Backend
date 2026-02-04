// import { PrismaClient } from '@prisma/client';
import { PrismaClient } from '../generated/prisma/client';
// Initialize a single Prisma client instance to be used by all services


interface DispatchDetails {
  dispatch_datetime: string;
  dispatch_from_location: string;
  dispatch_to_location: string;
  receiving_person_name: string;
}


const db = new PrismaClient();
/**
 * Creates a new product in a project from a template.
 * This is a transactional operation.
 * @param projectId - The UUID of the project
 *- The UUID of the template
 * @param productName - An optional custom name for the new product
 */
async function addProductFromTemplate(
  projectId: string,
  templateId: string,
  productName?: string,
) {
  // 1. Fetch the template (including its parts list) and the project
  const template = await db.product_templates.findUnique({
    where: { id: templateId },
    include: {
      // This tells Prisma to also fetch the related 'template_parts'
      // and the 'parts' data for each item
      template_parts: {
        include: {
          parts: true, // We need the part name for error messages
        },
      },
    },
  });

  const project = await db.projects.findUnique({
    where: { id: projectId },
  });

  if (!template) {
    throw new Error('Product template not found');
  }
  if (!project) {
    throw new Error('Project not found');
  }

  // 2. Check inventory availability
  const shortages = [];
  for (const item of template.template_parts) {
    const balance = await db.inventory_balances.findUnique({
      where: { part_id: item.part_id },
    });

    // Check if the balance record exists or if available stock is too low
    if (!balance || balance.available < item.quantity) {
      shortages.push({
        partId: item.part_id,
        partName: item.parts.name, // Get the name from the included part
        needed: item.quantity,
        available: balance?.available || 0,
      });
    }
  }

  // 3. If there are shortages, throw a specific error
  if (shortages.length > 0) {
    // Create a custom error object that our error handler can use
    const error: any = new Error(
      'Insufficient inventory to create product from template.'
    );
    error.statusCode = 409; // 409 Conflict (good for stock issues)
    error.data = { shortages }; // Attach the shortages array to the error
    throw error;
  }

  // 4. Run the creation as a database transaction
  // This ensures all operations succeed, or all fail together.
  // 'tx' is a special version of the Prisma client that runs all
  // queries within this single transaction.
  return db.$transaction(async (tx) => {
    
    // Step 4a: Create the new product
    const newProduct = await tx.products.create({
      data: {
        project_id: projectId,
        name: productName || template.name, // Use custom name or template name
        // 'created_at' is handled by the database default
      },
    });

    // Step 4b: Link the parts to the new product
    await tx.product_parts.createMany({
      data: template.template_parts.map((item) => ({
        product_id: newProduct.id,
        part_id: item.part_id,
        quantity: item.quantity,
      })),
    });

    // Step 4c: Create the "project-allocation" activities
    // Your database trigger will see these inserts and automatically
    // update the 'inventory_balances' table.
    await tx.activities.createMany({
      data: template.template_parts.map((item) => ({
        event_type: 'project-allocation',
        part_id: item.part_id,
        qty: item.quantity,
        actor_name: 'System', // Later, this could be the logged-in user's name
        notes: `Allocated to ${project.name} - ${newProduct.name}`,
        tags: ['project-allocation', 'template'],
        project_id: projectId,
        product_id: newProduct.id,
        // We'll skip category_name for simplicity, or you could fetch it
        category_name: item.parts.category_id || 'Unknown', 
      })),
    });

    // If all steps succeed, the transaction commits
    // and returns the new product data.
    return { success: true, product: newProduct };
  });
}

async function updateProjectStatus(
  projectId: string,
  status: 'in-progress' | 'dispatched' | 'cancelled',
  dispatchDetails?: DispatchDetails,
) {
  const project = await db.projects.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    const error: any = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Prepare the data for the update
  const updateData: any = {
    status: status,
    updated_at: new Date(),
  };

  let activityNotes = `Project status changed to "${status}"`;

  if (status === 'dispatched') {
    updateData.dispatched_at = new Date();
    if (dispatchDetails) {
      updateData.dispatch_datetime = new Date(dispatchDetails.dispatch_datetime);
      updateData.dispatch_from_location = dispatchDetails.dispatch_from_location;
      updateData.dispatch_to_location = dispatchDetails.dispatch_to_location;
      updateData.receiving_person_name = dispatchDetails.receiving_person_name;
      activityNotes += `\nDispatched to: ${dispatchDetails.dispatch_to_location}`;
    }
  } else if (status === 'cancelled') {
    updateData.cancelled_at = new Date();
  }

  // Run as a transaction to update the project AND log the activity
  return db.$transaction(async (tx) => {
    // 1. Update the project
    const updatedProject = await tx.projects.update({
      where: { id: projectId },
      data: updateData,
    });

    // 2. Log this change in the activities table
    await tx.activities.create({
      data: {
        event_type: 'project-status-change',
        actor_name: 'System', // Or the logged-in user
        notes: activityNotes,
        project_id: projectId,
        project: project.name,
        tags: ['project', 'status-change'],
      },
    });

    return updatedProject;
  });
}

async function createProject(data: {
  name: string;
  description?: string;
  assigneeIds: string[];
}) {
  return db.$transaction(async (tx) => {
    // 1. Create the project
    const newProject = await tx.projects.create({
      data: {
        name: data.name,
        description: data.description,
        status: 'in-progress',
      },
    });

    // 2. Assign users if any are provided
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      await tx.project_assignees.createMany({
        data: data.assigneeIds.map((userId) => ({
          project_id: newProject.id,
          user_id: userId,
        })),
      });
    }

    // 3. Log this action
    await tx.activities.create({
      data: {
        event_type: 'project-created',
        actor_name: 'System', // Or logged-in user
        notes: `Project "${data.name}" created`,
        project_id: newProject.id,
        project: newProject.name,
        tags: ['project', 'created'],
      },
    });

    return newProject;
  });
}

// --- READ (All) ---
async function getAllProjects() {
  return db.projects.findMany({
    where: { is_active: true },
    orderBy: {
      created_at: 'desc',
    },
    include: {
      // Include a count of products and assignees
      _count: {
        select: { products: true, project_assignees: true },
      },
    },
  });
}

// --- READ (One) ---
async function getProjectById(id: string) {
  const project = await db.projects.findUnique({
    where: { id: id },
    include: {
      // Include full details on nested items
      project_assignees: {
        include: {
          app_users: {
            select: { id: true, name: true },
          },
        },
      },
      products: {
        include: {
          product_parts: {
            include: {
              parts: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
      },
    },
  });

  if (!project) {
    const error: any = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }
  return project;
}

// --- UPDATE ---
async function updateProject(
  id: string,
  data: { name?: string; description?: string },
) {
  return db.projects.update({
    where: { id: id },
    data: {
      name: data.name,
      description: data.description,
      updated_at: new Date(),
    },
  });
}

// --- DELETE (Soft) ---
async function deleteProject(id: string) {
  // We won't delete. We'll just deactivate it.
  return db.projects.update({
    where: { id: id },
    data: {
      is_active: false,
      updated_at: new Date(),
    },
  });
}

// // --- MANAGE ASSIGNEES ---
// async function assignUserToProject(projectId: string, userId: string) {
//   return db.project_assignees.create({
//     data: {
//       project_id: projectId,
//       user_id: userId,
//     },
//   });
// }

// async function removeUserFromProject(projectId: string, userId: string) {
//   return db.project_assignees.delete({
//     where: {
//       project_id_user_id: {
//         project_id: projectId,
//         user_id: userId,
//       },
//     },
//   });
// }

// --- ADD THIS NEW FUNCTION ---
async function updateProjectTeam(projectId: string, assigneeIds: string[]) {
  return db.$transaction(async (tx) => {
    // 1. Get project info for logging
    const project = await tx.projects.findUnique({
      where: { id: projectId },
      select: { name: true },
    });
    if (!project) {
      throw new Error('Project not found');
    }

    // 2. Delete all existing assignees for this project
    await tx.project_assignees.deleteMany({
      where: { project_id: projectId },
    });

    // 3. Create the new set of assignees
    if (assigneeIds && assigneeIds.length > 0) {
      const newAssignments = assigneeIds.map((userId) => ({
        project_id: projectId,
        user_id: userId,
      }));
      await tx.project_assignees.createMany({
        data: newAssignments,
      });
    }

    // 4. Log this team change
    await tx.activities.create({
      data: {
        event_type: 'project-team-change',
        actor_name: 'System', // Or logged-in user
        notes: `Team updated for project "${project.name}"`,
        project_id: projectId,
        project: project.name,
        tags: ['project', 'team-change'],
      },
    });

    return { message: 'Project team updated successfully' };
  });
}


// --- GET PROJECT PART SUMMARY ---
async function getProjectTotalParts(projectId: string) {
  // Find the project and all its products and their parts
  const project = await db.projects.findUnique({
    where: { id: projectId },
    include: {
      products: {
        include: {
          product_parts: true,
        },
      },
    },
  });

  if (!project) {
    const error: any = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Use a simple JavaScript object to sum the totals
  const totals: Record<string, number> = {};

  project.products.forEach((product) => {
    product.product_parts.forEach((part) => {
      const { part_id, quantity } = part;
      if (totals[part_id]) {
        totals[part_id] += quantity;
      } else {
        totals[part_id] = quantity;
      }
    });
  });

  return totals;
}

// Export all your project-related service functions here
export const ProjectService = {
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
  // createProject, (you would add this function next)
  // updateProjectStatus, (and this one)
  // etc.
};