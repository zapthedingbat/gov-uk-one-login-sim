import { Request, Response } from "express";
import AsyncHandler from "../lib/AsyncHandler";
import { CoreIdentityBirthDate, CoreIdentityName, PrivateKeyInfo } from "../lib/types";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { IUserinfoStore } from "../lib/UserinfoStore";

export default (userinfoStore: IUserinfoStore, spotPrivateKeyInfo: PrivateKeyInfo) => {
  return AsyncHandler(async (req: Request, res: Response) => {

    const authorizationHeader = req.header("Authorization");
    if(typeof authorizationHeader !== "string"){
      req.log.error(`Tried to access the userinfo endpoint without an Authorization header. The header must be in the format 'Authorization: Bearer {access_token}'`);
      res.sendStatus(401);
      return;
    }
    const accessToken = authorizationHeader.replace(/^Bearer /i, "");
    const userInfo = userinfoStore.get(accessToken);
    if(typeof userInfo === "undefined"){
      req.log.error(`The access token used for the userinfo endpoint wasn't valid. The header must be in the format 'Authorization: Bearer {access_token}'`);
      res.sendStatus(401);
      return;
    }

    const testBehaviour = userInfo.testBehaviour;
    switch(testBehaviour){
      case "UserinfoServerError":
        res.sendStatus(500);
        break;
      case "UserinfoInvalidJson":
        res.send("<html><body>Not valid JSON");
        break;
    }

    const responseData = userInfo.responseData!;

    const response:any = {
      sub: responseData.sub,
      "updated_at": 0,// TODO: what should this be?
    };

    if(typeof responseData.email === "string"){
      response.email = responseData.email;
      response.email_verified = true;
    }

    if(typeof responseData.phone === "string"){
      response.email = responseData.phone;
      response.phone_verified = true;
    }

    if(typeof responseData.coreIdentity === "object"){
      const sub = responseData.sub;
      const issuer = testBehaviour === "UserinfoIdentityClaimInvalidIssuer" ? "invalid-issuer" : responseData.coreIdentity.issuer;
      const aud = testBehaviour === "UserinfoIdentityClaimInvalidAudience" ? "invalid-aud" : responseData.coreIdentity.aud;
      const vot = testBehaviour === "UserinfoIdentityClaimZeroVot" ? "P0" : responseData.coreIdentity.vot;
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
        "IdentityCheckCredential"
      ],
      "credentialSubject": {
        name: name,
        birthDate: birthDate
      }
    }
  };
  const claim = await new SignJWT(payload)
    .setProtectedHeader({ alg: spotPrivateKeyInfo.keyAlg, kid: spotPrivateKeyInfo.keyId })
    //.setNotBefore()
    .setSubject(sub)
    .setIssuedAt()
    .setIssuer(issuer)
    .setExpirationTime("1h")
    .setJti(randomUUID())
    .setAudience(aud)
    .sign(spotPrivateKeyInfo.privateKey);
  return claim;
}
