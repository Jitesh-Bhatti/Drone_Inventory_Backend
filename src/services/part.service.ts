import { PrismaClient } from '../generated/prisma/client'; // Use your custom path
const db = new PrismaClient();

// --- CREATE ---
async function createPart(data: {
  name: string;
  sku: string;
  category_id: string;
  description?: string;
}) {

  const newPart = await db.parts.create({
  data: {
    name: data.name,
    sku: data.sku,
    category_id: data.category_id,
    description: data.description,
  },
  include: {
    category: true,
  },
});

// create activity automatically
await db.activities.create({
  data: {
    event_type: "receive",
    part_id: newPart.id,
    qty: 0,
    actor_name: "System",
    category_name: newPart.category.name,
    tags: ["part-created"]
  }
});

return newPart;

  
}

// --- READ (All) ---
async function getAllParts() {
  const parts = await db.parts.findMany({
    where: { is_active: true }, // Only get active parts
    include: {
      category: {
        select: { name: true }, // Only include the category's name
      },
      inventory_balances: true, // Also include the inventory counts
    },
    orderBy: {
      name: 'asc',
    },
  });
  return parts;
}

// --- READ (One) ---
async function getPartById(id: string) {
  const part = await db.parts.findUnique({
    where: { id: id },
    include: {
      category: true,
      inventory_balances: true,
    },
  });

  if (!part) {
    const error: any = new Error('Part not found');
    error.statusCode = 404;
    throw error;
  }
  return part;
}

// --- UPDATE ---
async function updatePart(id: string, data: {
  name?: string;
  sku?: string;
  category_id?: string;
  description?: string;
  is_active?: boolean;
}) {
  const updatedPart = await db.parts.update({
    where: { id: id },
    data: {
      name: data.name,
      sku: data.sku,
      category_id: data.category_id,
      description: data.description,
      is_active: data.is_active,
    },
    include: {
      category: true,
    },
  });
  return updatedPart;
}

// --- DELETE (Soft) ---
// We just set is_active to false, we don't truly delete it.
async function deletePart(id: string) {
  await db.parts.update({
    where: { id: id },
    data: { is_active: false },
  });
  return { message: 'Part deactivated successfully' };
}

// Export all functions
export const PartService = {
  createPart,
  getAllParts,
  getPartById,
  updatePart,
  deletePart,
};