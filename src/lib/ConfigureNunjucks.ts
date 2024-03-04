import { configure, ConfigureOptions, Environment } from "nunjucks";
import { Application } from "express";

export function ConfigureNunjucks(app: Application, viewsPath: string): void {
  // Configure Nunjucks view engine
  app.set('view engine', 'html');

  
  const isDevelopment = process.env.NODE_ENV !== "production";
  const configureOptions: ConfigureOptions = {
    autoescape: true,
    express: app,
    // Don't cache in development mode so we can make changes to templates without restarting the server
    noCache: isDevelopment,
  };
  const viewPaths = [viewsPath, "node_modules/govuk-frontend/"];
  const nunjucksEnvironment: Environment = configure(viewPaths, configureOptions);

  // "Core" filters
  const safeFilter = nunjucksEnvironment.getFilter('safe');
  nunjucksEnvironment.addFilter("log", function log (a) {
    return safeFilter(`<script>console.log(${JSON.stringify(a, null, '\t')});</script>`);
  })
}

