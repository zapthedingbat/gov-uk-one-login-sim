import express, { NextFunction, Request, Response, urlencoded } from "express";
import path from "node:path";
import pinoHttp from "pino-http";
import { clientRegistrations } from "./config.clients";
import { ClientConfigurations } from "./lib/ClientConfigurations";
import { ConfigureNunjucks } from "./lib/ConfigureNunjucks";
import { KeyStore } from "./lib/KeyStore";
import { logger } from "./lib/Logger";
import { PrivateKeyInfo } from "./lib/types";
import authorize from "./routes/authorize";
import home from "./routes/home";
import jwks from "./routes/jwks";
import openidConfiguration from "./routes/openid-configuration";
import submit from "./routes/submit";
import token from "./routes/token";
import userinfo from "./routes/userinfo";
import keys from "./routes/keys";
import { IUserinfoStore, UserinfoStore } from "./lib/UserinfoStore";
import { TokenExchangeStore } from "./lib/TokenExchangeResponseStore";
import clients from "./routes/clients";

(async () => {
  const app = express();
  const port = Number.parseInt(process.env.NODE_PORT || "3000");

  const clientConfigurations = await ClientConfigurations.Create(
    clientRegistrations
  );

  // Load the key pair for signing the identity claim and save it as a file if it's not there
  const identityVerificationKeyFilepath = "config/idv-private-key.pem";
  let idvKeyPair = await KeyStore.readKeyPairFile(identityVerificationKeyFilepath);
  if(!idvKeyPair){
    idvKeyPair = KeyStore.createKeyPair();
    await KeyStore.writeKeyPairFile(identityVerificationKeyFilepath, idvKeyPair);
  }
  const idvPrivateKeyInfo: PrivateKeyInfo = {
    keyId: KeyStore.createKeyId(),
    keyAlg: idvKeyPair.keyAlg,
    privateKey: idvKeyPair.privateKey
  }
  
  // Generate some key-pairs
  const keyCount = 3;
  const keyStore = new KeyStore();
  for (let keyIndex = 0; keyIndex < keyCount; keyIndex++) {
    const keyId = KeyStore.createKeyId();
    const keyPair = KeyStore.createKeyPair();
    keyStore.addPair(keyId, keyPair.keyAlg, keyPair.publicKey, keyPair.privateKey);
  }

  // Create a cache of authorize request parameters so they can be retrieved later in the token-exchange.
  const authCodeExpiry = process.env.AUTH_CODE_EXPIRY
    ? Number.parseInt(process.env.AUTH_CODE_EXPIRY)
    : 3000;
  const tokenExchangeStore = new TokenExchangeStore(authCodeExpiry);

  // Create a store of userinfo responses so they can be returned after token exchange
  const userinfoStore:IUserinfoStore = new UserinfoStore();

  // Configure HTTP request logging
  const httpLogger = pinoHttp({
    logger: logger,
    useLevel: "trace",
  });
  app.use(httpLogger);

  // Configure HTML templating with Nunjucks
  ConfigureNunjucks(app, path.join(__dirname, "views"));

  // Serve static files
  app.use(express.static(path.join(__dirname, "../public")));

  // Decode HTML form post request body
  app.use(urlencoded({ extended: true }));

  /*
   * Configure application routes
   */
  // Root page, not involved in the stub flow.
  // Just helpful for developers to check the app is working and serve links to docs
  app.get("/", home);

  // OIDC metadata discovery endpoint
  app.get("/.well-known/openid-configuration", openidConfiguration());

  // Public keys for signing OIDC id_tokens, exposed as JWKS
  app.get("/.well-known/jwks.json", jwks(keyStore));

  // OAuth2 / OIDC authorize endpoint
  app.get("/authorize", authorize(clientConfigurations));

  // OIDC token exchange
  app.post(
    "/token",
    token(clientConfigurations, tokenExchangeStore, keyStore, userinfoStore)
  );

  // Serve the userinfo resource, protected by the access_token
  app.get("/userinfo", userinfo(userinfoStore, idvPrivateKeyInfo));

  // Stub application used to manage the simulation
  app.post("/app/submit", submit(tokenExchangeStore));

  // Stub application used to manage the simulation
  app.get("/app/keys", keys(idvKeyPair.publicKey));

  app.get("/app/clients", clients(clientRegistrations));

  // Generic error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    req.log.error(err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500);
    res.render("application-error", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  });

  const server = await app.listen(port);
  const listeningAddress = server.address();
  if (listeningAddress && typeof listeningAddress === "object") {
    logger.info({ listeningAddress }, `server listening`);
  }
})();
