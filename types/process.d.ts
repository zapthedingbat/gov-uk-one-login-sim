declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: string;
    NODE_PORT: string;
    LOG_LEVEL: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent"
  }
}
