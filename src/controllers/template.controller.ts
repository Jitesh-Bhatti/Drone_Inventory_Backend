import { Request, Response, NextFunction } from 'express';
import { TemplateService } from '../services/template.service';

const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, partsList } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const template = await TemplateService.createTemplate(name, description, partsList);
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
};

const getAllTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await TemplateService.getAllTemplates();
    res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
};

const getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const template = await TemplateService.getTemplateById(id);
    res.status(200).json(template);
  } catch (error) {
    next(error);
  }
};

const updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const template = await TemplateService.updateTemplate(id, req.body);
    res.status(200).json(template);
  } catch (error) {
    next(error);
  }
};

const deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await TemplateService.deleteTemplate(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const checkTemplateAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await TemplateService.checkTemplateAvailability(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const TemplateController = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  checkTemplateAvailability,
};