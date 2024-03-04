import { Request, Response } from "express";
import AsyncHandler from "../lib/AsyncHandler";
import TTLCache from "@isaacs/ttlcache";
import { CoreIdentityBirthDate, CoreIdentityName, PrivateKeyInfo, UserinfoResponse } from "../lib/types";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";

export default (userinfoStore: TTLCache<string, UserinfoResponse>, spotPrivateKeyInfo: PrivateKeyInfo) => {
  return AsyncHandler(async (req: Request, res: Response) => {

    const authorizationHeader = req.header("Authorization");
    if(typeof authorizationHeader !== "string"){
      // Tried to access the userinfo endpoint without an Authorization header. The header must be in the format 'Authorization: Bearer {access_token}'
      throw new Error("401 Unauthorized");
    }
    const accessToken = authorizationHeader.replace(/^Bearer /i, "");
    const userInfo = userinfoStore.get(accessToken);
    if(typeof userInfo === "undefined"){
      // The access token used for the userinfo endpoint wasn't valid. The header must be in the format 'Authorization: Bearer {access_token}'
      throw new Error("401 Unauthorized");
    }

    switch(userInfo.behaviour){
      case "ServerError":
        res.sendStatus(500);
        break;
      case "InvalidResourceJson":
        res.send("<html><body>Not valid JSON");
        break;
    }

    const sub = userInfo.resource.sub;

    const response:any = {
      sub,
      "updated_at": 0,// TODO: what should this be?
    };

    if(typeof userInfo.resource.email === "string"){
      response.email = userInfo.resource.email;
      response.email_verified = true;
    }

    if(typeof userInfo.resource.phone === "string"){
      response.email = userInfo.resource.phone;
      response.phone_verified = true;
    }

    if(typeof userInfo.resource.coreIdentity === "object"){
      const sub = "foo";
      const issuer = userInfo.behaviour === "InvalidIssuer" ? "invalid-issuer" : userInfo.resource.coreIdentity.issuer;
      const aud = userInfo.behaviour === "InvalidAudience" ? "invalid-aud" : userInfo.resource.coreIdentity.aud;
      const vot = userInfo.behaviour === "ZeroVot" ? "P0" : userInfo.resource.coreIdentity.vot;
      const name: CoreIdentityName = [];
      const birthDate: CoreIdentityBirthDate = [];
      const coreIdentityClaim = await generateCoreIdentityClaim(vot, name, birthDate, spotPrivateKeyInfo, sub, issuer, aud);
      response["https://vocab.account.gov.uk/v1/coreIdentityJWT"] = coreIdentityClaim;
    }

    res.json(response);
  })
};

async function generateCoreIdentityClaim(vot: string, name: CoreIdentityName, birthDate: CoreIdentityBirthDate, spotPrivateKeyInfo: PrivateKeyInfo, sub: string, issuer: string, aud: string) {
  const payload = {
    "vot": vot,
    "vtm": "https://oidc.integration.account.gov.uk/trustmark",
    "vc": {
      "type": [
        "VerifiableCredential",
        "VerifiableIdentityCredential"
      ],
      "credentialSubject": {
        name: name,
        birthDate: birthDate
      }
    }
  };
  const claim = await new SignJWT(payload)
    .setProtectedHeader({ alg: spotPrivateKeyInfo.keyAlg, kid: spotPrivateKeyInfo.keyId })
    .setNotBefore(123)
    .setSubject(sub)
    .setIssuedAt(1541493724)
    .setIssuer(issuer)
    .setExpirationTime(1573029723)
    .setJti(randomUUID())
    .setAudience(aud)
    .sign(spotPrivateKeyInfo.privateKey);
  return claim;
}
