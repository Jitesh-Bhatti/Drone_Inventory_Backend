import { Request, Response, NextFunction } from 'express';

// This function catches any error passed to 'next(error)'
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err); // Log the error for debugging

  // Use the status code from the error, or default to 500
  const statusCode = err.statusCode || 500;
  
  // Send a clean JSON error response to the client
  res.status(statusCode).json({
    message: err.message || 'An unexpected error occurred',
    // Send back 'data' if our service provided it (e.g., the 'shortages' array)
    data: err.data, 
  });
};