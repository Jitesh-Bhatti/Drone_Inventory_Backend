import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';

// Controller for POST /categories
const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const newCategory = await CategoryService.createCategory(name);
    res.status(201).json(newCategory);
  } catch (error) {
    next(error);
  }
};

// Controller for GET /categories
const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await CategoryService.getAllCategories();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

// Controller for PATCH /categories/:id
const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updatedCategory = await CategoryService.updateCategory(id, req.body);
    res.status(200).json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

// Controller for DELETE /categories/:id
const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await CategoryService.deleteCategory(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CategoryController = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,   
};