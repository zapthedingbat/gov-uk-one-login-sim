import { Request, Response } from "express";
import AsyncHandler from "../lib/AsyncHandler";

export default AsyncHandler(async (_req: Request, res: Response) => {
  res.render("home");
});