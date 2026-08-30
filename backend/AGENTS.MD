# ConflictV2 repository guide for coding agents

This is the project-wide operating guide even though the file currently lives
under `backend/`. Paths in this document are relative to the repository root
unless a command explicitly changes directory. Read this file before inspecting
or changing either `backend/` or `frontend/`.

## 1. Operating rules

1. Inspect before editing. At minimum, read the relevant controller/API module,
   service/container, DTO/schema, tests, and configuration for the requested
   feature. Search all call sites before changing a public contract.
2. Treat the current working tree as user-owned. Run `git status --short` and a
   scoped diff before editing. If this Codex sandbox reports dubious repository
   ownership, use the per-command form
   `git -c safe.directory=E:/ConflictV2 status --short`; do not mutate global Git
   configuration. Never discard, reformat, or overwrite unrelated changes.
3. Make the smallest coherent vertical-slice change. A contract change normally
   requires backend validation/service/tests and frontend API/state/UI handling,
   not an isolated patch in one layer.
4. Use code and executable configuration as the source of truth. The files in
   `backend/plan/`, `backend/scripts/full-schema.sql`, the stock readmes, and the
   generic `.gemini/` rules contain useful intent but are partly stale or
   aspirational.
5. Never expose or commit secrets. Do not print `backend/.env`, `frontend/.env`,
   JWTs, OTPs, SMTP credentials, Cloudinary credentials, cookies, or personal
   data. Examples may contain development defaults; do not propagate them into
   source or documentation.
6. Do not edit generated/vendor/tooling output: `node_modules/`, `target/`,
   `dist/`, `.idea/`, `.tmp/`, Maven caches, or the bundled
   `backend/.gemini/skills/` catalog. Do not hand-edit lockfiles unless a package
   dependency actually changes.
7. Preserve UTF-8 Vietnamese text. Some Windows PowerShell output renders UTF-8
   as mojibake; that terminal rendering is not proof that a source file is
   corrupt. Inspect bytes/editor rendering before attempting an encoding fix.
8. Run the narrowest relevant check while iterating, then the full checks for the
   touched application before finishing. Report pre-existing failures separately
   from failures caused by the change.
9. Do not commit, push, rewrite history, start long-lived services, reset a
   database, or remove Docker volumes unless the user explicitly asks.

## 2. What this repository currently is

Conflict is a Vietnamese-facing mini social application. The implemented product
surface is authentication, account recovery, profile management/avatar upload,
and one-to-one friendship management. The home feed is currently presentation
data, not a persisted feed.

There are older names in the repository:

- `hadilao` remains in Maven coordinates/descriptions and one test class.
- `Roamly` and the `RML-` PIN prefix remain from an earlier travel/social concept.
- `scripts/full-schema.sql` sketches groups, itineraries, items, and messages,
  but those modules do not exist in application code or Flyway migrations.

Do not rename these remnants or implement the future travel schema as incidental
cleanup. The current Java base package is `com.conflict.be`, the Spring
application name is `conflict`, and the UI brand is Conflict.

## 3. Repository map

```text
ConflictV2/
|- backend/                  Spring Boot API and this guide
|  |- src/main/java/com/conflict/be/
|  |  |- core/               API envelope, config, security, exceptions, utilities
|  |  `- modules/            auth, user, friendship vertical slices
|  |- src/main/resources/    profiles and Flyway migrations V1..V6
|  |- src/test/              JUnit/Mockito/MockMvc tests and H2 test profile
|  |- scripts/               DB bootstrap plus a non-authoritative schema sketch
|  |- plan/                  historical design notes; verify against code
|  `- docker-compose.yml     local PostgreSQL and Redis only
|- frontend/                 React/Vite single-page application
|  |- src/app/               Redux store
|  |- src/services/          shared RTK Query base client and re-auth logic
|  |- src/features/          auth, profile, and friendship slices/pages/components
|  |- src/layouts/            shared header/footer/page shell
|  |- src/pages/              public home feed mockup
|  `- public/                 static icons, posters, and hero assets
|- .github/modernize/        IDE Java-upgrade hook support, not app runtime
|- ai/                       currently empty
|- package.json              no root scripts; only a stray duplicate dependency
`- README.md                 placeholder only
```

Important non-runtime material:

- `backend/document/` is currently empty.
- `frontend/README.md` is the default Vite readme.
- `frontend/src/features/friend/README.md` was an implementation tutorial. The
  friendship feature is now wired; inspect current code instead of assuming the
  tutorial's TODOs still apply.
- `backend/.github/workflows/ci.yml` describes Maven CI, but GitHub only discovers
  workflows under the repository-root `.github/workflows/`. In this monorepo
  layout that file is not an active root workflow.
- `backend/Dockerfile` is a placeholder Ubuntu image running `top`; it does not
  build or run the Spring application.

## 4. Technology and version constraints

### Backend

- Java source/target: **17** (`backend/pom.xml`); avoid Java 21-only syntax.
- Spring Boot 3.5.15, Spring MVC, Spring Security, Bean Validation.
- Spring Data JPA/Hibernate with PostgreSQL; Flyway owns production schema
  history.
- Redis for OTPs, rate counters, refresh-token state, reset tokens, and access
  token blacklist entries.
- JJWT 0.11.5, BCrypt, Spring Mail, Cloudinary, Springdoc/OpenAPI, Lombok.
- Tests: JUnit 5, Mockito, Spring Boot Test/MockMvc, H2 in PostgreSQL mode.

`backend/GEMINI.md` says Java 21 and record DTOs, but the executable build and
current code use Java 17 and mostly Lombok DTO classes. Match `pom.xml` and the
surrounding implementation unless a task explicitly upgrades the project.

### Frontend

- React 19, React DOM 19, React Router 7.
- Redux Toolkit/React Redux; RTK Query is the server-state/API layer.
- Vite 8, plain JavaScript/JSX (no TypeScript).
- Tailwind CSS 3 plus a small global stylesheet.
- `async-mutex` serializes refresh-token attempts.
- Axios, React Hook Form, Zod, and Hook Form resolvers are installed but currently
  unused. Do not introduce a second HTTP/state/form pattern without a concrete
  reason.

## 5. Local setup and commands

### Prerequisites

- JDK 17 or newer capable of compiling for Java 17.
- Maven 3.9.x, or the checked-in Maven wrapper.
- A modern Node.js release supported by Vite 8 and `npm`.
- Docker/Compose for the normal local PostgreSQL and Redis setup.

### Infrastructure and backend

From `backend/`:

```bash
docker compose up -d postgres redis
```

Copy `.env.example` to the ignored `.env` and replace placeholder secrets. The
application loads the `local` profile by default. Then run:

```bash
./mvnw spring-boot:run
```

On Windows use `mvnw.cmd spring-boot:run`. If the wrapper hits its known Windows
PowerShell `Target[0]` startup issue and Maven is installed, use:

```bash
mvn spring-boot:run
```

Local endpoints:

- API: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- PostgreSQL host port: `5433`
- Redis host port: `6380`

The Compose Redis port is `6380`, while `application-local.yml` defaults to
`6379`. A correct `REDIS_PORT=6380` in `backend/.env` is therefore required when
using this Compose file.

### Frontend

From `frontend/`:

```bash
npm ci
npm run dev
```

`frontend/.env.example` is currently empty. The frontend still requires this
ignored local setting:

```dotenv
VITE_API_URL=http://localhost:8080/api
```

The `/api` suffix belongs in `VITE_API_URL`: frontend endpoint definitions start
with `/v1/...`, while backend mappings start with `/api/v1/...`. Vite serves on
`http://localhost:5173`, the only origin currently allowed by backend CORS.

### Verification commands

Backend, from `backend/`:

```bash
mvn test
mvn clean verify
mvn -Dtest=AuthServiceTest test
```

The wrapper equivalents are preferred where they work. Tests use the `test`
profile, H2, `ddl-auto=create-drop`, and Flyway disabled; they do not require the
local PostgreSQL/Redis containers when dependencies are mocked correctly.

Frontend, from `frontend/`:

```bash
npm run lint
npm run build
npm run preview
```

There is currently no frontend `test` script or test framework.

Audit baseline on 2026-08-30:

- `mvn test`: 55 tests passed.
- `npm run build`: passed.
- `npm run lint`: one pre-existing error in `src/hooks/useFetch.js:9`
  (`react-hooks/set-state-in-effect`). The hook is currently unused.

Rerun checks; do not assume this dated baseline is still current.

## 6. Configuration and secret handling

Backend configuration flows from `application.yml` -> active `local` profile ->
environment/`.env` placeholders in `application-local.yml`.

Recognized backend environment keys:

```text
DB_URL, DB_USERNAME, DB_PASSWORD
REDIS_HOST, REDIS_PORT
MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD
JWT_SECRET
COOKIE_SECURE, COOKIE_SAME_SITE
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
CLOUDINARY_FOLDER
```

Rules:

- `JWT_SECRET` is Base64-decoded by `JwtProvider` and must be suitable for HS256.
- Local cookie defaults are `Secure=false`, `SameSite=Lax`; production must
  deliberately set secure cross-origin behavior together with HTTPS and CORS.
- `application-local.yml` is tracked and contains fallback values, including
  secret-like values. Never add real credentials there, quote them in output, or
  treat a checked-in fallback as safe. Prefer environment variables and rotate
  any credential suspected of being real.
- `.env` files are ignored and must stay ignored. `.env.example` may contain only
  non-production placeholders.
- Test Cloudinary/JWT values are fixtures. Tests must mock outbound storage/mail
  behavior rather than contact real services.

## 7. Backend architecture and conventions

### Request path

`@RestApiV1` combines `@RestController` with base mapping `/api/v1`. Controllers
use paths from `UrlConstant` where available, validate boundary DTOs with
`@Valid`, and delegate business logic to services. Services own normalization,
authorization-sensitive business checks, transactions, and DTO mapping.
Repositories own JPA access.

Keep these boundaries:

- Controllers: HTTP binding/status/cookie/envelope only; no persistence logic.
- Services: business rules and transaction boundaries.
- Repositories: parameterized Spring Data methods/JPQL; eagerly fetch associations
  needed after a read-only transaction when appropriate.
- DTOs: never return JPA entities or password/token storage fields.
- Config/security/common behavior stays under `core/`; feature-specific behavior
  stays under its `modules/<feature>/` slice.
- Use constructor injection (`@RequiredArgsConstructor` or an explicit
  constructor), not field injection. Follow surrounding Lombok/style rather than
  mechanically rewriting existing classes to records.

### Response and error contract

All controller success/error bodies should use `ApiResponse<T>`:

```json
{
  "code": 200,
  "status": "success",
  "message": "optional",
  "data": {},
  "errorCode": "present on errors",
  "timestamp": "instant"
}
```

HTTP status is authoritative. The envelope's success `code` is currently always
200, including the register response whose HTTP status is 201. Do not silently
change this contract in only one endpoint.

Business failures should throw `AppException(ErrorCode.X)`. Validation annotation
messages are enum keys such as `MISSING_EMAIL`; `GlobalExceptionHandler` maps them
to the same envelope. When adding an error, update `ErrorCode`, backend tests, and
any feature-specific frontend error map. Do not expose stack traces or raw
database/provider messages.

### Authentication/session design

- Access JWT: returned in JSON, stored only in Redux memory, sent as
  `Authorization: Bearer ...`.
- Refresh JWT: omitted from JSON with `@JsonIgnore`; set as an HttpOnly cookie
  named `refresh_token`, path `/api/v1/auth`.
- Redis stores one refresh token at `refresh:{email}`. A new login/refresh
  replaces it, so this is effectively one active refresh session per email.
- On browser startup, `AuthInitializer` calls refresh, stores the new access
  token, then loads `/users/me`. Page reload survival depends on the refresh
  cookie; tokens are intentionally not in local/session storage.
- The frontend base query includes credentials and attaches the access token. On
  a non-public 401, one mutex-protected refresh runs, then queued requests retry.
- Logout deletes the Redis refresh token and blacklists the current access-token
  JTI until the configured access-token lifetime expires.
- Registration creates/updates a `PENDING` user, stores a five-minute OTP under
  `otp:register:{email}`, and sends email. OTP verification activates the user and
  issues tokens.
- Forgot password intentionally returns the same success message for unknown,
  pending, banned, and eligible accounts. Eligible accounts get a five-minute
  `otp:forgot:{email}`. Verification exchanges it for a short-lived reset token
  also stored as `reset_token:{email}`; reset compares that stored token, changes
  the password, and deletes the reset and refresh keys.

Current Redis keys and policies:

| Key pattern | Purpose / lifetime |
| --- | --- |
| `otp:register:{email}` | Registration OTP, 5 minutes |
| `otp:forgot:{email}` | Recovery OTP, 5 minutes |
| `refresh:{email}` | Single stored refresh token, normally 30 days |
| `reset_token:{email}` | Password-reset token, configured short lifetime |
| `blacklist:jti:{jti}` | Logged-out access-token marker |
| `rate_limit:login_ip:{ip}` | 10 login attempts per 15 minutes |
| `failed:login:{email}` | Failed-password counter, 15 minutes |
| `rate_limit:forgot:{email}` | 3 forgot-password calls per hour |
| `rate_limit:register:{ip}` | Helper exists for 5/hour, but is not called |

When changing auth routes, update all of these together:

1. `UrlConstant`, controller/service/DTO/security permit list.
2. Frontend `authApi.js` and `PUBLIC_AUTH_URLS` in `baseApi.js`.
3. Cookie path/CORS/`credentials: "include"` assumptions if origins or prefixes
   change.
4. Backend tests and the relevant frontend flow/error handling.

### Implemented HTTP API

All paths below include the `/api/v1` backend prefix. “Public” means no access JWT
is required by `SecurityConfig`; refresh-cookie requirements still apply.

| Method and path | Access | Input / important result |
| --- | --- | --- |
| `POST /auth/register` | Public | JSON `email,password,confirmPassword,fullName`; creates/sends OTP, HTTP 201 |
| `POST /auth/verify-otp` | Public | JSON `email,otpCode`; returns `user,accessToken,expiresIn` and refresh cookie |
| `POST /auth/login` | Public | JSON `email,password`; same auth result/cookie |
| `POST /auth/refresh-token` | Public | Reads refresh cookie; rotates it and returns `accessToken,expiresIn` |
| `POST /auth/forgot-password` | Public | JSON `email`; deliberately generic success response |
| `POST /auth/verify-otp-forgot-password` | Public | JSON `email,otpCode`; returns `resetToken` |
| `POST /auth/reset-password` | Public | JSON `email,resetToken,newPassword,confirmNewPassword` |
| `POST /auth/logout` | JWT | Requires bearer access token; clears server refresh state/cookie |
| `POST /auth/change-password` | JWT | JSON `oldPassword,newPassword,confirmNewPassword` |
| `GET /users/me` | JWT | Returns current `UserDTO` |
| `PATCH /user/update-profile` | JWT | Multipart `fullName,dateOfBirth,address,gender,avatar` |
| `POST /friends/requests` | JWT | JSON `{ "pinCode": "RML-123456" }`; returns request DTO |
| `GET /friends/requests/incoming` | JWT | Returns incoming request array |
| `GET /friends/requests/outgoing` | JWT | Returns outgoing request array |
| `PATCH /friends/requests/{id}/accept` | JWT | `{id}` is `requestId`; returns friend DTO |
| `DELETE /friends/requests/{id}` | JWT | `{id}` is `requestId`; either participant may remove pending request |
| `GET /friends` | JWT | Returns accepted friend array |
| `DELETE /friends/{id}` | JWT | `{id}` is `friendshipId`, not the other user's ID |

Profile multipart semantics are intentional: `fullName` is required; omitted
optional fields preserve their old values, while fields sent as empty strings are
marked “provided” by custom setters and clear the stored value. Avatar accepts
JPEG/PNG/WebP up to 5 MiB and validates both MIME type and file signature.

Friendship DTO identity rules are easy to misuse:

```text
FriendDTO:        friendshipId, user{id,fullName,avatarUrl}, friendsSince
FriendRequestDTO: requestId, user{id,fullName,avatarUrl}, status, createdAt
```

Accept/cancel/decline uses `requestId`; unfriend uses `friendshipId`; neither uses
`user.id`.

## 8. Persistence model

### Users

`User` uses UUID identity, unique email and `RML-######` PIN, BCrypt password hash,
profile/avatar fields, timestamps, soft-delete flag, and status
`PENDING|ACTIVE|BANNED`. It implements `UserDetails` and currently has no roles or
authorities. Default avatars come from `ui-avatars.com`; uploaded avatars are
stored in Cloudinary with the provider public ID retained for cleanup.

### Friendships

One row represents an unordered pair of users. It stores `lowUser`, `highUser`,
the original requester, `PENDING|ACCEPTED`, timestamps, and `acceptedAt`.
`FriendshipService` canonicalizes the pair, rejects self/duplicate requests, and
uses pessimistic locking for accept/remove operations. Database constraints also
enforce one unordered pair and valid requester/status relationships.

### Schema rules

- Flyway migrations under `backend/src/main/resources/db/migration/` are the
  authoritative PostgreSQL history: V1 users, V2 avatar public ID, V3 profile
  fields, V4 account status, V5 friendships, V6 legacy-column cleanup.
- Add a new `V{next}__description.sql`; never edit an applied migration merely to
  match a changed entity.
- Update the entity, migration, DTO mapping, validation, and tests together.
- `scripts/init-db.sql` only enables `pgcrypto`; Compose creates the database and
  Flyway creates implemented tables.
- `scripts/full-schema.sql` is explicitly reference-only and contains
  unimplemented travel/chat tables. Do not run it as the migration source.
- Local `ddl-auto: update` can hide migration drift. Validate real schema changes
  against a fresh Flyway-managed PostgreSQL database, not only H2 or an already
  mutated local database.

## 9. Frontend architecture and conventions

### Routing

`src/main.jsx` wraps the app in Redux, BrowserRouter, and `AuthInitializer`.
`src/App.jsx` defines:

| Route | Behavior |
| --- | --- |
| `/` | Public home/feed mockup |
| `/login`, `/register` | Public auth pages |
| `/verify-otp` | Registration OTP; email comes from router state |
| `/forgot-password` | Starts recovery |
| `/verify-otp-forgot-password` | Recovery OTP; email comes from router state |
| `/reset-password` | Email/reset token come from router state |
| `/friends` | Protected friendship feature |
| `/profile` | Protected profile details/edit/logout |
| `/profile/friends` | Redirects to `/friends` |
| `/profile/favorites`, `/profile/history` | Protected placeholders only |
| any other route | Redirects to `/` (or profile wildcard to `/profile`) |

Router state is deliberately used to avoid putting email/reset tokens in URLs,
but a direct reload loses that state. Preserve or deliberately redesign this
security/UX tradeoff when changing recovery routes.

### State and API flow

- `authSlice` owns only client auth state: `user`, `accessToken`, initialized and
  authenticated flags, plus an currently unused password-reset context.
- `baseApi` is the sole server-state client. Add feature endpoints with
  `baseApi.injectEndpoints`; do not add ad-hoc `fetch`, Axios clients, or a Redux
  slice for data already owned by RTK Query.
- Call mutation promises with `.unwrap()` so component `try/catch` handles API
  failures.
- Backend responses are enveloped. Auth/profile mutations generally receive the
  full envelope and read `response.data`; friendship queries use
  `transformResponse` and therefore return arrays directly.
- Maintain cache tags. Friendship mutations invalidate `Friend/LIST` and/or
  `FriendRequest/INCOMING|OUTGOING`; profile updates invalidate `CurrentUser` and
  also dispatch the returned user into `authSlice` for immediate header/profile
  consistency.
- Keep server state in RTK Query and transient presentation state in local
  `useState` (open modal, input, pending item, feedback).

### Feature ownership

- `features/auth/`: API definitions, Redux credentials, initialization/protection,
  and register/login/OTP/recovery UI.
- `features/profile/`: `/users/me`, multipart update, accessible update/logout
  portals, and the profile page.
- `features/friend/`: API/cache contract, error-code mapping, container page, and
  presentational form/card/section/modal components. `FriendsPage` owns queries,
  mutations, and handlers; child cards/forms receive props and should not call
  APIs independently.
- `pages/HomePage.jsx`: hard-coded stories/contacts/posts plus current-user
  personalization. Do not mistake it for a feed API implementation.
- `hooks/useFetch.js`: legacy, unused, and currently lint-failing. Prefer RTK Query.

### UI style

- The document language is Vietnamese (`lang="vi"`). Keep user-facing copy
  natural and UTF-8.
- Tailwind utilities are the dominant styling mechanism. Reuse tokens in
  `tailwind.config.js`: `social.canvas/paper/ink/muted/violet/pink/mint/peach/yellow`,
  `font-sans`, and the soft/card shadows.
- Current visual language is soft pastel social UI: rounded cards, subtle borders,
  gradients, responsive mobile-first layouts, and visible violet focus rings.
  Preserve consistency unless a task explicitly redesigns it.
- Existing modals use portals, focus trapping, Escape/backdrop close, body scroll
  locking, focus restoration, ARIA labels, loading/disabled states, and
  reduced-motion support. New dialogs should preserve those accessibility
  behaviors, ideally via a reusable primitive if refactoring is in scope.
- Keep controls keyboard accessible and do not use clickable non-semantic
  containers. Supply meaningful `alt`, `aria-*`, error/status live regions, and
  touch-friendly hit targets.

## 10. Tests and change-specific verification

Backend tests mirror main packages. Current strong coverage is around auth
registration/OTP, user registration/profile, avatar storage, and controller
validation. There are currently no friendship tests and limited coverage for JWT
filter/provider, refresh/logout/recovery, rate limiting, and mail behavior. Add
focused tests when changing those areas rather than relying on the green 55-test
baseline.

There is no configured Checkstyle, formatter, JaCoCo threshold, or frontend test
runner. Generic `.gemini` recommendations such as mandatory 80% coverage are not
currently enforced by this build. Match the touched file's formatting, avoid
drive-by reformatting, and add behavior-focused coverage proportional to risk.

For backend changes:

1. Unit-test business branches with Mockito.
2. Use MockMvc/Spring Boot tests for request binding, security, status, cookie,
   and envelope behavior.
3. Use the `test` profile; mock Redis, mail, and Cloudinary unless integration is
   the explicit subject.
4. For JPA constraints/locking/migrations, H2 parity is insufficient—add or run a
   PostgreSQL-backed integration check where risk warrants it.
5. Finish with `mvn clean verify`.

For frontend changes:

1. Exercise loading, empty, success, API error, network error, and disabled/pending
   states for the changed flow.
2. Verify desktop and narrow viewport behavior plus keyboard focus/escape handling
   for dialogs.
3. Run `npm run lint` and distinguish the known legacy-hook lint issue from new
   errors.
4. Run `npm run build`. If adding a test framework, add an explicit `test` script
   and document it here.

For cross-stack contract changes, verify the real request path/body/content type,
HTTP status, envelope shape, cookie behavior, cache invalidation, and frontend
error mapping end to end.

## 11. Known mismatches and fragile areas

These are observations, not blanket authorization to fix unrelated code:

- Java 17 in `pom.xml`/CI conflicts with the Java 21 statement in `GEMINI.md`.
- Compose exposes Redis on 6380; local YAML falls back to 6379.
- `application-local.yml` enables both Flyway and Hibernate `ddl-auto:update`.
- The local logging package `com.hit.conflict` does not match
  `com.conflict.be`; SQL logging is very verbose, including during tests.
- `MailService` methods are annotated `@Async`, but the application has no
  `@EnableAsync`; mail is not guaranteed to run asynchronously. Mail exceptions
  are swallowed after logging, so registration/recovery can report success when
  delivery failed.
- `RateLimiterService.isRegisterAllowed` exists but registration does not call it,
  despite the registration plan saying it should.
- The failed-email login limiter ignores `isLoginEmailAllowed`'s return value and
  checks `count > 5` before the next password attempt; the sixth failed password
  can therefore be recorded before later requests are blocked. `ACCOUNT_LOCKED`
  is defined but this path returns `INVALID_CREDENTIALS`.
- CORS is hard-coded to localhost:5173, credentials are allowed, and CSRF is
  disabled. Treat cookie/origin changes as security-sensitive.
- `SecurityConfig` contains duplicate public matcher entries. The exception
  handler imports `java.nio.file.AccessDeniedException`, not Spring Security's
  access-denied type.
- JWT parsing/filter exceptions are not explicitly normalized into the API error
  envelope; test expired/malformed-token behavior before relying on frontend 401
  refresh handling.
- Only one refresh token is stored per email, so a second login can invalidate a
  first device's refresh session.
- Access-token blacklist TTL uses the full configured lifetime rather than the
  token's remaining lifetime.
- Registration has a check-then-save PIN collision window; the database unique
  constraint is the final defense and the generic integrity handler currently
  maps every integrity violation to `USER_EXISTED`.
- `FriendPair.java` in the friendship DTO package is unused; the service has its
  own private pair record.
- Frontend recovery/OTP pages depend on in-memory router state. Registration OTP
  redirects when state is absent; the forgot/reset pages are less defensive.
- `useChangePasswordMutation` exists but no current page invokes it.
- There is no resend-OTP endpoint/UI behavior even though historical plans discuss
  it.
- Root `package.json` is not a workspace and has no scripts; run npm commands only
  from `frontend/`.
- The nested backend workflow and placeholder Dockerfile do not provide a working
  monorepo CI/deployment path.

When a requested task touches one of these areas, confirm current behavior with a
test first, then fix only the relevant mismatch and update this guide if the
repository truth changes.

## 12. Definition of done for an agent

Before handing off:

- Re-read the user request and verify every requested behavior is covered.
- Inspect the final scoped diff; confirm no unrelated user change was overwritten.
- Confirm API/schema/state changes are synchronized across affected layers.
- Run and report the relevant tests, lint, and build, including exact residual
  failures.
- Do not claim runtime or end-to-end verification that was not actually run.
- Update this `AGENTS.MD` when commands, architecture, contracts, or known baseline
  facts materially change.
