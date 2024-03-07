import { Request, Response } from "express";
import AsyncHandler from "../lib/AsyncHandler";
import { PrivateKeyInfo, UserinfoCredentialSubjectData } from "../lib/types";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { IUserinfoStore } from "../lib/UserinfoStore";

export default (
  userinfoStore: IUserinfoStore,
  spotPrivateKeyInfo: PrivateKeyInfo
) => {
  return AsyncHandler(async (req: Request, res: Response) => {
    const authorizationHeader = req.header("Authorization");
    if (typeof authorizationHeader !== "string") {
      req.log.error(
        `Tried to access the userinfo endpoint without an Authorization header. The header must be in the format 'Authorization: Bearer {access_token}'`
      );
      res.sendStatus(401);
      return;
    }
    const accessToken = authorizationHeader.replace(/^Bearer /i, "");
    const userinfoStoreItem = userinfoStore.get(accessToken);
    if (typeof userinfoStoreItem === "undefined") {
      req.log.error(
        `The access token used for the userinfo endpoint wasn't valid. The header must be in the format 'Authorization: Bearer {access_token}'`
      );
      res.sendStatus(401);
      return;
    }

    const testBehaviour = userinfoStoreItem.testBehaviour;
    switch (testBehaviour) {
      case "UserinfoServerError":
        res.sendStatus(500);
        break;
      case "UserinfoInvalidJson":
        res.send("<html><body>Invalid JSON");
        break;
    }

    const userinfo = userinfoStoreItem.userinfo!;

    const response: any = {
      sub: userinfo.sub,
      updated_at: 0, // TODO: what should this be?
    };

    if (typeof userinfo.email === "string") {
      response.email = userinfo.email;
      response.email_verified = true;
    }

    if (typeof userinfo.phone_number === "string") {
      response.phone_number = userinfo.phone_number;
      response.phone_verified = true;
    }

    if (typeof userinfo.coreIdentity === "object") {
      const sub = userinfo.sub;
      const issuer =
        testBehaviour === "UserinfoIdentityClaimInvalidIssuer"
          ? "invalid-issuer"
          : userinfo.coreIdentity.issuer;
      const aud =
        testBehaviour === "UserinfoIdentityClaimInvalidAudience"
          ? "invalid-audience"
          : userinfo.coreIdentity.audience;
      const expiration =
        testBehaviour === "UserinfoIdentityClaimExpired"
          ? Date.now() / 1000 - 3600
          : Date.now() / 1000 + 3600;
      const coreIdentityClaim = await generateCoreIdentityClaim(
        sub,
        issuer,
        aud,
        userinfo.coreIdentity.vot,
        userinfo.coreIdentity.credentialSubject,
        spotPrivateKeyInfo,
        expiration
      );
      response["https://vocab.account.gov.uk/v1/coreIdentityJWT"] =
        coreIdentityClaim;
    }

    res.json(response);
  });
};

async function generateCoreIdentityClaim(
  sub: string,
  issuer: string,
  aud: string,
  vot: string,
  credentialSubject: UserinfoCredentialSubjectData,
  spotPrivateKeyInfo: PrivateKeyInfo,
  expiration: number
) {
  const payload = {
    vot: vot,
    vtm: "https://oidc.integration.account.gov.uk/trustmark",
    vc: {
      type: ["VerifiableCredential", "IdentityCheckCredential"],
      credentialSubject: credentialSubject,
    },
  };
  const claim = await new SignJWT(payload)
    .setProtectedHeader({
      alg: spotPrivateKeyInfo.keyAlg,
      kid: spotPrivateKeyInfo.keyId,
    })
    .setSubject(sub)
    .setIssuedAt()
    .setIssuer(issuer)
    .setExpirationTime(expiration)
    .setJti(randomUUID())
    .setAudience(aud)
    .sign(spotPrivateKeyInfo.privateKey);
  return claim;
}
