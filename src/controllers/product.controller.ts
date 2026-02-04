import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';

const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params; // From the URL
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Product name is required' });
    }
    const newProduct = await ProductService.createProduct(projectId, name);
    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // Product ID from URL
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Product name is required' });
    }
    const updatedProduct = await ProductService.updateProduct(id, name);
    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // Product ID from URL
    const result = await ProductService.deleteProduct(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
// ADD THESE NEW FUNCTIONS:

const addPartToProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // Product ID from URL
    const { partId, quantity } = req.body;
    if (!partId || !quantity) {
      return res.status(400).json({ message: 'partId and quantity are required' });
    }
    const result = await ProductService.addPartToProduct(id, partId, quantity);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const updatePartInProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id, partId } = req.params; // Product and Part ID from URL
    const { quantity } = req.body;
    if (!quantity) {
      return res.status(400).json({ message: 'quantity is required' });
    }
    const result = await ProductService.updatePartInProduct(id, partId, quantity);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const removePartFromProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id, partId } = req.params; // Product and Part ID from URL
    const result = await ProductService.removePartFromProduct(id, partId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const ProductController = {
  createProduct,
  updateProduct,
  deleteProduct,
  addPartToProduct,       // <-- ADD THIS
  updatePartInProduct,    // <-- ADD THIS
  removePartFromProduct,  // <-- ADD THIS
};