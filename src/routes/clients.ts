import { Request, Response } from "express";
import AsyncHandler from "../lib/AsyncHandler";
import { ClientRegistration } from "../lib/types";

export default (clientRegistrations: Array<ClientRegistration>) => {
  return AsyncHandler(async (req: Request, res: Response) => {
    res.render("client", { clients: clientRegistrations });
  });
};
