# ConflictV2 frontend guide for coding agents

This file governs work under `frontend/`. Read it before changing the React
application. For backend architecture, database rules, security implementation,

and the complete HTTP contract, also read `../backend/AGENTS.MD`. When the two
documents disagree, verify the current code and executable configuration; code is
the source of truth.

## 1. Working rules

1. Inspect the current working tree and the complete feature path before editing.
   Read the page/container, child components, RTK Query endpoint, auth state, route,
   and matching backend DTO/controller for any API-facing change.
2. Preserve user-owned changes. Never reset, mass-format, or replace unrelated
   frontend files. Use a scoped diff before and after the task.
3. Make the smallest coherent change. Keep server state in RTK Query, global
   authentication state in `authSlice`, and transient UI state in the owning
   component.
4. Use the established React/Redux/Tailwind patterns. Do not introduce another
   HTTP client, state library, form library, CSS system, or component framework
   merely because a dependency is installed.
5. Preserve UTF-8 Vietnamese copy. Windows PowerShell may display valid UTF-8 as
   mojibake; verify in the editor/browser before changing encoding.
6. Do not edit `node_modules/`, `dist/`, `.env`, generated assets, IDE files, or
   lockfiles unless the task genuinely changes dependencies.
7. Never store or log access tokens, refresh cookies, reset tokens, OTPs, user
   details, or secrets. Do not move tokens into localStorage/sessionStorage.
8. Run `npm run lint` and `npm run build` after relevant changes. Report the
   known baseline lint failure separately from new failures.
9. Do not commit, push, publish, or start a long-running dev server unless the user
   asks.

## 2. Application snapshot

Conflict is a Vietnamese mini social SPA. The implemented frontend includes:

- registration and email OTP verification;
- login, refresh-cookie session recovery, and logout;
- forgot-password OTP verification and password reset;
- protected profile display and multipart profile/avatar editing;
- protected incoming/outgoing/accepted friendship management;
- a public social-style home screen populated with static presentation data.

Not implemented in the UI:

- persisted feed/posts/stories/reactions/comments;
- favorites and history content (routes are placeholders);
- a change-password screen, although the RTK Query mutation exists;
- resend-OTP behavior;
- frontend automated tests;
- travel/group/itinerary/chat features sketched by old backend artifacts.

Do not turn mock or placeholder UI into a new product feature unless requested.

## 3. Stack and constraints

- React 19 and React DOM 19.
- React Router 7 with `BrowserRouter` and declarative `<Routes>`.
- Redux Toolkit and React Redux.
- RTK Query as the only active API/server-state layer.
- Vite 8, JavaScript/JSX ES modules, no TypeScript.
- Tailwind CSS 3 and PostCSS/Autoprefixer.
- `async-mutex` for serialized refresh-token recovery.
- ESLint 10 with recommended JS, React Hooks, and Vite React Refresh rules.

Installed but currently unused: Axios, React Hook Form, Zod, and
`@hookform/resolvers`. Existing forms use controlled React state and RTK Query.
Do not assume installed means adopted.

## 4. Directory ownership

```text
frontend/
|- src/
|  |- main.jsx                    application providers and bootstrap
|  |- App.jsx                     complete route table
|  |- index.css                   Tailwind layers and global base behavior
|  |- app/store.js                Redux store and RTK Query middleware
|  |- services/baseApi.js         base URL, bearer header, refresh mutex, tags
|  |- features/
|  |  |- auth/                    auth API, slice, selectors, guards, pages/layout
|  |  |- profile/                 current-user API, profile page, update/logout UI
|  |  `- friend/                  friendship API, errors, container, components
|  |- layouts/                    shared header/footer/main shell
|  |- pages/HomePage.jsx          public static social feed
|  |- hooks/useFetch.js           unused legacy hook; avoid for new API work
|  `- assets/                     imported image assets
|- public/                        URL-addressable static icons/posters/hero images
|- tailwind.config.js             design tokens and content scanning
|- eslint.config.js               lint configuration
|- vite.config.js                 React plugin only; no proxy configured
|- .env                           ignored local API URL; never inspect/commit values
`- .env.example                   currently empty and incomplete
```

Feature boundaries:

- A feature API module injects endpoints into `baseApi`.
- A feature page is the data/container boundary.
- Child cards/forms/sections are presentational and receive data and callbacks.
- Shared chrome belongs in `layouts/`, not copied into feature pages.
- Generic infrastructure belongs in `services/` or `app/`, not inside one page.

## 5. Setup, environment, and commands

From `frontend/`:

```bash
npm ci
npm run dev
```

Required ignored local configuration:

```dotenv
VITE_API_URL=http://localhost:8080/api
```

The value must include `/api`. Endpoint definitions start with `/v1`, producing
backend URLs such as `http://localhost:8080/api/v1/auth/login`. There is no Vite
development proxy.

Normal local addresses:

- frontend: `http://localhost:5173`;
- backend: `http://localhost:8080`;
- backend API base: `http://localhost:8080/api/v1`.

Backend CORS currently permits only `http://localhost:5173` and permits
credentials. If the frontend origin changes, coordinate CORS, cookie
`Secure`/`SameSite`, HTTPS, and `credentials: "include"` rather than changing only
the Vite URL.

Available scripts:

```bash
npm run dev       # Vite development server
npm run build     # production bundle into ignored dist/
npm run lint      # ESLint over the project
npm run preview   # serve the built bundle locally
```

There is no `test` script. On Windows environments that block `npm.ps1`, use the
same commands through `npm.cmd`, for example `npm.cmd run build`.

Audit baseline on 2026-08-30:

- `npm run build` passes.
- `npm run lint` has one pre-existing error at `src/hooks/useFetch.js:9` from
  `react-hooks/set-state-in-effect`.

Rerun these checks; do not assume the dated baseline is still valid.

## 6. Bootstrap and routing

`src/main.jsx` mounts this provider order:

```text
StrictMode
`- Redux Provider
   `- BrowserRouter
      `- AuthInitializer
         `- App
```

`AuthInitializer` deliberately blocks route rendering until the first refresh and
current-user attempt completes. React Strict Mode can invoke development effects
more than once; its `hasStarted` ref prevents a duplicate initialization request.
Do not remove this guard without testing development and production behavior.

Current routes from `src/App.jsx`:

| Route | Access | Owner / behavior |
| --- | --- | --- |
| `/` | Public | `HomePage`, static feed personalized from auth state |
| `/login` | Public | Login and set credentials |
| `/register` | Public | Register then pass email in router state |
| `/verify-otp` | Public | Registration OTP; redirects to register if email state is absent |
| `/forgot-password` | Public | Start generic account recovery |
| `/verify-otp-forgot-password` | Public | Recovery OTP; receives email via router state |
| `/reset-password` | Public | Receives email/reset token via router state |
| `/friends` | Protected | Friendship container |
| `/profile` | Protected | Profile information/edit/logout |
| `/profile/friends` | Protected | Redirect to `/friends` |
| `/profile/favorites` | Protected | Planned placeholder |
| `/profile/history` | Protected | Planned placeholder |
| unmatched route | Public | Redirect to `/` |

Protected routes require initialization complete, `isAuthenticated`, and a user.
They preserve the attempted pathname in navigation state, although login currently
always navigates to `/` after success.

Router state keeps email and reset tokens out of URLs, but it is volatile. A page
reload/direct visit can lose recovery context. Registration verification has an
explicit missing-state redirect; the recovery verification/reset pages are less
defensive. Any persistence redesign is security-sensitive: do not put reset
tokens in localStorage or a query string without an explicit requirement and
threat review.

## 7. Authentication and session state

### Redux state

`features/auth/authSlice.js` owns:

```text
user
accessToken
isAuthenticated
isInitialized
passwordReset { email, resetToken }
```

The password-reset context reducers/selectors exist but current pages pass
recovery context through React Router state instead. Do not maintain two competing
sources of truth. Either continue router state or deliberately migrate all
recovery pages to one reviewed approach.

Reducer semantics:

- `setCredentials`: stores user/token and considers either one authenticated.
- `setAccessToken`: used during refresh before `/users/me` completes.
- `setCurrentUser`: merges the latest profile response into auth-facing UI.
- `clearCredentials`: clears user, token, authentication, and reset context but
  intentionally does not reset the initialization flag.
- `setAuthInitialized`: unblocks rendering after startup recovery.

`ProtectedRoute` is stricter than `setCredentials`: it requires both authenticated
state and a user object.

### Startup and refresh flow

```text
browser starts
  -> POST /v1/auth/refresh-token (HttpOnly refresh cookie sent)
  -> store returned accessToken in Redux
  -> GET /v1/users/me with bearer access token
  -> store user + token, mark initialized
  -> on any failure, clear credentials and still mark initialized
```

The access token is memory-only. The refresh token is an HttpOnly backend cookie
and must remain inaccessible to JavaScript. Page refresh works by repeating the
flow above.

### Automatic re-authentication

`services/baseApi.js` wraps `fetchBaseQuery`:

1. wait for an existing refresh mutex;
2. send the original request with cookies and optional bearer token;
3. for a 401 on a non-public endpoint, acquire the mutex;
4. call `/v1/auth/refresh-token` once;
5. store the new access token and retry the original request;
6. clear credentials if refresh fails;
7. queued requests retry only after the mutex releases and a token exists.

`PUBLIC_AUTH_URLS` prevents recursive refresh attempts. When adding or renaming a
public auth endpoint, update that set and backend `SecurityConfig` together.

Never bypass this wrapper for authenticated calls. A raw Axios/fetch request would
lose bearer attachment, cookie credentials, refresh serialization, common error
shape, and cache integration.

## 8. RTK Query conventions

`baseApi` is registered once in `app/store.js` with its reducer and middleware.
Active tag types:

```text
CurrentUser
Friend
FriendRequest
```

Rules for endpoints and consumers:

- Define endpoints with `baseApi.injectEndpoints` in the owning feature.
- Endpoint URLs are relative `/v1/...` strings; do not repeat `/api`.
- Use `.unwrap()` inside event handlers so `try/catch/finally` receives normal
  success values and rejected API error objects.
- The backend wraps payloads in `ApiResponse`. State clearly whether an endpoint
  returns the full envelope or uses `transformResponse` to expose `data`.
- Prefer tag invalidation to manual array mutation/refetch. Add a tag type to
  `baseApi` before using it in a feature.
- Avoid duplicating server collections in `authSlice` or new feature slices.
- Use query `isLoading/isError/refetch` and mutation `isLoading` to implement
  explicit loading, error, retry, and disabled states.

Current response behavior:

| API module | Endpoint type | Hook receives |
| --- | --- | --- |
| `authApi.js` | all mutations | full `ApiResponse`; pages read `response.data` where needed |
| `userApi.js:getCurrentUser` | query | full `ApiResponse`; initializer reads `.data` |
| `userApi.js:updateProfile` | mutation | full `ApiResponse`; modal dispatches `.data` |
| friendship list queries | query | transformed `response.data` arrays |
| friendship mutations | mutation | full envelope, usually used only for success/failure |

Do not accidentally call `friends.data.map(...)`: `useGetFriendsQuery()` already
returns the array because of `transformResponse`.

## 9. Backend response and error contract

The normal backend envelope is:

```json
{
  "code": 200,
  "status": "success",
  "message": "optional",
  "data": {},
  "errorCode": "error enum key",
  "timestamp": "ISO instant"
}
```

HTTP status is authoritative. RTK Query error handlers normally receive:

```text
error.status
error.data.message
error.data.errorCode
```

Handle `status === "FETCH_ERROR"` separately for an unreachable backend. Use
feature-specific error-code maps where stable business errors need natural
Vietnamese copy; otherwise fall back to the backend message, then a safe generic
message. Never render raw exceptions, stack traces, HTML, or provider details.

Frontend endpoint inventory, relative to `VITE_API_URL`:

| Method and URL | Input / result |
| --- | --- |
| `POST /v1/auth/register` | `email,password,confirmPassword,fullName` |
| `POST /v1/auth/verify-otp` | `email,otpCode`; auth credentials in `data` |
| `POST /v1/auth/login` | `email,password`; auth credentials in `data` |
| `POST /v1/auth/refresh-token` | cookie input; new access token in `data` |
| `POST /v1/auth/logout` | bearer token; backend clears refresh cookie/state |
| `POST /v1/auth/forgot-password` | `email`; generic success by design |
| `POST /v1/auth/verify-otp-forgot-password` | `email,otpCode`; reset token in `data` |
| `POST /v1/auth/reset-password` | `email,resetToken,newPassword,confirmNewPassword` |
| `POST /v1/auth/change-password` | `oldPassword,newPassword,confirmNewPassword`; hook unused by UI |
| `GET /v1/users/me` | current `UserDTO` in `data` |
| `PATCH /v1/user/update-profile` | multipart profile fields/avatar |
| `GET /v1/friends` | transformed friend array |
| `GET /v1/friends/requests/incoming` | transformed incoming array |
| `GET /v1/friends/requests/outgoing` | transformed outgoing array |
| `POST /v1/friends/requests` | `{pinCode}` |
| `PATCH /v1/friends/requests/{requestId}/accept` | accept incoming request |
| `DELETE /v1/friends/requests/{requestId}` | reject/cancel pending request |
| `DELETE /v1/friends/{friendshipId}` | remove accepted friendship |

Identity is a frequent integration trap:

```text
FriendDTO        -> friendshipId, user, friendsSince
FriendRequestDTO -> requestId, user, status, createdAt
```

Use `requestId` for accept/reject/cancel and `friendshipId` for unfriend. Never
substitute `user.id`.

## 10. Feature guides

### Auth

Files:

- `features/auth/authApi.js`: endpoint hooks;
- `authSlice.js` and `authSelectors.js`: client credentials/flags;
- `components/AuthInitializer.jsx`: refresh and `/me` bootstrap;
- `components/ProtectedRoute.jsx`: protected route gate;
- `layouts/AuthLayout.jsx`: public auth shell;
- `pages/`: controlled forms and OTP flows.

Auth pages currently use local `useState`, browser validation attributes, explicit
server error state, RTK Query `.unwrap()`, and navigation after success. Match the
pattern for small additions. If forms become substantially more complex, adopting
the installed React Hook Form/Zod stack must be a coherent feature-wide decision,
not a one-page divergence.

Password validation must stay aligned with backend rules: at least eight
characters with uppercase, lowercase, digit, and one of the accepted special
characters. The backend remains authoritative; frontend checks improve UX only.

OTP input pages support single-character entry, numeric filtering, paste, arrow
navigation, and backspace focus movement. Preserve keyboard behavior when
refactoring duplicated OTP UI.

### Profile

`ProfilePage` reads the authenticated user from Redux. Favorites/history render
planned content; friends redirects to the dedicated feature.

`UpdateProfileModal`:

- uses a portal and accessible dialog behavior;
- validates full name (2-100 trimmed characters), non-future birth date, address
  up to 255 characters, known gender values, and JPEG/PNG/WebP avatar up to 5 MiB;
- sends `FormData` through `userApi.updateProfile`;
- dispatches the returned user with `setCurrentUser` and invalidates
  `CurrentUser`;
- sends empty optional form fields so the backend can clear them;
- relies on backend signature validation in addition to browser MIME checks.

`LogoutConfirmModal` calls the backend before clearing Redux. It does not silently
log out locally when the request fails. Preserve or explicitly reconsider that
behavior when changing session UX.

### Friendship

`FriendsPage` is the container. It owns:

- three queries for accepted, incoming, and outgoing lists;
- send/accept/remove-request/remove-friend mutations;
- active tab/add-form/modal state;
- pending item state and user feedback;
- PIN clipboard behavior.

`friendApi.js` owns cache invalidation. Child components in `components/` must
remain reusable/presentational and receive callbacks rather than importing API
hooks.

PIN input is normalized with trim/uppercase and validated as `RML-` plus six
digits. Backend validation is still authoritative.

`friendshipErrorMessages.js` maps backend enum keys. Add mappings when adding a
user-actionable friendship error; keep the safe network/default fallback.

### Home and shared layout

`HomePage.jsx` contains static arrays for stories, contacts, and posts. It reads
auth state only to personalize avatar/name and destinations. Do not add RTK Query
feed caching around this mock data without a backend contract.

`MainLayout` owns shared chrome. `Header` and `Footer` provide responsive
navigation and auth-aware targets. New application pages should normally render
inside the existing layout and add routes in `App.jsx`.

## 11. Styling and accessibility

Tailwind is the primary styling system. Reuse theme tokens from
`tailwind.config.js`:

```text
social.canvas  #F7F5FF
social.paper   #FFFCFE
social.ink     #2F2A45
social.muted   #77718C
social.violet  #7C6EE6
social.pink    #FF8FB3
social.mint    #B8EADD
social.peach   #FFD8BE
social.yellow  #FFE9A9
```

The established visual language is soft pastel, rounded, responsive, and
social-oriented: translucent paper cards, subtle borders/shadows, gradients,
violet focus rings, and mobile-first breakpoints. Preserve it unless the task is
a redesign. Avoid new arbitrary colors when a semantic token fits.

Global behavior in `index.css` includes minimum viewport sizing, background
gradients, stable scrollbar handling, selection styling, and
`prefers-reduced-motion`. Do not duplicate these rules per page.

Accessibility requirements for every change:

- use semantic buttons, links, labels, headings, lists, and form controls;
- maintain visible keyboard focus and logical tab order;
- associate validation messages with controls and use appropriate live regions;
- include meaningful image alt text or mark decoration `aria-hidden`;
- disable repeat actions while a mutation is pending;
- provide loading, empty, error, retry, and success feedback;
- keep touch targets practical on mobile;
- for dialogs, retain portal rendering, `role="dialog"`, `aria-modal`, title and
  description IDs, initial focus, focus trap, Escape close, focus restoration,
  backdrop semantics, and body scroll restoration;
- honor reduced motion and do not make animation the only status signal.

If several dialogs are changed, a shared accessible dialog primitive may be
appropriate, but do not perform that refactor as unrelated cleanup.

## 12. Code style and component design

- Use ES modules and functional components/hooks.
- Match the touched file's quote/semicolon/spacing style; the repository is not
  fully normalized, so do not mass-format it.
- Use clear event names such as `handleSubmit`, `handleAcceptRequest`, and
  `handleCloseModal`.
- Normalize values once at the boundary, before validation/API submission.
- Prefer early returns for missing state, invalid input, and already-pending work.
- Keep derived display values as local constants instead of mirrored state.
- Use stable IDs from API data as React keys, never array indices when records can
  reorder.
- Keep effects for synchronization/subscription. Avoid synchronous state-reset
  patterns that violate the configured React Hooks lint rules.
- Clean up global event listeners, animation frames, object URLs, body styles, and
  other external effects.
- Avoid oversized pages gaining more unrelated helpers. Extract a component or
  hook when it has a clear owner and reduces duplicated behavior; do not create
  abstractions for a single trivial use.
- Do not use `dangerouslySetInnerHTML` for backend/user content.

## 13. Verification by change type

### API or auth change

1. Read the matching backend controller, DTO, security config, and response type.
2. Update the feature endpoint and, if public, `PUBLIC_AUTH_URLS`.
3. Check envelope transformation, bearer/cookie behavior, and error mapping.
4. Exercise success, 400/401/403/409/429 as relevant, refresh success/failure, and
   unreachable-backend behavior.
5. Confirm no token is persisted or logged.

### Route/page change

1. Update `App.jsx` and shared navigation together.
2. Decide public vs `ProtectedRoute` deliberately.
3. Test direct visit, refresh, browser back/forward, unknown nested route, and
   post-auth navigation.
4. Verify small and large viewport layouts plus keyboard traversal.

### Form/modal change

1. Verify controlled values reset/open from the intended source.
2. Test trimmed/empty/boundary inputs and backend validation errors.
3. Prevent duplicate submit while loading.
4. Check Escape, backdrop, focus trap/restoration, and scroll lock.
5. For files, test type, size, preview cleanup, and provider/backend error.

### Friendship change

1. Keep `requestId`, `friendshipId`, and `user.id` distinct.
2. Check all relevant cache invalidations and all three tabs.
3. Test send, duplicate/opposite request, accept, reject/cancel, unfriend, stale
   record, and retry states.
4. Keep children presentational.

### Completion checks

```bash
npm run lint
npm run build
```

Inspect the final scoped diff and confirm only intended source files changed.
Never claim browser/E2E verification unless it was actually performed.

## 14. Known fragile areas

These are context for related tasks, not permission for unrelated cleanup:

- `frontend/.env.example` does not document the required `VITE_API_URL`.
- `useFetch.js` is unused and causes the current lint failure.
- No frontend test framework or CI workflow is active.
- Recovery pages rely on volatile router state and are inconsistent about missing
  state redirects.
- Login ignores `ProtectedRoute`'s saved `state.from` and always goes home.
- `passwordReset` Redux state and `useChangePasswordMutation` are currently unused.
- There is no resend-OTP API/UI.
- Error-message helpers are duplicated across auth pages.
- OTP input logic is duplicated between registration and recovery verification.
- Modal focus-management logic is duplicated across profile/friend dialogs.
- Several page/component files are large; refactor only when it directly improves
  the requested change and retain accessibility behavior.
- Some dependencies are installed but unused; do not build new patterns around
  them accidentally.
- Home content is static while friendship/profile data is real; preserve that
  distinction in loading and product behavior.
- The backend can return non-enveloped or non-401 behavior for some security
  failures; confirm actual responses before changing automatic refresh logic.

## 15. Definition of done

Before handing frontend work back:

- The requested behavior works across the relevant route, state, API, and UI
  layers.
- Loading, empty, success, error, retry, and pending states are intentional.
- Auth/cookie/token assumptions still match `baseApi` and the backend.
- Cache invalidation keeps all visible user/profile/friend data consistent.
- Keyboard, screen-reader semantics, reduced motion, and responsive layout were
  considered and tested in proportion to the change.
- `npm run lint` and `npm run build` were run; residual failures are reported
  precisely.
- The final diff contains no generated output, secrets, accidental encoding
  changes, or unrelated formatting.
- This guide is updated if routes, commands, architecture, API behavior, or known
  baselines materially change.
