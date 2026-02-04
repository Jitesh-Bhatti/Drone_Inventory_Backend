import { PrismaClient } from '../generated/prisma/client'; // Use your custom path
const db = new PrismaClient();

// --- CREATE ---
async function createCategory(name: string) {
  const newCategory = await db.categories.create({
    data: {
      name: name,
    },
  });
  return newCategory;
}

// --- READ (All) ---
async function getAllCategories() {
  const categories = await db.categories.findMany({
    where: { is_active: true },
    orderBy: {
      name: 'asc',
    },
  });
  return categories;
}

// --- UPDATE ---
async function updateCategory(id: string, data: { name?: string; is_active?: boolean }) {
  const updatedCategory = await db.categories.update({
    where: { id: id },
    data: {
      name: data.name,
      is_active: data.is_active,
    },
  });
  return updatedCategory;
}


// --- DELETE (Soft) ---
async function deleteCategory(id: string) {
  // We should check if any active parts are using this category
  const partsCount = await db.parts.count({
    where: {
      category_id: id,
      is_active: true,
    },
  });

  if (partsCount > 0) {
    const error: any = new Error(
      'Cannot delete category: It is still linked to active parts.'
    );
    error.statusCode = 409; // 409 Conflict
    throw error;
  }

  // If no parts are linked, we can safely deactivate it
  await db.categories.update({
    where: { id: id },
    data: { is_active: false },
  });

  return { message: 'Category deactivated successfully' };
}

export const CategoryService = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};