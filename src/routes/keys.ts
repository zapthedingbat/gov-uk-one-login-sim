import { Request, Response } from "express";
import AsyncHandler from "../lib/AsyncHandler";
import { KeyObject } from "node:crypto";

export default (spotPublicKey: KeyObject) => {
  return AsyncHandler(async (req: Request, res: Response) => {
    const pem = spotPublicKey.export({
      type: "spki",
      format: "pem"
    });
    res.render("key", {publicKey: pem});
  });
};