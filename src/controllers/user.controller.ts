import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const newUser = await UserService.createUser(name);
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await UserService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updatedUser = await UserService.updateUser(id, req.body);
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await UserService.deleteUser(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const UserController = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};