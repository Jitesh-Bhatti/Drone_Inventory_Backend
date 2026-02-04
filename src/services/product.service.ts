import { PrismaClient } from '../generated/prisma/client'; // Use your custom path
const db = new PrismaClient();

// --- CREATE ---
async function createProduct(projectId: string, name: string) {
  return db.$transaction(async (tx) => {
    // 1. Get the project name for logging
    const project = await tx.projects.findUnique({
      where: { id: projectId },
      select: { name: true },
    });
    if (!project) {
      throw new Error('Project not found');
    }

    // 2. Create the new product
    const newProduct = await tx.products.create({
      data: {
        project_id: projectId,
        name: name,
      },
    });

    // 3. Log this action
    await tx.activities.create({
      data: {
        event_type: 'product-created',
        actor_name: 'System', // Or logged-in user
        notes: `Product "${name}" created for project "${project.name}"`,
        project_id: projectId,
        product_id: newProduct.id,
        project: project.name,
        tags: ['product', 'created'],
      },
    });

    return newProduct;
  });
}

// --- UPDATE ---
async function updateProduct(productId: string, name: string) {
  return db.products.update({
    where: { id: productId },
    data: {
      name: name,
    },
  });
}

// --- DELETE ---
async function deleteProduct(productId: string) {
  // This must be a transaction.
  // We need to return all issued parts to inventory.
  return db.$transaction(async (tx) => {
    // 1. Find the product and all its parts
    const product = await tx.products.findUnique({
      where: { id: productId },
      include: {
        product_parts: true, // Get the list of parts to return
        projects: { select: { id: true, name: true } }, // Get project info for logging
      },
    });

    if (!product) {
      const error: any = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Create "return" activities for every part in the product
    if (product.product_parts.length > 0) {
      const activitiesToCreate = product.product_parts.map((part) => ({
        event_type: 'return', // Or 'project-deallocation'
        part_id: part.part_id,
        qty: part.quantity,
        actor_name: 'System',
        notes: `Deallocated from deleted product: ${product.name}`,
        tags: ['product-deleted', 'return'],
        project_id: product.project_id,
        product_id: product.id,
        project: product.projects?.name,
      }));

      // Your DB trigger will automatically update inventory_balances
      await tx.activities.createMany({
        data: activitiesToCreate,
      });
    }

    // 3. Delete the 'product_parts' links
    await tx.product_parts.deleteMany({
      where: { product_id: productId },
    });

    // 4. Log the product deletion
    await tx.activities.create({
      data: {
        event_type: 'product-deleted',
        actor_name: 'System',
        notes: `Product "${product.name}" deleted`,
        project_id: product.project_id,
        product_id: product.id,
        project: product.projects?.name,
        tags: ['product', 'deleted'],
      },
    });

    // 5. Delete the product itself
    await tx.products.delete({
      where: { id: productId },
    });

    return { message: 'Product deleted and parts returned to inventory' };
  });
}

// --- ADD PART TO PRODUCT ---
async function addPartToProduct(
  productId: string,
  partId: string,
  quantity: number,
) {
  return db.$transaction(async (tx) => {
    // 1. Check for sufficient inventory
    const balance = await tx.inventory_balances.findUnique({
      where: { part_id: partId },
    });
    if (!balance || balance.available < quantity) {
      const error: any = new Error('Insufficient inventory for this part');
      error.statusCode = 409;
      throw error;
    }

    // 2. Check if part is already in the product
    const existingPart = await tx.product_parts.findUnique({
      where: {
        product_id_part_id: {
          product_id: productId,
          part_id: partId,
        },
      },
    });

    if (existingPart) {
      const error: any = new Error('Part is already in this product. Use the UPDATE endpoint to change quantity.');
      error.statusCode = 409;
      throw error;
    }

    // 3. Add the part to the product
    const newProductPart = await tx.product_parts.create({
      data: {
        product_id: productId,
        part_id: partId,
        quantity: quantity,
      },
    });

    // 4. Log the activity (this will trigger inventory update)
    await tx.activities.create({
      data: {
        event_type: 'project-allocation',
        part_id: partId,
        qty: quantity,
        actor_name: 'System',
        notes: 'Manually added to product',
        tags: ['manual-allocation'],
        product_id: productId,
      },
    });

    return newProductPart;
  });
}

// --- UPDATE PART IN PRODUCT ---
async function updatePartInProduct(
  productId: string,
  partId: string,
  newQuantity: number,
) {
  if (newQuantity <= 0) {
    const error: any = new Error('Quantity must be greater than 0. Use DELETE to remove the part.');
    error.statusCode = 400;
    throw error;
  }

  return db.$transaction(async (tx) => {
    // 1. Get the current quantity
    const existingPart = await tx.product_parts.findUnique({
      where: {
        product_id_part_id: {
          product_id: productId,
          part_id: partId,
        },
      },
    });

    if (!existingPart) {
      const error: any = new Error('Part not found in this product. Use ADD to add it.');
      error.statusCode = 404;
      throw error;
    }

    const oldQuantity = existingPart.quantity;
    const delta = newQuantity - oldQuantity;

    // 2. Check inventory if we are adding more parts
    if (delta > 0) {
      const balance = await tx.inventory_balances.findUnique({
        where: { part_id: partId },
      });
      if (!balance || balance.available < delta) {
        const error: any = new Error('Insufficient inventory to increase quantity');
        error.statusCode = 409;
        throw error;
      }
    }

    // 3. Update the quantity in product_parts
    const updatedProductPart = await tx.product_parts.update({
      where: {
        product_id_part_id: {
          product_id: productId,
          part_id: partId,
        },
      },
      data: {
        quantity: newQuantity,
      },
    });

    // 4. Log the activity for the change in quantity
    if (delta > 0) {
      await tx.activities.create({
        data: {
          event_type: 'project-allocation',
          part_id: partId,
          qty: delta,
          actor_name: 'System',
          notes: 'Increased quantity in product',
          tags: ['manual-allocation'],
          product_id: productId,
        },
      });
    } else if (delta < 0) {
      await tx.activities.create({
        data: {
          event_type: 'project-deallocation', // Or 'return'
          part_id: partId,
          qty: -delta, // Quantity must be positive
          actor_name: 'System',
          notes: 'Decreased quantity in product',
          tags: ['manual-return'],
          product_id: productId,
        },
      });
    }

    return updatedProductPart;
  });
}

// --- REMOVE PART FROM PRODUCT ---
async function removePartFromProduct(productId: string, partId: string) {
  return db.$transaction(async (tx) => {
    // 1. Find the part to get its quantity
    const existingPart = await tx.product_parts.findUnique({
      where: {
        product_id_part_id: {
          product_id: productId,
          part_id: partId,
        },
      },
    });

    if (!existingPart) {
      const error: any = new Error('Part not found in this product.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Delete the product_parts link
    await tx.product_parts.delete({
      where: {
        product_id_part_id: {
          product_id: productId,
          part_id: partId,
        },
      },
    });

    // 3. Log the "return" activity
    await tx.activities.create({
      data: {
        event_type: 'project-deallocation', // Or 'return'
        part_id: partId,
        qty: existingPart.quantity,
        actor_name: 'System',
        notes: 'Manually removed from product',
        tags: ['manual-return'],
        product_id: productId,
      },
    });

    return { message: 'Part removed from product and returned to inventory' };
  });
}

export const ProductService = {
  createProduct,
  updateProduct,
  deleteProduct,
  addPartToProduct,       // <-- ADD THIS
  updatePartInProduct,    // <-- ADD THIS
  removePartFromProduct,  // <-- ADD THIS
};