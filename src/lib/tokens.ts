import { randomUUID, createHash, randomBytes } from "node:crypto";
import { JWTPayload, SignJWT } from "jose";
import { PrivateKeyInfo, TokenSet } from "./types";

export function generateAuthorizationCode(): string{
  return randomBytes(32).toString("base64");
}

async function generateJwt(
  privateKeyInfo: PrivateKeyInfo,
  expirationTime: string | number,
  sub: string,
  issuer: string,
  payload: JWTPayload
): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: privateKeyInfo.keyAlg, kid: privateKeyInfo.keyId })
    .setSubject(sub)
    .setIssuedAt()
    .setIssuer(issuer)
    .setExpirationTime(expirationTime)
    .setJti(randomUUID())
    .sign(privateKeyInfo.privateKey);
  return jwt;
}

async function generateRandomString(): Promise<string> {
  return randomBytes(32).toString("base64");
}

function generateAccessToken(): Promise<string> {
  return generateRandomString();
}

function generateRefreshToken(): Promise<string> {
  return generateRandomString();
}

function generateAtHash(accessToken: string): string {
  const hash = createHash("sha256");
  const digest = hash.update(accessToken).digest();
  return digest.slice(0, digest.length / 2).toString("base64url");
}

/**
 * A signed JWT that contains basic attributes about the user. GOV.UK One Login signs this JWT using the ES256 algorithm.
 * The public key used to verify this JWT is available from the jwks_uri parameter found in the discovery endpoint.
 */
function generateIdToken(
  audience: string,
  privateKeyInfo: PrivateKeyInfo,
  expirationTime: string | number,
  sub: string,
  issuer: string,
  nonce: string,
  accessToken: string
): Promise<string> {
  return generateJwt(
    privateKeyInfo,
    expirationTime,
    sub,
    issuer,
    {
      aud: audience,
      nonce,
      at_hash: generateAtHash(accessToken),
      vtm: "https://oidc.integration.account.gov.uk/trustmark",
    }
  );
}
