import { Request, Response } from "express";
import AsyncHandler from "../lib/AsyncHandler";
import { generateAuthorizationCode } from "../lib/tokens";
import { UserinfoData, TestBehaviour, TokenExchangeData, UserinfoTemplate } from "../lib/types";
import { AuthorizeRequestParameters } from "../lib/RequestParameters";
import { ITokenExchangeStore } from "../lib/TokenExchangeResponseStore";
import { UrlResolver } from "../lib/UrlResolver";
import { IUserinfoTemplateStore } from "../lib/UserinfoTemplateStore";

export default (tokenExchangeStore: ITokenExchangeStore, userinfoTemplateStore: IUserinfoTemplateStore) => {
  return AsyncHandler(async (req: Request, res: Response) => {
    const testBehaviour = req.body.action as TestBehaviour;
    if (testBehaviour === "AuthorizeStateMismatch") {
      redirectWithWrongState(req, res);
    } else {
      const userinfoTemplate = await userinfoTemplateStore.get(req.body.identity); 
      tokenExchangeSuccess(req, res, tokenExchangeStore, testBehaviour, userinfoTemplate);
    }
  });
};

function tokenExchangeSuccess(
  req: Request,
  res: Response,
  tokenExchangeStore: ITokenExchangeStore,
  testBehaviour: TestBehaviour,
  userTemplate: UserinfoTemplate
) {
  const authCode = generateAuthorizationCode();
  const parameters = new AuthorizeRequestParameters(req);
  const userinfo: UserinfoData = {
    sub: userTemplate.sub,
  };

  // TODO: Copy user template data based on requested scopes
  const scopes: Array<string> =
    typeof parameters.scope === "string" ? parameters.scope.split(" ") : [];
  if (scopes.includes("email")) {
    userinfo.email = userTemplate.email;
  }
  if (scopes.includes("phone")) {
    userinfo.phone_number = userTemplate.phone_number;
  }

  // TODO: Copy user template data based on requested claims
  if (typeof parameters.claims === "string") {
    const claims: { userinfo: { [claim: string]: null } } = JSON.parse(
      parameters.claims
    );
    const userinfoClaimIds = Object.keys(claims.userinfo);
    if (
      userinfoClaimIds.includes(
        "https://vocab.account.gov.uk/v1/coreIdentityJWT"
      ) &&
      userTemplate.coreIdentity
    ) {
      const urlResolver = new UrlResolver(req);
      const issuer = urlResolver.resolve("/");
      userinfo.coreIdentity = {
        audience: parameters.client_id!,
        issuer: issuer,
        vot: parameters.loc!,
        credentialSubject: userTemplate.coreIdentity,
      };
    }
    if (
      userinfoClaimIds.includes("https://vocab.account.gov.uk/v1/address") &&
      userTemplate.address
    ) {
      userinfo.address = userTemplate.address;
    }
    if (
      userinfoClaimIds.includes(
        "https://vocab.account.gov.uk/v1/drivingPermit"
      ) &&
      userTemplate.drivingPermit
    ) {
      userinfo.drivingPermit = userTemplate.drivingPermit;
    }
    if (
      userinfoClaimIds.includes("https://vocab.account.gov.uk/v1/passport") &&
      userTemplate.passport
    ) {
      userinfo.passport = userTemplate.passport;
    }
    if (
      userinfoClaimIds.includes(
        "https://vocab.account.gov.uk/v1/socialSecurityRecord"
      )
    ) {
      userinfo.socialSecurityRecord = userTemplate.socialSecurityRecord;
    }
  }

  const tokenExchange: TokenExchangeData = {
    testBehaviour: testBehaviour,
    authorizeRequestParameters: parameters,
    userinfo,
  };

  tokenExchangeStore.set(authCode, tokenExchange);
  // Redirect back to RP with authorization code and state parameters
  const locationUrl = new URL(req.body.redirect_uri);
  locationUrl.searchParams.set("code", authCode);
  locationUrl.searchParams.set("state", req.body.state);
  res.redirect(locationUrl.toString());
}

function redirectWithWrongState(req: Request, res: Response) {
  const authCode = generateAuthorizationCode();
  const locationUrl = new URL(req.body.redirect_uri);
  locationUrl.searchParams.set("code", authCode);
  // Make the state parameter incorrect
  locationUrl.searchParams.set("state", "invalid_state");
  res.redirect(locationUrl.toString());
}
