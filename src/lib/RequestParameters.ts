import { ParsedQs } from "qs";
import { Request } from "express";

function formatQuery(value: string | ParsedQs | string[] | ParsedQs[] | undefined): string | undefined {
  if(typeof value === "string"){
    return value;
  }
  if(Array.isArray(value)){
    return value.join(" ");
  }
  return;
}

export abstract class RequestParametersBase {
  constructor(req: Request) {
    const query = req.query;
    Object.entries(query).forEach(([name, value]) => {
      this[name] = formatQuery(value);
    });
    if (req.method === "POST") {
      const body = req.body;
      Object.entries(body).forEach(([name, value]) => {
        this[name] = value as string | undefined;
      });
    }
  }
  [key: string]: string | undefined;
}

// Authorize
export interface IAuthorizeRequestParameters {
  [key: string]: string | undefined;
  claims: string | undefined;
  client_id: string | undefined;
  nonce: string | undefined;
  redirect_uri: string | undefined;
  scope: string | undefined;
  state: string | undefined;
};

export class AuthorizeRequestParameters extends RequestParametersBase implements IAuthorizeRequestParameters {
  claims: string | undefined;
  client_id: string | undefined;
  nonce: string | undefined;
  redirect_uri: string | undefined;
  scope: string | undefined;
  state: string | undefined;
};

// Token
export interface ITokenRequestParameters {
  [key: string]: string | undefined;
  code: string | undefined;
  client_assertion_type: string | undefined;
  client_assertion: string | undefined;
  grant_type: string | undefined;
  redirect_uri: string | undefined;
};

export class TokenRequestParameters extends RequestParametersBase implements ITokenRequestParameters {
  code: string | undefined;
  client_assertion_type: string | undefined;
  client_assertion: string | undefined;
  grant_type: string | undefined;
  redirect_uri: string | undefined;
};
