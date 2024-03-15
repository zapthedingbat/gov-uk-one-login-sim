import { Request } from "express";

export class UrlResolver {
  private request: Request;
  constructor(request: Request) {
    this.request = request;
  }
  resolve(url: string): string {
    const requestHost = this.request.header("Host");
    const protocol = this.request.header("X-Forwarded-Proto") || this.request.protocol;
    const requestUrl = new URL(`${protocol}://${requestHost}/${this.request.originalUrl}`);
    return new URL(url, requestUrl).toString();
  }
}
