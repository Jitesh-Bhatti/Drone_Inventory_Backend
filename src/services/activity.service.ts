import { PrismaClient, activities } from '../generated/prisma/client'; // Use your custom path
const db = new PrismaClient();

// --- CREATE ---
// This is the core of your inventory logic.
// We just create the activity, and the DB trigger does the rest.
async function createActivity(data: any) {
  // Prisma is strict about types. We must ensure only valid data is passed.
  // And handle date strings.

  let categoryName: string | undefined = data.category_name;

  // If a part_id is given, find its category name
  if (data.part_id && !categoryName) {
    const part = await db.parts.findUnique({
      where: { id: data.part_id },
      include: { category: true },
    });
    if (part && part.category) {
      categoryName = part.category.name;
    }
  }

  // Convert invoice_date string to a Date object if it exists
  const invoiceDate = data.invoice_date ? new Date(data.invoice_date) : undefined;

  const newActivity = await db.activities.create({
    data: {
      event_type: data.event_type,
      part_id: data.part_id,
      qty: data.qty,
      actor_name: data.actor_name,
      counterparty_name: data.counterparty_name,
      purpose: data.purpose,
      project: data.project,
      project_id: data.project_id,
      product_id: data.product_id,
      notes: data.notes,
      invoice_number: data.invoice_number,
      invoice_date: invoiceDate,
      timestamp: data.timestamp,
      tags: data.tags,
      category_name: categoryName,
    },
  });
  return newActivity;
}

// --- READ (All with Pagination) ---
async function getAllActivities(page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  // Run two queries in a transaction: one for the data, one for the total count
  const [activities, totalCount] = await db.$transaction([
    db.activities.findMany({
      skip: skip,
      take: limit,
      include: {
        // Include the part name and SKU for a useful log
        parts: {
          select: { name: true, sku: true },
        },
      },
      orderBy: {
        created_at: 'desc', // Show most recent first
      },
    }),
    db.activities.count(), // Get the total number of activities
  ]);

  return {
    data: activities,
    pagination: {
      totalItems: totalCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

export const ActivityService = {
  createActivity,
  getAllActivities,
};