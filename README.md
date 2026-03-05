# @passauth/express

`@passauth/express` is an Express integration for [passauth](https://www.npmjs.com/package/passauth).  
It gives you a ready-to-use authentication router, optional email-based auth flows, middleware for protected routes, and an OpenAPI generator.

## Features

- Plug-and-play auth routes for register/login/token refresh.
- Optional email routes for email confirmation and password reset.
- `AuthMiddleware` to validate bearer access tokens.
- `RoleGuard` to protect routes by role.
- Built-in OpenAPI schema generator for your auth API docs.
- Full TypeScript support.

## Installation

```bash
npm install @passauth/express express
```

> `express` is a peer dependency. You do not need to install `passauth` separately when using this package.

## Quick start

```ts
import express from "express";
import { PassauthExpress } from "@passauth/express";

const app = express();
app.use(express.json());

const auth = PassauthExpress({
  config: {
    // Passauth base configuration
    jwtSecret: process.env.JWT_SECRET!,
    refreshSecret: process.env.REFRESH_SECRET!,

    // Your passauth repository/user setup goes here
    // repo: ...
  },

  // Optional hooks
  hooks: {
    async afterLogin({ email }) {
      return {
        profileLoadedFor: email,
      };
    },
    afterHandler: {
      login({ data, result }) {
        return {
          token: result.accessToken,
          userEmail: data.email,
        };
      },
    },
    beforeHandler: {
      register(req) {
        const payload = req.body as {
          username: string;
          secret: string;
          nickname: string;
        };

        // Full override for POST /auth/register validation
        return {
          email: payload.username,
          password: payload.secret,
          nickname: payload.nickname,
        };
      },
    },
  },

  // Optional email configuration (enable email routes)
  // emailConfig: {
  //   from: "no-reply@your-app.com",
  //   sendEmail: async ({ to, subject, html }) => {
  //     // your email provider integration
  //   },
  // },
});

app.use("/auth", auth.setupRoutes());

app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});
```

## What `PassauthExpress` returns

```ts
type PassauthExpressInstance = {
  setupRoutes: () => Router;
  passauth: PassauthHandler<User>;
  utils: typeof import("passauth/auth/utils");
};
```

- `setupRoutes()`: builds and returns an Express router.
- `passauth`: the underlying passauth handler instance.
- `utils`: re-exported helper utilities from `passauth/auth/utils`.

## `PassauthExpress` parameters (detailed)

`PassauthExpress` expects one argument with this shape:

```ts
type PassauthExpressConfig = {
  config: PassauthConfiguration<User, []>;
  emailConfig?: EmailHandlerOptions;
  hooks?: {
    afterLogin?: (data: { email: string }) => Promise<any>;
    beforeHandler?: {
      register?: (req: Request) => Promise<any> | any;
      login?: (req: Request) => Promise<any> | any;
      refreshToken?: (req: Request) => Promise<any> | any;
      revokeRefreshToken?: (req: Request) => Promise<any> | any;
      registerSendEmail?: (req: Request) => Promise<any> | any;
      registerConfirmEmail?: (req: Request) => Promise<any> | any;
      resetPassword?: (req: Request) => Promise<any> | any;
      resetPasswordConfirm?: (req: Request) => Promise<any> | any;
    };
    afterHandler?: {
      register?: (params: { req: Request; data: any; result: any }) => Promise<any> | any;
      login?: (params: { req: Request; data: any; result: any }) => Promise<any> | any;
      refreshToken?: (params: { req: Request; data: any; result: any }) => Promise<any> | any;
      revokeRefreshToken?: (params: { req: Request; data: any; result: any }) => Promise<any> | any;
      registerSendEmail?: (params: { req: Request; data: any; result: any }) => Promise<any> | any;
      registerConfirmEmail?: (params: { req: Request; data: any; result: any }) => Promise<any> | any;
      resetPassword?: (params: { req: Request; data: any; result: any }) => Promise<any> | any;
      resetPasswordConfirm?: (params: { req: Request; data: any; result: any }) => Promise<any> | any;
    };
  };
};
```

### Top-level parameters

| Parameter | Type | Required | What it is for |
| --- | --- | --- | --- |
| `config` | `PassauthConfiguration<User, []>` | **Yes** | Main Passauth setup. This object is forwarded directly to `Passauth(...)` and defines how users are stored, authenticated, and tokenized. |
| `emailConfig` | `EmailHandlerOptions` | No | Enables email-related authentication flows (email confirmation and reset-password) and provides email delivery settings/handlers. |
| `hooks` | `{ afterLogin?: ..., beforeHandler?: ..., afterHandler?: ... }` | No | Lets you inject custom behavior into library flow. Supports pre-processing/validation and post-processing of responses per route. |

### `config` (required)

- **Type:** `PassauthConfiguration<User, []>`
- **Required:** Yes
- **Purpose:** Core Passauth configuration used internally to create the Passauth handler.
- **Typical content:** JWT/token secrets, repository integration, user lookup/creation strategy, and other Passauth options.

> Important: this package intentionally forwards `config` to `passauth` without changing its schema. The exact field list comes from `PassauthConfiguration` in the `passauth` package.

### `emailConfig` (optional)

- **Type:** `EmailHandlerOptions`
- **Required:** No
- **Purpose:** Activates and configures email flows.

When `emailConfig` is provided, these routes are enabled:

- `GET /auth/register/send-email`
- `POST /auth/register/confirm-email`
- `GET /auth/reset-password`
- `POST /auth/reset-password`

When `emailConfig` is omitted, those routes are not mounted.

### `hooks` (optional)

- **Type:** object
- **Required:** No
- **Purpose:** Extension points for custom logic.

#### `hooks.afterLogin`

- **Type:** `(data: { email: string }) => Promise<any>`
- **Required:** No
- **Called when:** after `POST /auth/login` succeeds.
- **Input parameter details:**
  - `data.email` (`string`, required): authenticated user email.
- **Return value:** `Promise<any>` (your custom object).
- **Behavior:** the resolved object is merged into the login response payload.
- **Precedence note:** this hook is ignored when `hooks.afterHandler?.login` is defined.

#### `hooks.beforeHandler`

- **Type:** object
- **Required:** No
- **Purpose:** lets you fully replace the default route pre-validation logic.
- **Behavior:** if a route-specific `beforeHandler` is provided, the built-in validator for that route is not executed.
- **Available route keys:**
  - `register` (`POST /auth/register`)
  - `login` (`POST /auth/login`)
  - `refreshToken` (`POST /auth/refresh-token`)
  - `revokeRefreshToken` (`POST /auth/refresh-token/revoke`)
  - `registerSendEmail` (`GET /auth/register/send-email`)
  - `registerConfirmEmail` (`POST /auth/register/confirm-email`)
  - `resetPassword` (`GET /auth/reset-password`)
  - `resetPasswordConfirm` (`POST /auth/reset-password`)

#### `hooks.afterHandler`

- **Type:** object
- **Required:** No
- **Purpose:** lets you replace the default successful response payload per route.
- **Behavior:** if a route-specific `afterHandler` is provided, the built-in response payload for that route is not used.
- **Input:** `{ req, data, result }`
- **Available route keys:**
  - `register` (`POST /auth/register`)
  - `login` (`POST /auth/login`)
  - `refreshToken` (`POST /auth/refresh-token`)
  - `revokeRefreshToken` (`POST /auth/refresh-token/revoke`)
  - `registerSendEmail` (`GET /auth/register/send-email`)
  - `registerConfirmEmail` (`POST /auth/register/confirm-email`)
  - `resetPassword` (`GET /auth/reset-password`)
  - `resetPasswordConfirm` (`POST /auth/reset-password`)

### Hook execution order

For each route, the pipeline is:

1. `beforeHandler.<route>` (if provided)  
2. Built-in route operation (`passauth.*`)  
3. `afterHandler.<route>` (if provided), otherwise default response payload

Notes:

- If `beforeHandler.<route>` exists, default validation for that route is fully replaced.
- If `afterHandler.<route>` exists, default success response for that route is fully replaced.
- For `POST /auth/login`, if `afterHandler.login` is not defined, `afterLogin` is applied on top of the default login tokens response.

### Hook usage examples

#### 1) Accept custom login payload and map to passauth fields

```ts
import { z } from "zod";

hooks: {
  beforeHandler: {
    login(req) {
      const payload = z
        .object({
          username: z.email(),
          secret: z.string().min(6),
        })
        .parse(req.body);

      return {
        email: payload.username,
        password: payload.secret,
      };
    },
  },
}
```

#### 2) Customize successful login response

```ts
hooks: {
  afterHandler: {
    login({ data, result }) {
      return {
        token: result.accessToken,
        userEmail: data.email,
      };
    },
  },
}
```

#### 3) Keep default login response and enrich with `afterLogin`

```ts
hooks: {
  async afterLogin({ email }) {
    return {
      profileLoadedFor: email,
      featureFlags: ["beta-a"],
    };
  },
}
```

#### 4) Customize email route input and output

```ts
hooks: {
  beforeHandler: {
    registerSendEmail(req) {
      return { email: String(req.query.mail) };
    },
  },
  afterHandler: {
    registerSendEmail({ data, result }) {
      return {
        delivered: result.success,
        target: data.email,
      };
    },
  },
}
```

## Built-in routes

When you mount `app.use("/auth", auth.setupRoutes())`, these routes are provided.

### Core routes (always enabled)

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/refresh-token/revoke` (requires auth + `admin` role)

### Email routes (only if `emailConfig` is set)

- `GET /auth/register/send-email?email=...`
- `POST /auth/register/confirm-email`
- `GET /auth/reset-password?email=...`
- `POST /auth/reset-password`

## Middleware

Import from `@passauth/express/middlewares`.

### `AuthMiddleware(passauthHandler)`

Validates `Authorization: Bearer <token>` access token and adds `req.sessionData`:

```ts
{
  user: {
    id: string;
    roles: string[];
  }
}
```

Returns `401 Unauthorized` if token validation fails.

### `RoleGuard(["role1", "role2"])`

Checks if `req.sessionData.user.roles` includes at least one required role.

Returns `403 Forbidden` when role requirements are not met.

### Example protected route

```ts
import { AuthMiddleware, RoleGuard } from "@passauth/express/middlewares";

app.get(
  "/admin/health",
  AuthMiddleware(auth.passauth),
  RoleGuard(["admin"]),
  (_req, res) => {
    res.json({ ok: true });
  },
);
```

## OpenAPI documentation

You can generate an OpenAPI 3.1 schema with:

```ts
import { getOpenApiDocumentation } from "@passauth/express/docs";

const openapi = getOpenApiDocumentation({
  url: "https://api.your-app.com",
  email: true, // include email routes
});
```

Serve it with Swagger UI/Redoc in your preferred way.

## Exports

### Main package

```ts
import {
  PassauthExpress,
  AuthMiddleware,
  RoleGuard,
  getOpenApiDocumentation,
} from "@passauth/express";
```

### Subpath exports

- `@passauth/express/interfaces`
- `@passauth/express/middlewares`
- `@passauth/express/docs`

## Notes

- This package expects your Passauth setup to provide user roles (`roles: string[]`) for role-based authorization.
- The package is ESM.
- For detailed Passauth configuration, see the `passauth` package documentation.
