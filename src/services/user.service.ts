import { PrismaClient } from '../generated/prisma/client'; // Use your custom path
const db = new PrismaClient();

// --- CREATE ---
async function createUser(name: string) {
  const newUser = await db.app_users.create({
    data: {
      name: name,
    },
  });
  return newUser;
}

// --- READ (All) ---
async function getAllUsers() {
  const users = await db.app_users.findMany({
    where: { is_active: true },
    orderBy: {
      name: 'asc',
    },
  });
  return users;
}

// --- READ (One) ---
async function getUserById(id: string) {
  const user = await db.app_users.findUnique({
    where: { id: id },
  });

  if (!user) {
    const error: any = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
}

// --- UPDATE ---
async function updateUser(id: string, data: { name?: string; is_active?: boolean }) {
  const updatedUser = await db.app_users.update({
    where: { id: id },
    data: {
      name: data.name,
      is_active: data.is_active,
    },
  });
  return updatedUser;
}

// --- DELETE (Soft) ---
async function deleteUser(id: string) {
  // TODO: Add logic here to check if the user is assigned to active projects
  // For now, we just deactivate.
  await db.app_users.update({
    where: { id: id },
    data: { is_active: false },
  });
  return { message: 'User deactivated successfully' };
}

export const UserService = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};