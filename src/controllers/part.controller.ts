import { Request, Response, NextFunction } from 'express';
import { PartService } from '../services/part.service';

// Controller for POST /parts
const createPart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, sku, categoryId } = req.body;
    if (!name || !sku || !categoryId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // const newPart = await PartService.createPart(req.body);
    const newPart = await PartService.createPart({
      ...req.body,
      event_type: "create_part",
      actor_name: "System"
    });

    res.status(201).json(newPart);
  } catch (error) {
    next(error);
  }
};

// Controller for GET /parts
const getAllParts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parts = await PartService.getAllParts();
    res.status(200).json(parts);
  } catch (error) {
    next(error);
  }
};

// Controller for GET /parts/:id
const getPartById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const part = await PartService.getPartById(id);
    res.status(200).json(part);
  } catch (error) {
    next(error);
  }
};

// Controller for PATCH /parts/:id
const updatePart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updatedPart = await PartService.updatePart(id, req.body);
    res.status(200).json(updatedPart);
  } catch (error) {
    next(error);
  }
};

// Controller for DELETE /parts/:id
const deletePart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await PartService.deletePart(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const PartController = {
  createPart,
  getAllParts,
  getPartById,
  updatePart,
  deletePart,
};