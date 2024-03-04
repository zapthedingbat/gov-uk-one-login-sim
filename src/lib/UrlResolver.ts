import { Request } from "express";

export class UrlResolver {
  private request: Request;
  constructor(request: Request) {
    this.request = request;
  }
  resolve(url: string): string {
    const requestHost = this.request.header("Host");
    const requestUrl = new URL(`${this.request.protocol}://${requestHost}/${this.request.originalUrl}`);
    return new URL(url, requestUrl).toString();
  }
}
