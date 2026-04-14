# NFL mirror bot (Bluesky → Pubky)

Headless worker (Phases 4–8) will live here. **Phase 2** is manual: create the **bot Pubky account** and record secrets for the VPS later.

## Phase 2 — Bot identity (do this before coding the worker)

### 1. New recovery phrase (bot-only)

- Generate a **dedicated** 12-word phrase for this bot. **Do not** reuse your personal account phrase.
- Store it in a **password manager** (or offline backup). You will need it for headless login on the server.

### 2. Sign up in Pubky

- Run the app locally (`npm run dev`) or use your deployed environment.
- **Sign up** a new user with the bot phrase (staging may require **SMS** or payment per network rules — see project docs).
- Complete **homeserver signup** until the account is fully active (same as a normal user).

### 3. Profile text (disclosure)

Set display name and bio so it is obvious the account is automated, for example:

- **Name:** e.g. `NFL news mirror (unofficial)`
- **Bio:** Short note that posts are mirrored from Bluesky, not affiliated with the NFL or reporters, and name the source:  
  `@nflnewsreposterbot.bsky.social`

Adjust wording to match your comfort and any product/legal review.

### 4. Optional avatar

- Add a bot avatar in-app if you want a recognizable face on timelines.

### 5. Values to save for later

After signup, note:

- **Pubky public id** (author id string) — needed for env/config when the worker posts.
- Keep **`PUBKY_RECOVERY_PHRASE`** (or equivalent session secret) **only** on the VPS in a root-only env file — **never** commit it.

Copy `packages/nfl-mirror-bot/.env.example` to `.env` on the server in Phase 8 and fill in the phrase there.

### Done when

- You can open the Pubky app, sign in as the bot (recovery phrase), and see the profile.
- You have the phrase stored securely and ready for the worker.

## Next phases (reference)

- **Phase 3:** Hetzner VPS, firewall, outbound HTTPS + WSS.
- **Phase 4+:** Implement Node worker in this package (Jetstream, SQLite, `pubky-app-specs` PUT).
