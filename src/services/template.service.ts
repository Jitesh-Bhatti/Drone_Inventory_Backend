import { PrismaClient } from '../generated/prisma/client'; // Use your custom path
const db = new PrismaClient();

// Interface for the part list we expect from the frontend
interface TemplatePartInput {
  part_id: string;
  quantity: number;
}

// --- CREATE ---
async function createTemplate(
  name: string,
  description: string | undefined,
  partsList: TemplatePartInput[],
) {
  // We use a transaction to create the template AND its parts list together.
  // If one part fails, the whole operation is rolled back.
  return db.$transaction(async (tx) => {
    // 1. Create the main template
    const newTemplate = await tx.product_templates.create({
      data: {
        name: name,
        description: description,
      },
    });

    // 2. If a parts list was provided, create the 'template_parts'
    if (partsList && partsList.length > 0) {
      await tx.template_parts.createMany({
        data: partsList.map((part) => ({
          template_id: newTemplate.id,
          part_id: part.part_id,
          quantity: part.quantity,
        })),
      });
    }

    // 3. Return the complete template data
    return tx.product_templates.findUnique({
      where: { id: newTemplate.id },
      include: { template_parts: true },
    });
  });
}

// --- READ (All) ---
async function getAllTemplates() {
  return db.product_templates.findMany({
    where: { is_active: true },
    include: {
      // Include the count of how many parts are in the template
      _count: {
        select: { template_parts: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

// --- READ (One) ---
async function getTemplateById(id: string) {
  const template = await db.product_templates.findUnique({
    where: { id: id },
    include: {
      // Include the full parts list, with part details (name, sku)
      template_parts: {
        include: {
          parts: {
            select: { name: true, sku: true },
          },
        },
      },
    },
  });

  if (!template) {
    const error: any = new Error('Template not found');
    error.statusCode = 404;
    throw error;
  }
  return template;
}

// --- UPDATE ---
async function updateTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    is_active?: boolean;
    partsList?: TemplatePartInput[];
  },
) {
  return db.$transaction(async (tx) => {
    // 1. Update the main template details (name, description, etc.)
    const updatedTemplate = await tx.product_templates.update({
      where: { id: id },
      data: {
        name: data.name,
        description: data.description,
        is_active: data.is_active,
        updated_at: new Date(), // Manually set 'updated_at'
      },
    });

    // 2. If a new partsList is provided, replace the old one
    if (data.partsList) {
      // Delete all existing parts for this template
      await tx.template_parts.deleteMany({
        where: { template_id: id },
      });
      // Create the new parts list
      await tx.template_parts.createMany({
        data: data.partsList.map((part) => ({
          template_id: id,
          part_id: part.part_id,
          quantity: part.quantity,
        })),
      });
    }

    // 3. Return the fully updated template
    return tx.product_templates.findUnique({
      where: { id: id },
      include: { template_parts: true },
    });
  });
}

// --- DELETE (Soft) ---
async function deleteTemplate(id: string) {
  await db.product_templates.update({
    where: { id: id },
    data: { is_active: false },
  });
  return { message: 'Template deactivated successfully' };
}

// --- CHECK AVAILABILITY ---
async function checkTemplateAvailability(id: string) {
  const template = await getTemplateById(id);
  const shortages = [];

  for (const item of template.template_parts) {
    const balance = await db.inventory_balances.findUnique({
      where: { part_id: item.part_id },
    });

    if (!balance || balance.available < item.quantity) {
      shortages.push({
        partId: item.part_id,
        partName: item.parts.name,
        needed: item.quantity,
        available: balance?.available || 0,
      });
    }
  }

  return {
    canCreate: shortages.length === 0,
    shortages: shortages,
  };
}

export const TemplateService = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  checkTemplateAvailability,
};