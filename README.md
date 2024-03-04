# A GOV.UK One Login development and integration simulation tool

A NodeJS+TypeScript application to simulate GOV.UK One Login service to help developing and testing an relying party.

The mock is maintained independently from the production and pre-production environments and has some differences.

- More expressive messaging and detailed explanation in error scenarios to guide developers in fixing problems.

- The `access_token` should be treated as opaque. These could be valid JWT format in production, but they are not in the mock to avoid unintentional dependency on the format.

- The mock shouldn't be considered a secure. Cryptographic keys, data and configuration are not protected and you shouldn't use anything sensitive here.

## Usage

### OpenID Connect

- /authorize
- /token
- /userinfo
- /.well-known/open

## Development

```bash
npm run dev
```

## Docker

### Building the docker image

```bash
docker build -t gov-uk-one-login-stub .
```

### Running the docker image

```bash
docker run -it --init -p 3000:8080 gov-uk-one-login-stub
```
