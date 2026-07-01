import type { NextFunction } from "express";

const auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // console.log("This is protected route");
    console.log(req.headers)
    next();
  };
};

export default auth;