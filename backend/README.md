# BookHop backend

The backend is the BookHop REST API. It serves provider, customer, and platform-admin workflows through Express, persists application data in MongoDB with Mongoose, and conditionally integrates with Stripe, SMTP, and Google Calendar.

## Architecture

- `server.js` loads environment configuration, enables JSON request parsing and CORS, connects to MongoDB, and mounts route groups.
- Route modules in `routes/` map HTTP methods and paths to controller functions.
- Controllers implement authentication, services, availability, booking, payment, integration, and admin operations.
- JWT middleware protects provider and admin routes; Mongoose models define persisted data.
- `utils/` contains email OTP, SMTP, Google Calendar, Stripe, wallet, date/time, slot, and formatting helpers.

The server's root `GET /` route returns the text `Hello World!`. API responses are generally JSON.

## Runtime and dependencies

`backend/package.json` declares ES modules and depends on Express 5, Mongoose, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`, `nodemailer`, `googleapis`, and `stripe`. Nodemon is used by the start script. The manifest has no `engines`, test, lint, or build declaration.

## API reference

The server mounts these route groups:

| Route group | Mounted path |
| --- | --- |
| Authentication | `/api/auth` |
| Admin | `/api/admin` |
| Provider bookings | `/api/bookings` |
| Services | `/api/services` |
| Availability | `/api/availability` |
| Google integration | `/api/integration` |
| Payments and withdrawals | `/api/payment` |
| Public booking | Both `/api/public` and `/public` |

Public endpoints are mounted under both prefixes. The frontend uses `/api/public`.

Protected endpoints expect `Authorization: Bearer <JWT>`. Provider tokens carry a `userId`; admin tokens carry `role: "admin"`. Public endpoints and admin login do not require an existing bearer token.

### Authentication — `/api/auth`

| Method and path | Auth | Purpose and verified behavior |
| --- | --- | --- |
| `POST /api/auth/register/request-otp` | Public | Body `{ email }`; rejects missing email and existing accounts, then emails a registration OTP. Returns a message and OTP send result. |
| `POST /api/auth/register/verify-otp` | Public | Body `{ email, emailOtp }`; checks the current registration OTP without consuming it. Returns a verification message or a `400` error. |
| `POST /api/auth/register` | Public | Body fields `name`, `email`, `password`, `emailOtp`; optional `businessName`, `businessDescription`, `timezone`. Requires and consumes a valid registration OTP, hashes the password, creates a unique business slug, and returns `{ message, user, token }` with status `201`. |
| `POST /api/auth/login` | Public | Body `{ email, password }`; compares the password with its stored bcrypt hash and returns `{ message, user, token }` on success. |
| `POST /api/auth/me` | Provider JWT | Returns the authenticated user profile, excluding the password from the database query. |
| `POST /api/auth/profile` | Provider JWT | Updates supplied `businessName`, `businessDescription`, `timezone`, `brandTheme`, and/or `brandAccent`; recalculates a unique slug and returns the updated user. |

### Services — `/api/services`

| Method and path | Auth | Purpose and verified behavior |
| --- | --- | --- |
| `GET /api/services` | Provider JWT | Lists the authenticated provider's non-deleted services, newest first. |
| `POST /api/services` | Provider JWT | Creates a service. Body: `name`, `duration`; optional `price`, `description`, `icon`. Returns the new service with status `201`. |
| `PATCH /api/services/:id` | Provider JWT | Updates supplied `name`, `duration`, `price`, `description`, `isActive`, or `icon` for a service owned by the provider. |
| `DELETE /api/services/:id` | Provider JWT | Soft-deletes a provider-owned service and marks it inactive; returns the updated record. |

### Availability — `/api/availability`

| Method and path | Auth | Purpose and verified behavior |
| --- | --- | --- |
| `GET /api/availability` | Provider JWT | Lists the provider's weekly availability, ordered by day of week. |
| `PUT /api/availability` | Provider JWT | Saves/upserts one day. Body `{ dayOfWeek, slot }`, where each slot has `startTime` and `endTime`; invalid or incomplete time ranges are filtered out. Day values must be in the range `0`–`6` (Sunday–Saturday). |

### Provider bookings — `/api/bookings`

| Method and path | Auth | Purpose and verified behavior |
| --- | --- | --- |
| `GET /api/bookings` | Provider JWT | Lists bookings for the authenticated provider. Optional query `status` filters by status (or `rescheduled` for the rescheduled flag); optional `date` filters by date. By default, pending-payment and payment-failed bookings are excluded. Service details are populated and a customer Google Calendar URL may be added. |
| `PATCH /api/bookings/:id/status` | Provider JWT | Body `{ status }`; accepts `pending`, `pending_payment`, `confirmed`, `cancelled`, or `payment_failed`. Updates only the provider's booking; cancellation attempts to cancel a Google Calendar event and a status email is sent asynchronously when configured. |
| `PATCH /api/bookings/:id/reschedule` | Provider JWT | Body `{ date, startTime, endTime }`. Rejects missing fields and overlapping confirmed/non-cancelled bookings with `409`; updates the owned booking, marks it rescheduled, and attempts calendar/email updates. |

Cancellation of a paid booking does not trigger an automatic refund in the implementation.

### Public booking — `/api/public` and `/public`

The following paths work beneath either public prefix.

| Method and path | Auth | Purpose and verified behavior |
| --- | --- | --- |
| `GET /:slug` | Public | Returns the public business profile and its active, non-deleted services. Password is excluded from the business query. |
| `GET /:slug/slots` | Public | Query: `date`, `serviceId`. Returns `{ slots }` for an active service, based on weekly availability and bookings occupying the time. |
| `POST /:slug/request-otp` | Public | Body `{ customerEmail }`; emails a booking-purpose OTP. Email delivery/configuration errors are returned as `503`. |
| `POST /:slug/verify-otp` | Public | Body `{ customerEmail, emailOtp }`; checks the booking-purpose OTP without consuming it. |
| `POST /:slug/book` | Public | Body includes `serviceId`, `customerName`, `customerEmail`, `date`, `startTime`, `endTime`, `emailOtp`; optional `customerAvatar`, `notes`. Rechecks conflicts and consumes a valid email OTP. Free services are confirmed immediately. Paid services create a pending booking and return a Stripe `checkoutUrl`; Stripe must be configured for paid services. |
| `GET /booking/status` | Public | Query accepts `session_id` (Stripe session) or `booking_id`. For a pending paid booking, retrieves the Stripe session, confirms payment and booking when paid, and creates provider wallet earnings; unsuccessful payment returns `402`. Returns `{ booking }` once status can be read. |
| `GET /booking/cancel-payment` | Public | Query `booking_id`; marks a pending-payment booking as payment-failed and returns a message. If it is no longer pending, reports that there is no pending booking to cancel. |

The public prefix is registered before `/:slug` in the route file, so the fixed booking status/cancel paths are defined alongside the slug routes.

### Payments and withdrawals — `/api/payment`

| Method and path | Auth | Purpose and verified behavior |
| --- | --- | --- |
| `GET /api/payment` | Provider JWT | Returns payout details, computed wallet totals, up to 15 recent wallet transactions, and up to 10 recent withdrawals. |
| `PATCH /api/payment/payout-details` | Provider JWT | Body includes `accountHolderName` and either `accountNumber` or `upiId`; optional `bankName`, `ifsc`, `upiId`. Stores only the last four digits of an account number plus the other payout fields. |
| `POST /api/payment/withdrawals` | Provider JWT | Body `{ amount }` in minor currency units (paise); requires completed payout details, at least 100 paise, and sufficient available wallet balance. Creates a pending withdrawal and wallet hold, returning status `201`. |

Paid booking Checkout is created by the public booking controller rather than these payment routes. The implementation calculates a 10% platform fee and provider remainder, and stores amounts in INR minor units. Provider withdrawals are records for later manual processing, not automated bank/UPI transfers.

### Google Calendar — `/api/integration`

| Method and path | Auth | Purpose and verified behavior |
| --- | --- | --- |
| `GET /api/integration/google/connect` | Provider JWT | Returns `{ url }` for Google OAuth. Returns `500` if Google client ID, secret, or redirect URI is missing. |
| `GET /api/integration/google/callback` | OAuth redirect (no provider middleware) | Exchanges the OAuth `code`, uses the `state` value as the user ID, stores the refresh token and marks the primary calendar connected, then redirects to the frontend profile page. Missing parameters, absent refresh token, or callback errors redirect with a failure status. |

When a business has a stored refresh token, booking creation, rescheduling, and cancellation can create, update, or cancel Calendar events. Customers can also receive a Google Calendar URL without connecting the provider's calendar.

### Admin — `/api/admin`

| Method and path | Auth | Purpose and verified behavior |
| --- | --- | --- |
| `POST /api/admin/login` | Public | Body `{ email, password }`; compares against configured admin email and either configured password or bcrypt hash. Returns an admin JWT. Returns `503` if admin login is not configured and `401` for invalid credentials. |
| `GET /api/admin/dashboard` | Admin JWT | Returns summary aggregates, up to 100 newest businesses, up to 50 newest withdrawals, and up to 10 recently updated paid bookings. |
| `PATCH /api/admin/withdrawals/:id` | Admin JWT | Body `{ status }`, optional `adminNote`; allowed statuses are `pending`, `processing`, `paid`, and `rejected`. Rejection creates a wallet reversal if one does not already exist. `paid` and `rejected` are terminal states. |

## MongoDB models

| Model | Purpose |
| --- | --- |
| `User` | Provider account, business page/profile, timezone and branding, Google Calendar connection, payout destination metadata. |
| `Service` | Provider-owned service name, duration, price, description, icon, active and soft-delete flags. |
| `Availability` | One provider's availability windows for a day of the week; indexed uniquely by provider and day. |
| `Booking` | Customer appointment details, service, time, status, payment/fee/payout data, and calendar references. |
| `EmailOtp` | Hashed registration or booking email codes, expiry, attempts, and consumption state. MongoDB TTL indexing is declared on expiry. |
| `WalletTransaction` | Provider booking earnings, withdrawal holds, and withdrawal reversals. |
| `Withdrawal` | Withdrawal request status, amount, payout snapshot, and admin note; the collection is named `withdrawls` in the schema. |

## Environment variables

The backend loads environment variables with `dotenv/config`. The following names are referenced in backend source:

| Variable | Required? | Usage |
| --- | --- | --- |
| `PORT` | Optional | HTTP listener port; defaults to `5001`. |
| `MONGODB_URI` | Required | MongoDB connection used at startup; the process exits if it is absent or connection fails. |
| `JWT_SECRET` | Required for authentication | Signs seven-day provider/admin tokens and verifies bearer tokens. |
| `CLIENT_URL` | Optional | Frontend redirect and Stripe Checkout return origin; defaults to `http://localhost:5173`. |
| `ADMIN_EMAIL` | Required for admin login | Email checked by the admin login handler. |
| `ADMIN_PASSWORD` | Required if no hash is configured | Plain configured admin password fallback. Store securely; prefer a bcrypt hash. |
| `ADMIN_PASSWORD_HASH` | Required if no plain password is configured | Bcrypt hash checked by admin login. When present, the implementation uses this hash. |
| `STRIPE_SECRET_KEY` | Optional generally; required for paid bookings | Instantiates Stripe for paid Checkout sessions and payment-status retrieval. Free bookings do not require it. |
| `GOOGLE_CLIENT_ID` | Optional integration | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Optional integration | Google OAuth client secret. |
| `GOOGLE_REDIRECT_URI` | Optional integration | OAuth callback URI; must match the URI configured in Google Cloud. |
| `SMTP_HOST` | Required for email | SMTP server hostname. |
| `SMTP_PORT` | Required for email | Positive SMTP port; port `465` implies secure transport. |
| `SMTP_USER` | Required for email | SMTP authentication username. |
| `SMTP_PASS` | Required for email | SMTP authentication password. |
| `SMTP_SECURE` | Optional for email | Secure transport is enabled when set to `true`, or automatically for port `465`. |
| `SMTP_FROM_EMAIL` | Required for email unless `EMAIL_FROM` provides an address | Sender email address. |
| `SMTP_FROM_NAME` | Optional for email | Sender display name; otherwise parsed from `EMAIL_FROM` or defaults to `BookHop`. |
| `EMAIL_FROM` | Optional fallback for email sender | Fallback address and display-name source, such as `BookHop <noreply@example.invalid>`. |

OTP generation stores a bcrypt hash, expires after 10 minutes, and allows at most five failed verification attempts. Email OTP delivery depends on working SMTP configuration.

### Sanitized backend environment template

The existing [`backend/.env.example`](./.env.example) was inspected and is sanitized, but it omits some variables referenced in source (including Stripe, admin, and SMTP settings). This complete template is provided for reference; it is not a second environment file. Replace placeholders locally and never commit real secrets.

```dotenv
PORT=5001
MONGODB_URI=<mongodb-connection-string>
JWT_SECRET=<long-random-secret>
CLIENT_URL=http://localhost:5173

# Admin login: configure ADMIN_PASSWORD_HASH or ADMIN_PASSWORD (hash is preferred).
ADMIN_EMAIL=<admin-email>
ADMIN_PASSWORD_HASH=<bcrypt-hash>
# ADMIN_PASSWORD=<admin-password>

# Required for paid bookings; can be omitted for free-only use.
STRIPE_SECRET_KEY=<stripe-secret-key>

# Optional Google Calendar OAuth; configure all three to enable it.
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:5001/api/integration/google/callback

# Required for OTP and transactional email.
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USER=<smtp-username>
SMTP_PASS=<smtp-password>
SMTP_SECURE=false
SMTP_FROM_EMAIL=<sender-email>
SMTP_FROM_NAME=BookHop
# Alternative sender fallback:
# EMAIL_FROM=BookHop <sender@example.invalid>
```

## Local setup

1. Install a compatible Node.js/npm version and provide a MongoDB instance.
2. From `backend/`, install dependencies:

   ```sh
   npm install
   ```

3. Create `backend/.env` with the required `MONGODB_URI` and `JWT_SECRET`. Configure SMTP to use registration OTP and customer booking flows. Add optional Stripe, admin, and Google settings for the workflows you need.
4. Start the backend:

   ```sh
   npm start
   ```

   This invokes `nodemon server.js`. The default listener is `http://localhost:5001`.
5. Start the frontend separately; see [Frontend setup](../frontend/README.md). The frontend's default API base is `http://localhost:5001/api`.

## Scripts and validation

| Command | Behavior |
| --- | --- |
| `npm start` | Runs `nodemon server.js`. |

There are no backend `test`, `lint`, or `build` scripts in `package.json`. ESLint is a development dependency, but no backend lint command is defined.

## Errors, logging, and security notes

- Database connection errors and listener startup failures are logged and terminate startup. An `EADDRINUSE` listener error gets a specific port message.
- Controllers generally catch operation errors and return JSON errors; there is no shared Express error-handler middleware.
- Application logging uses `console.log` and `console.error`; no structured logger is configured. Some email and calendar operations are asynchronous and log failures.
- `cors()` is enabled without an explicit origin allowlist. No request rate limiter is mounted.
- Provider authorization scopes service, booking, availability, and payment database queries to the JWT user ID. Admin routes additionally check the JWT role.
- User passwords and OTP codes are bcrypt-hashed. JWTs expire after seven days. The admin fallback `ADMIN_PASSWORD` is plaintext configuration; prefer `ADMIN_PASSWORD_HASH`.
- Keep all backend environment values server-side. Do not expose Stripe, SMTP, JWT, Google client secret, or admin credentials in the frontend.
- Payout account numbers are not retained in full by the payout-details controller; only their last four digits are stored. A withdrawal preserves the payout snapshot needed for manual processing.

## External setup and deployment

- **MongoDB:** Set `MONGODB_URI` to a reachable database connection string.
- **SMTP:** Configure an SMTP account and valid sender address. Registration and booking OTP requests fail if the email cannot be delivered.
- **Stripe:** Set a server-side secret key for paid service bookings. Configure no webhook in this repository; successful payment is checked when the customer returns and calls the booking-status endpoint.
- **Google Calendar:** Set OAuth client credentials and register the exact callback URL. Set `CLIENT_URL` to the frontend origin so callback and Checkout returns go to the right host.
- **Admin:** Configure one admin email plus a password or bcrypt hash in the environment. There is no admin user database flow.

No backend deployment platform, container, CI workflow, or production configuration is included. For deployment, run the Node service behind HTTPS, configure secrets in the hosting environment, allow the frontend origin through a deliberately configured CORS policy, and use a persistent MongoDB service. These are deployment requirements, not repository configuration.

## Integration and behavior caveats

- Stripe Checkout is for customer charges; the provider wallet and withdrawals are application records, with bank/UPI settlement performed outside this code.
- No Stripe webhook route or automated refund/payout mechanism is present.
- Google Calendar and SMTP are external dependencies and need provider-side credentials and configuration.
- Admin dashboard financial metrics are computed from booking, wallet, and withdrawal records; confirm the accounting requirements before using them for financial reporting.

