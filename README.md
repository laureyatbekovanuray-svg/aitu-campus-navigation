# AITU Smart Campus Navigation — Final Exam Prototype

React + Vite + Supabase, with Dijkstra route calculation across 3 schematic floors. Built for the five existing Assignment 4 tables: `room`, `class`, `schedule`, `sensor_logs`, `users`.

## Run

1. Install Node.js 20+.
2. Copy `.env.example` to `.env`. Fill in your Supabase **Project URL** and **publishable** key (never use a secret/service_role key).
3. Run `npm install` and `npm run dev`.
4. In Supabase SQL Editor run `supabase/aggregation.sql` once to enable actual SQL `COUNT/GROUP BY` via RPC.
5. Configure Supabase Auth and RLS policies before using Admin Panel. **Do not disable RLS or grant anonymous write permissions.**
6. Create an Auth user with email matching a record in `public.users` whose `role` is `admin`. The UI checks the role for convenience, but the database must enforce the role independently using RLS.

## Mandatory SQL evidence for defense

| UI | Database action | Table |
|---|---|---|
| Search database | SELECT + WHERE (`ilike`) | room |
| Campus insights | `room_counts_by_floor()` SQL RPC (COUNT + GROUP BY) | room |
| Add room | INSERT | room |
| Save changes | UPDATE with `room_id` filter | room |
| Delete room | DELETE with `room_id` filter | room |
| Schedule | SELECT and local join by IDs | schedule, class, room |
| Sensor observations | SELECT | sensor_logs |

For every operation, show the UI before/after and confirm actual rows in Supabase. The app deliberately shows no fake database results when unconfigured.

## Navigation scope

`src/navigation.js` contains a real Dijkstra shortest-path implementation with 3 connected floor graphs, floor-to-floor connectors, a main entrance, and a few illustrative room anchors based on screenshots. `x_y_coords` can store strings like `230,160` in the app's SVG 660×510 coordinate system. Existing values such as `5.1` are *not* interpreted as valid 2D coordinates. Most real rooms still require manual mapping. Path weights are diagram units, **not meters or travel times**. Sensor logs are shown as historical observations; no automatic congestion-aware rerouting is claimed. This is not a verified emergency navigation map.

## RLS / security

The existing `users.password_hash` is not used. Authentication is via Supabase Auth. The UI hides write actions unless a signed-in user has `role='admin'`, but that is not a security boundary: create corresponding RLS policies on `room` and `schedule`, and read policies on other tables. Make sure roles are not editable by ordinary users. Never ship secret keys to the browser. Existing schema includes personal data in `users`; do not expose email/password_hash to public/anonymous queries.

## Known limitations

- No real deployment or live Supabase verification has been performed; credentials are not included.
- Supabase tables may have RLS enabled and require correctly configured policies.
- The room records from Assignment 4 are illustrative and may not match actual AITU floors.
- For a fully mapped campus, add more room anchors, and survey/verify corridor connections.
- Schedule currently supports an optional numeric user ID filter, not automatic mapping from Auth UID to `users.user_id`.

## Suggested defense

1. Introduce problem and user workflow.
2. Show My Schedule → Find a Room → Campus Map, and explain graph/Dijkstra.
3. Search for a real room in Supabase (SELECT WHERE).
4. Show Floor Statistics (SQL RPC aggregation).
5. Sign in as admin, add a clearly named test room, edit it, then delete it; verify changes in Supabase.
6. Explain RLS, data limitations, and how AI assisted development.
