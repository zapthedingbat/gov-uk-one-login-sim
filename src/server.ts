import TTLCache from "@isaacs/ttlcache";
import express, { NextFunction, Request, Response, urlencoded } from "express";
import path from "node:path";
import pinoHttp from "pino-http";
import { clientRegistrations } from "./config.clients";
import { ClientConfigurations } from "./lib/ClientConfigurations";
import { ConfigureNunjucks } from "./lib/ConfigureNunjucks";
import { Keys } from "./lib/Keys";
import { logger } from "./lib/Logger";
import { TokenExchangeResponseData, PrivateKeyInfo, UserinfoResponse } from "./lib/types";
import authorize from "./routes/authorize";
import home from "./routes/home";
import jwks from "./routes/jwks";
import openidConfiguration from "./routes/openid-configuration";
import submit from "./routes/submit";
import token from "./routes/token";
import userinfo from "./routes/userinfo";
import keys from "./routes/keys";

(async () => {
  const app = express();
  const port = Number.parseInt(process.env.NODE_PORT || "3000");

  const clientConfigurations = await ClientConfigurations.Create(
    clientRegistrations
  );

  const keyStore = new Keys();
  const spotKeyPair = Keys.createKeyPair();
  const spotPrivateKeyInfo: PrivateKeyInfo = {
    keyId: Keys.createKeyId(),
    keyAlg: spotKeyPair.keyAlg,
    privateKey: spotKeyPair.privateKey
  }

  // Generate some key-pairs
  const keyCount = 3;
  for (let keyIndex = 0; keyIndex < keyCount; keyIndex++) {
    const keyId = Keys.createKeyId();
    const keyPair = Keys.createKeyPair();
    keyStore.addPair(keyId, keyPair.keyAlg, keyPair.publicKey, keyPair.privateKey);
  }

  // Create a cache of authorize request parameters so they can be retrieved later in the token-exchange.
  const authCodeExpiry = process.env.AUTH_CODE_EXPIRY
    ? Number.parseInt(process.env.AUTH_CODE_EXPIRY)
    : 3000;
  const authorizeRequests = new TTLCache<string, TokenExchangeResponseData>({
    ttl: authCodeExpiry,
  });

  // Create a store of userinfo responses so they can be returned after token exchange
  const userinfoStore = new TTLCache<string, UserinfoResponse>({
    ttl: 180000, // 3 mins
  });

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
    token(clientConfigurations, authorizeRequests, userinfoStore, keyStore)
  );

  // Serve the userinfo resource, protected by the access_token
  app.get("/userinfo", userinfo(userinfoStore, spotPrivateKeyInfo));

  // Stub application used to manage the simulation
  app.post("/app/submit", submit(authorizeRequests));

  // Stub application used to manage the simulation
  app.post("/app/keys", keys(spotKeyPair.publicKey));

  // Generic error handler
  app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    logger.error(err);
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
