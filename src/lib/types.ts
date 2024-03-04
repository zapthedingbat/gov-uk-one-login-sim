import { AuthorizeRequestParameters } from "./RequestParameters";
import { JWTVerifyGetKey } from "jose";
import { KeyObject } from "node:crypto";

export type ClientConfiguration = {
  readonly client_id: string;
  readonly redirect_uris: ReadonlyArray<string>;
  readonly scopes: ReadonlyArray<string>;
  readonly claims: ReadonlyArray<string>;
  getPublicKey: JWTVerifyGetKey;
};

export type ClientRegistration = {
  client_id: string;
  redirect_uris: Array<string>;
  scopes: Array<string>;
  claims: Array<string>;
} & ({ jwks_uri: string } | { public_key: string });

export type PrivateKeyInfo = {
  keyId: string;
  keyAlg: string;
  privateKey: KeyObject;
};

export type TokenSet = TokenSetBase | (TokenSetBase & RefreshTokenSet);

type TokenSetBase = {
  token_type: "Bearer";
  access_token: string;
  id_token: string;
};

type RefreshTokenSet = {
  refresh_token: string;
  expires_in: number;
};

export type TokenExchangeTestBehaviour =
  | "Success"
  | "ServerError"
  | "NonceMismatch"
  | "WrongIdTokenAudience"
  | "InvalidResourceJson"
  | "ExpiredIdentityClaim"
  | "ZeroVot"
  | "InvalidAudience"
  | "InvalidIssuer"

export type UserinfoTestBehaviour =
  | "Success"
  | "ServerError"
  | "InvalidResourceJson"
  | "ExpiredIdentityClaim"
  | "ZeroVot"
  | "InvalidAudience"
  | "InvalidIssuer"

export type CoreIdentityName = Array<{
  validFrom?: string;
  validUntil?: string;
  nameParts: Array<{
    value: string;
    type: "GivenName" | "FamilyName";
  }>;
}>;

export type CoreIdentityBirthDate = Array<{
  value: string;
}>;

type UserinfoResponseData = {
  sub: string;
  phone?: any;
  email?: any;
  coreIdentity?: {
    vot: string;
    aud: string;
    issuer: string;
    name: CoreIdentityName;
    birthDate: CoreIdentityBirthDate;
  };
};

export type Userinfo = {
  responseBehaviour: UserinfoTestBehaviour;
  responseData?: UserinfoResponseData
};

export type TokenExchangeResponseData = any
export type TokenExchange = {
  authorizeRequestParameters: AuthorizeRequestParameters,
  testBehaviour: TokenExchangeTestBehaviour
  responseData: TokenExchangeResponseData
}
