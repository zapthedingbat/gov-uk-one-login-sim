import { ClientRegistration } from "./lib/types";

export const clientRegistrations: Array<ClientRegistration> = [
  {
    client_id: "test",
    public_key: `-----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6VzxVSctGatDftcsQes+
    E+qGqm92IySx1Z3djb6KdTpoGEBeqStT/vsZoF02DGAw3hEg5NU+1ziWe95xM0Fw
    cEZ0sHeRuk7XyJ22ClDt8eYlOKFlhxz8TckmQVLYUQYUU6tp3UtvWcjXPb7TL79k
    D6SQSi52QteG9H2JPS99UuIR7C0W6wTdkMdl2m503QPdcxt1r7cRaHAbDmZ4WGqy
    qh3y1kO857ZE79wp97RnBZganYpFJEeg/EJGu1NJsM40logJV3AAxwJ5Fcjkdhn+
    o9t3P8d3Xx3WgQstHFUGVu1sWHrc7nVmfl4Fl6NNsjA4KK4tPF88HeoystPbBFso
    LwIDAQAB
    -----END PUBLIC KEY-----`,
    redirect_uris: ["http://localhost:3001/oauth/callback"],
    scopes: ["openid", "email", "phone"],
    claims: [
      "https://vocab.account.gov.uk/v1/coreIdentityJWT"
    ]
  },
];