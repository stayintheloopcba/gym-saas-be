<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## API documentation

With the application running locally:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`

The OpenAPI document describes authentication through the `access_token`,
`refresh_token`, and `active_org` HttpOnly cookies.

## Request tracing

Every HTTP response includes an `x-request-id` header. Clients may send a safe
request ID using the same header; otherwise the API generates one.

HTTP access and server-error logs are emitted as single-line JSON with request
ID, method, path, status, duration, authenticated account, and active
organization when available. Bodies, query strings, headers, cookies,
passwords, and tokens are intentionally excluded.

## Persisted sessions

Registration, local login, and Google login create a persisted session. Refresh
tokens are stored only as SHA-256 hashes and rotate on every successful
`POST /auth/refresh`. Reusing an already-rotated token revokes its complete
session family.

- `GET /me/sessions`: list active sessions.
- `DELETE /me/sessions/:sessionId`: revoke one owned session.
- `DELETE /me/sessions`: revoke every session except the current one.
- `POST /auth/logout`: revoke the current persisted session and clear cookies.

Protected endpoints validate that the session referenced by the access token is
still active.

## Organization permissions

Authorization uses persisted `Role`, `Permission`, and `PermissionAssignment`
entities. The bootstrap seeder keeps the permission catalog and the default
`OWNER`, `ADMIN`, `MEMBER`, and `VIEWER` roles up to date. The membership enum
provides the system-role baseline, while its optional `roleId` points only to a
custom role layered on top. Assignments can target that custom role or a user
and support explicit allow/deny values with precedence.

Controllers declare requirements with `@RequirePermissions(...)`; use cases
repeat the check before accessing persistence.

- `GET /organizations/:id/me/permissions`: effective role, custom role, data
  scope, and permission codes for the current member.
- `PUT /organizations/:id/roles/:roleId/members/:userId`: assign a custom role
  to a member.
- `DELETE /organizations/:id/roles/assignments/:userId`: clear a member's custom
  role without changing their system role.
- `GET /organizations/:id/permissions/catalog`: active permission catalog.
- `GET /organizations/:id/permissions/matrix`: role-permission matrix.

## Resources CRUD

Resources are always scoped to the validated `active_org` cookie and support
soft delete.

- `POST /resources`
- `GET /resources?page=1&limit=10&search=test&sortBy=createdAt&sortOrder=desc&status=ACTIVE`
- `GET /resources/:resourceId`
- `PATCH /resources/:resourceId`
- `DELETE /resources/:resourceId`

The list response contains `data` and pagination `meta`. Allowed sort fields
are `createdAt`, `updatedAt`, `name`, and `status`; `limit` is capped at 100.

## File storage (MinIO)

Brand images (organization logo/banner) and user avatars are stored in an
S3-compatible object store. Local development uses the MinIO service from
`docker-compose.yml`; the app talks to it through the `FileStorage` domain port
(`StorageModule`), so the adapter is swappable for real S3 in production.

- A single multi-tenant bucket (`MINIO_BUCKET`); object keys are namespaced per
  owner: `org/<id>/logo-<uuid>.<ext>`, `org/<id>/banner-<uuid>.<ext>`,
  `users/<id>/avatar-<uuid>.<ext>`.
- The bucket is given a **public-read** policy at startup — these assets are not
  sensitive and are served by direct URL (`MINIO_PUBLIC_URL`). Writes always go
  through the authenticated backend.
- Uploads validate type (`png`/`jpeg`/`webp`/`svg`) and size (max 2 MB),
  returning `400`/`413` on rejection.

Endpoints (`multipart/form-data`, field `file`):

- `POST /organizations/:id/logo` — requires `organization:update`.
- `POST /organizations/:id/banner` — requires `organization:update`.
- `POST /users/me/avatar` — authenticated user.

Configuration lives in the `MINIO_*` variables (see `.env.example`). The MinIO
web console is available at `http://localhost:9001`.

## Database & migrations

In development the schema is kept in sync by TypeORM's `DB_SYNCHRONIZE=true`,
which auto-applies entity changes (including the branding/storage columns) on
boot.

> **Production gap:** `DB_SYNCHRONIZE` must be `false` in production, but the
> project does not yet have a TypeORM migration tooling/workflow. Provisioning
> the schema in production (migration generation + run scripts) is still pending
> and tracked as a separate decision (see the `self-serve-onboarding-branding`
> change, task 10.2).

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
