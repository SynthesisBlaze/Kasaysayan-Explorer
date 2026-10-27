# Cloudflare Workers AI history assistant

The assistant now uses **Cloudflare Workers AI**, not Gemini or Firebase Functions. The existing Discover entry, chat screen, Firebase accounts, and database stay in place. No Gemini key, Cloudflare API key in the app, or Firebase Blaze upgrade is needed for this assistant backend.

## Free-tier requirements and limits

Create a [Cloudflare account](https://dash.cloudflare.com/sign-up) and keep it on **Workers Free**. Workers AI currently includes **10,000 neurons per day**, shared by your account's Workers AI requests, resetting at 00:00 UTC. Neurons measure inference work, not a fixed number of questions. Cloudflare's documentation says further operations fail after a free-plan limit is reached; going beyond the free allowance requires upgrading. Some models require paid billing, so keep the configured model unless you have checked its eligibility.

This integration defaults to `@cf/meta/llama-3.1-8b-instruct-fp8-fast`, a low-cost Llama text model listed in the Workers AI catalog/pricing. Smaller models can be less accurate than larger models, particularly for Filipino and detailed historical facts. The app tells learners to verify important claims.

The Worker uses **SQLite-backed Durable Objects**, available on Workers Free, for per-account and app-wide counters. Their separate free quotas also apply. Stay on Workers Free if you want operations to stop at free-tier limits rather than incur paid-plan overages. Do not enable paid models, prepaid AI Gateway billing, or a paid Workers plan unless you intend to pay. Other Firebase features retain their own existing quotas and billing settings.

Documentation checked October 27, 2026:
- [Workers AI pricing and free allocation](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Durable Objects free-plan availability and limits](https://developers.cloudflare.com/durable-objects/platform/pricing/)

## One-time setup

Use Node.js 22 or newer. From the repository root:

```sh
npm ci
npm --prefix worker ci
```

`jose` verifies Firebase ID token signatures using Google's public keys. `wrangler` is Cloudflare's development/deployment CLI. Neither is an AI API key.

### 1. Sign in to Cloudflare

```sh
npm --prefix worker run login
```

Authorize the CLI in your browser. Keep Cloudflare login tokens private and do not paste them into the app or chat.

### 2. Configure origins and deploy the Worker

Open `worker/wrangler.jsonc`:

- `FIREBASE_PROJECT_ID` must match the Firebase project used by the app. It is already `kasaysayan-explorer`.
- `ALLOWED_ORIGINS` contains local Angular development and Capacitor origins. For a hosted web app, append its exact origin, for example `https://your-app.web.app`. Origins have no trailing slash or path. Do not replace the list with `*`.
- Keep `AI_MODEL` at its default for the free-tier setup.

When you are ready to publish the Worker to your Cloudflare account:

```sh
npm --prefix worker run deploy
```

This creates/updates the public Worker and its SQLite-backed Durable Object namespace. It is an outward-facing deployment; review the Cloudflare account and plan first. The Worker uses an **AI binding**, so no separate AI API token or secret is needed.

Wrangler prints a URL similar to:

```text
https://kasaysayan-history-assistant.YOUR-SUBDOMAIN.workers.dev
```

### 3. Connect the app

In **both** `src/environments/environment.ts` and `src/environments/environment.prod.ts`, replace the empty endpoint with the URL Wrangler printed **plus `/chat`**:

```ts
assistant: {
  endpoint: 'https://kasaysayan-history-assistant.YOUR-SUBDOMAIN.workers.dev/chat'
},
```

The endpoint is public configuration, not a secret. Production requires HTTPS. An empty endpoint deliberately shows a setup error instead of contacting an unconfigured backend. The existing `firebase.apiKey` is Firebase client configuration and should not be replaced with an AI key.

The Content Security Policy in `src/index.html` permits HTTPS `*.workers.dev` connections and the local Worker on port 8787. If you use a custom API domain, add its exact HTTPS origin to `connect-src` too. After deployment, you can tighten `https://*.workers.dev` to your exact Worker origin. Do not disable the Content Security Policy.

### 4. Run the app and sign in

```sh
npm start
```

Open `http://localhost:4200`, sign in to a registered account from **Account**, then open **Discover → Ask the history assistant**. Anonymous guest sessions cannot use the assistant. Keep the existing Firebase Email/Password and Anonymous Authentication providers enabled; Anonymous Authentication is still used elsewhere in the app.

For production/Android, run `npm run build` after setting the production endpoint and follow your existing hosting/Capacitor workflow. Android normally sends `https://localhost` as its origin; that origin is already allowed. If you customized the Capacitor hostname or scheme, add its exact origin. Do not change production to an HTTP endpoint.

## How the backend works

1. The app obtains its signed-in user's Firebase ID token and sends it as `Authorization: Bearer …` to `POST /chat`.
2. The Worker uses `jose` and Google's public signing keys to verify the RS256 signature, Firebase project audience/issuer, expiry, issued-at/authentication times, and subject. Anonymous providers are rejected. A signing-key lookup failure denies the request rather than bypassing authentication. Tokens are not introspected for revocation: a revoked/disabled session can remain valid until its ID token expires (normally about one hour).
3. JSON is limited to 128 KiB. Questions must alternate with assistant replies, with at most nine previous exchanges, 4,000 characters per message, and 24,000 total conversation characters. Clients cannot override the system prompt, model, output budget, or tools.
4. An atomic Durable Object counter reserves up to **10 questions per minute and 100 per UTC day per account**, plus **60 per minute and 500 per UTC day across this assistant deployment**. Failed upstream requests consume reservations. Cloudflare's shared free allocation may run out before these app limits. Expired counter storage is cleared by alarms.
5. The AI binding runs the configured Llama model with a fixed Philippine-history prompt and a maximum of 768 output tokens. Replies are capped at 4,000 characters. The Worker stops waiting after 45 seconds and the app aborts its HTTP request after 55 seconds; neither automatically retries. A timeout does not guarantee cancellation of inference already started on Cloudflare.

The Worker does not read or write the Firebase database and needs no Firebase service-account private key. CORS permits the configured browser origins, but CORS is not authentication; non-browser callers can set arbitrary origins. Verified Firebase tokens and usage counters protect inference. Public signup can still be abused across multiple accounts, so monitor usage and consider further signup/App Check/Turnstile controls for a large public launch.

## Privacy

Chat is held in page memory, not saved by the app, and cleared when the account changes. Question text and recent exchanges are sent to Cloudflare for AI processing. Only time buckets and counts are stored in Durable Objects. Code does not log tokens, chat text, or raw AI errors, and Worker observability is disabled in the supplied configuration. Provider/platform operational metadata and policies still apply. Google is contacted for public signing keys, not for AI inference. Do not submit sensitive information.

The assistant answers using model knowledge; it does not retrieve the app's records, browse the web, or provide verified citations.

## Local Worker development (optional)

After installing dependencies and logging in to Cloudflare:

```sh
npm --prefix worker run dev
```

Wrangler runs the Worker locally and uses local Durable Object state. Workers AI inference still uses Cloudflare's remote service and consumes your account's AI allocation; it is not an offline model. Follow any Wrangler prompt to enable remote AI access. Firebase token verification requires access to Google's public signing keys.

For the web development app only, set `environment.ts` to:

```ts
assistant: {
  endpoint: 'http://localhost:8787/chat'
},
```

Keep `environment.prod.ts` pointed at the deployed HTTPS Worker. The frontend intentionally permits HTTP only on loopback hosts in development; use the deployed HTTPS Worker when testing Android or other devices.

## Validation

```sh
npm --prefix worker test
npm --prefix worker run check
npm run test:assistant
npm run lint
npm run build
```

Worker tests use Node's test runner, locally generated signing keys, and mocked AI/usage services. They do not use Cloudflare credentials, real Firebase accounts, or live inference. `worker run check` bundles Wrangler's deployment as a **dry run**, without publishing it. The app's targeted specs use its existing Jasmine/Karma setup; Chrome must be installed.

The repository's standard full test compilation has an unrelated stale `favorites.spec.ts` import. `test:assistant` uses a focused tsconfig so the new tests can run independently. Full-project lint currently has 58 pre-existing constructor-injection/empty-lifecycle errors; changed assistant files can be linted independently.

Manual checks: sign-in gate, first question, follow-up, New chat, sign-out, offline error, disallowed-origin error, and quota exhaustion. Check that browser network requests go to the Cloudflare `/chat` endpoint, not a Gemini API or Firebase callable.

## Troubleshooting and old Gemini cleanup

- **Not configured:** set both frontend endpoints and confirm the Worker has its AI and Durable Object bindings.
- **App address not allowed:** add the exact origin shown in the browser request to `ALLOWED_ORIGINS`, then redeploy.
- **Sign in again:** use a registered account in the matching Firebase project. No anonymous guest access or development auth bypass is provided.
- **Usage/free allowance reached:** wait for the relevant limit to reset. Check Cloudflare's dashboard. Do not upgrade unless you accept paid usage.
- **Offline or unavailable:** check connectivity, Cloudflare's status, and access to Google's public signing keys. Raw backend errors are deliberately hidden.
- The unused Gemini source/setup guide and Firebase Functions configuration have been removed from this checkout. Installed dependency folders and private local secret files are left untouched.
- No cloud resources are deleted automatically. If you previously deployed `askHistoryAssistant`, remove that old function through Firebase/Google Cloud when you are ready. Remove its Gemini secret/key if nothing else uses it. Review dependencies before revoking keys or changing billing plans. If you never deployed or configured Gemini, there is nothing to clean up remotely.
