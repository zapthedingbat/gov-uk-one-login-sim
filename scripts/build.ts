import { mkdir, rm, cp, writeFile, readdir } from "node:fs/promises";
import { join, parse } from "node:path";
import * as ts from "typescript";
import sass from "sass";

const CWD = process.cwd();
const SRC_DIRECTORY = join(CWD, "src");
const DIST_DIRECTORY = join(CWD, "dist");
const PUBLIC_DIRECTORY = join(CWD, "public");
const GOVUK_FRONTEND_SRC_DIRECTORY = join(CWD, "./node_modules/govuk-frontend/govuk");
const COPY_FILES = [
  { src: join(SRC_DIRECTORY, "views"), dest: join(DIST_DIRECTORY, "views") },
  { src: join(SRC_DIRECTORY, "assets/images"), dest: join(PUBLIC_DIRECTORY, "images") },
  { src: join(SRC_DIRECTORY, "assets/javascripts"), dest: join(PUBLIC_DIRECTORY, "javascripts")},
  {
    src: join(GOVUK_FRONTEND_SRC_DIRECTORY, "all.js"),
    dest: join(PUBLIC_DIRECTORY, "javascripts/all.js"),
  },
];

/** Copy files to dist directory */
async function copyFiles() {
  for (const { src, dest } of COPY_FILES) {
    console.log(`📁 Copying ${src} to ${dest}`);
    await cp(src, dest, { recursive: true });
  }
}

/** Transpile typescript files to javascript */
async function transpileTypescript() {
  const configFileName = ts.findConfigFile("./", ts.sys.fileExists);

  if (!configFileName) {
    throw new Error("Could not find a valid 'tsconfig.json'");
  }

  const tsconfig = ts.getParsedCommandLineOfConfigFile(
    configFileName,
    undefined!,
    ts.sys as unknown as ts.ParseConfigFileHost
  );

  if (!tsconfig) {
    throw new Error("Failed to parse tsconfig.json");
  }

  console.log(`🏗️ Compiling TypeScript`);
  const program = ts.createProgram(tsconfig.fileNames, tsconfig.options);
  program.emit();
}

/** Transpile sass files to css */
async function transpileStylesheets() {
  const stylesheetsSrcDirectory = join(SRC_DIRECTORY, "assets/sass");
  const stylesheetsDistDirectory = join(PUBLIC_DIRECTORY, "stylesheets");
  await mkdir(stylesheetsDistDirectory, { recursive: true });

  const stylesheets = await readdir(stylesheetsSrcDirectory, {
    withFileTypes: true,
  });
  for (const stylesheet of stylesheets) {
    if (
      stylesheet.isFile() &&
      stylesheet.name.endsWith(".scss") &&
      // Use unbranded CSS. Change to "application" for branding.
      stylesheet.name.includes("unbranded") 
    ) {
      const src = join(stylesheetsSrcDirectory, stylesheet.name);
      const dest = join(
        stylesheetsDistDirectory,
        parse(stylesheet.name).name + ".css"
      );
      console.log(`🏗️ Compiling Stylesheet ${src} to ${dest}`);
      const result = sass.compile(src, {
        loadPaths: [GOVUK_FRONTEND_SRC_DIRECTORY],
        quietDeps: true,
      });
      await writeFile(dest, result.css);
    }
  }
}

(async function build(): Promise<void> {
  // Clean dist folder
  const dir = DIST_DIRECTORY;
  console.log(`🧹 Cleaning ${dir}`);
  await rm(dir, { recursive: true, force: true });

  await copyFiles();
  await transpileStylesheets();
  await transpileTypescript();
})();
