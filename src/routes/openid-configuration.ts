import { Request, Response } from "express";
import AsyncHandler from "../lib/AsyncHandler";
import { UrlResolver } from "../lib/UrlResolver";

export default () => AsyncHandler(async (req: Request, res: Response) => {
  const urlResolver: UrlResolver = new UrlResolver(req);
  res.json({
    authorization_endpoint: urlResolver.resolve("/authorize"),
    token_endpoint: urlResolver.resolve("/token"),
    registration_endpoint:
    urlResolver.resolve("/connect/register"),
    issuer: urlResolver.resolve("/"),
    jwks_uri: urlResolver.resolve("/.well-known/jwks.json"),
    scopes_supported: ["openid", "email", "phone", "offline_access"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["private_key_jwt"],
    token_endpoint_auth_signing_alg_values_supported: [
      "RS256",
      "RS384",
      "RS512",
      "PS256",
      "PS384",
      "PS512",
    ],
    service_documentation: "https://docs.sign-in.service.gov.uk/",
    request_uri_parameter_supported: true,
    trustmarks: "https://oidc.integration.account.gov.uk/trustmark",
    subject_types_supported: ["public", "pairwise"],
    userinfo_endpoint: urlResolver.resolve("/userinfo"),
    end_session_endpoint: urlResolver.resolve("/logout"),
    id_token_signing_alg_values_supported: ["ES256"],
    claim_types_supported: ["normal"],
    claims_supported: [
      "sub",
      "email",
      "email_verified",
      "phone_number",
      "phone_number_verified",
    ],
    backchannel_logout_supported: true,
    backchannel_logout_session_supported: false,
  });
});