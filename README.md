<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e6038cc1-1a74-4ef6-ad86-baaa2efa4af9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Full-stack deployment

This app now includes an Express + SQLite server for account-backed saves and server-side audit trails.

1. Install dependencies:
   `npm install`
2. Build the React client:
   `npm run build`
3. Start the full-stack server:
   `npm start`

Environment variables:

- `DATABASE_URL` — SQLite path, for example `sqlite:./data/app.sqlite`.
- `PORT` — server port, defaults to `3000`.

The browser still keeps a local cache for quick reloads, but authenticated game state is mirrored to the server database through `/api/game-state/:mode/:slot`. Wallet movements and bet tickets can be recorded through the server audit endpoints.

### Server-authoritative betting flow

Regular bets, same-game Bet Builder tickets, and cash-out requests now go through authenticated server endpoints. The server loads the user's saved profile from SQLite, validates the balance or pending ticket state inside a transaction, updates the stored profile, and writes wallet/bet audit rows before returning the updated profile to the client.

## Automated full-stack smoke test

Run `npm run test:fullstack` to build the client, start the Express server on a temporary port, wait until the frontend is served, and verify the auth, save, place-bet, and cash-out APIs against a temporary SQLite database. The script exits non-zero if either the frontend or backend fails to become usable.
