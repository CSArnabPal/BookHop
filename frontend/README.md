# BookHop frontend

BookHop's frontend is a React single-page application for service providers, customers booking appointments, and platform administrators. It uses React Router for client-side navigation and Axios clients for the backend API.

## Technology

| Concern | Libraries/tools |
| --- | --- |
| UI | React 19, React DOM, Lucide React |
| Routing | React Router 7 |
| API requests | Axios |
| Development and build | Vite 8 and `@vitejs/plugin-react` |
| Styling | Tailwind CSS 4 using `@tailwindcss/vite`, plus project CSS in `src/index.css` |
| Linting | ESLint, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` |
| Formatting dependency | Prettier is listed as a dependency; no formatting script is defined. |

## Implemented pages and workflows

| Route | Access | Page/workflow |
| --- | --- | --- |
| `/login` | Public | Provider login. |
| `/register` | Public | Provider registration with email OTP verification. |
| `/dashboard` | Provider | Overview of services, open days, upcoming bookings, and booking-page setup. |
| `/bookings` | Provider | Booking list and filters; cancel or reschedule confirmed bookings. |
| `/services` | Provider | Add services with duration, price, description, and icon; activate/hide or soft-delete them. |
| `/availability` | Provider | Edit weekly availability windows by weekday. |
| `/payments` | Provider | View wallet totals and withdrawal history; save payout details and request withdrawal. |
| `/profile` | Provider | Configure business profile/branding and connect Google Calendar. |
| `/:slug` | Public | Business booking page; choose service/date/slot, verify email, then confirm a free appointment or continue to payment for a paid service. |
| `/booking/success` | Public return | Resolve booking/payment status and display appointment details/calendar link where available. |
| `/booking/cancelled` | Public return | Display incomplete-payment status and link back to the business page where the slug is available. |
| `/admin/login` | Public login | Separate administrator sign-in. |
| `/admin/dashboard` | Admin token | Review platform metrics, businesses, paid bookings, and withdrawal requests; update withdrawal status. |
| `/privacy`, `/terms` | Public | Placeholder legal information pages; they state the page is being prepared. |

The root route `/` redirects to the provider dashboard when signed in, otherwise to `/login`. Unknown paths redirect to `/`.

## Authentication and state

- Provider identity is held in `AuthContext`. On page load, the app checks `localStorage` for `token`, then requests `POST /auth/me` to restore the current profile.
- The provider Axios client adds the provider bearer token to requests and stores tokens returned in API responses. A `401` clears the provider token.
- `ProtectedRoute` sends unauthenticated users to `/login`.
- Admin authentication is separate and uses `adminToken` in `localStorage`; the admin client attaches it to requests. An unauthorized dashboard response clears it and returns to `/admin/login`.
- The frontend stores tokens in browser-accessible `localStorage`. This is a security consideration for deployments and browser scripting risks.

## API integration and environment

Both Axios clients use this base URL:

```text
VITE_API_URL || http://localhost:5001/api
```

The Vite variable should be the API base including `/api`, for example `https://api.example.com/api`. It is compiled into frontend code and exposed in the browser; it must contain only a public API URL, never credentials or secrets. The backend endpoint list is in the [Backend README](../backend/README.md).

| Variable | Required? | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Optional | Axios base URL for both provider and admin API clients. Defaults to `http://localhost:5001/api`. This is a browser-exposed build-time setting. |

No other `import.meta.env` frontend setting is referenced by the source.

## Local development

Prerequisites: Node.js/npm and the BookHop backend running at the configured API URL.

From this directory:

```sh
npm install
npm run dev
```

By default the app expects the API at `http://localhost:5001/api`. To use a different backend, provide the Vite variable when starting or building; for example:

```sh
VITE_API_URL=http://localhost:5001/api npm run dev
```

For Google Calendar, the frontend starts the backend OAuth connection and expects the callback to return to `/profile`. Configure the OAuth credentials and registered callback on the backend as described in the [Backend README](../backend/README.md).

## Scripts

Run these from `frontend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create the production frontend bundle in `dist/`. |
| `npm run preview` | Preview the built bundle locally. Run `npm run build` first. |
| `npm run lint` | Run ESLint over the frontend project. |

There is no frontend test script in `package.json`.

## Routing, assets, and reusable components

- `src/App.jsx` defines SPA routes and the provider-protected workspace routes; `src/main.jsx` mounts the app inside `BrowserRouter`.
- The public booking route uses a top-level business slug (`/:slug`). A production static host must serve the SPA entry point for that path and other client-side routes.
- `src/api/` contains the shared provider and separate admin Axios clients.
- `src/context/AuthContext.jsx` exposes provider auth state.
- `src/components/` contains the provider shell/navigation, customer avatar, and service-icon components and icon mapping.
- `src/pages/` contains auth, provider workspace, admin wrapper, and public booking flows; `src/admin/` provides admin screen entry components.
- `src/assets/` contains brand images, customer avatars, service icons, social/integration imagery, and local font files. `public/` contains browser icons.
- `vite.config.js` configures the React and Tailwind Vite plugins. No custom Vite proxy or backend hosting configuration is present.

## Security and production hosting

- `VITE_API_URL` is public build configuration. Never put a secret in a `VITE_*` variable.
- Provider and admin tokens are stored in `localStorage`; protect the application against script injection and consider token-storage trade-offs.
- The frontend relies on backend authorization; hiding a route in the client is not a substitute for API access control.
- Serve the production `dist/` directory from a static host over HTTPS. Configure SPA fallback/rewrites so browser requests to `/:slug`, `/admin/dashboard`, and other client-side routes load the SPA entry point.
- Configure the backend API URL at build time, then configure backend CORS and origin settings for the deployed frontend.
- No hosting provider, deployment script, Docker setup, or CI/CD configuration is included.
- Privacy and terms screens are placeholders; provide reviewed policy content before relying on them.

## Items to verify for your deployment

- Set `VITE_API_URL` to the reachable backend API base and ensure it includes `/api`.
- Confirm the selected hosting provider supports SPA fallback for slug-based booking pages.
- Confirm the backend CORS policy permits only intended frontend origins.
- Configure backend SMTP for OTP and booking notifications, Stripe for paid bookings, and Google OAuth if those integrations are needed.
