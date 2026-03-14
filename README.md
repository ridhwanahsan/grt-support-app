# GRT Support App (React) 🌟

GRT Support App is a mobile-ready React app that connects to the WordPress GRT Tickets plugin and manages support tickets via the WordPress REST API (`/wp-json/grt/v1`).

**✨ What this app does**
1. Lists tickets with filters and search.
2. Opens a chat view to read and send messages.
3. Updates ticket status (open, in-progress, solved, closed).
4. Assigns or unassigns agents.
5. Uploads attachments and sends them in chat.
6. Sends browser notifications for new messages.
7. Shows dashboard summaries and counts.

**🚀 Quick start**
1. `npm install`
2. `npm run dev`
3. Open `http://localhost:3000`

**🔗 How it connects to the GRT plugin**
1. Your WordPress site must have the GRT Tickets plugin installed and enabled.
2. Set the `WordPress Site URL` in the app Settings. Example: `https://your-site.com`
3. If you see CORS errors, copy `Current Origin` from Settings and add it to the plugin "Allowed Origins" list.
4. Sign in using WordPress username and password or an API token from the plugin settings.

**⚙️ Optional configuration**
1. To set a default base URL, add `VITE_WP_BASE_URL` in `.env.local`.
2. The app stores configuration in LocalStorage with the keys below.

**🧩 LocalStorage keys**
1. `grt_site_url`
2. `grt_notifications`
3. `jwt_token`
4. `user_email`
5. `user_name`
6. `last_seen_messages`

**🔌 API endpoints used**
1. `POST /wp-json/grt/v1/login`
2. `POST /wp-json/grt/v1/validate`
3. `GET /wp-json/grt/v1/tickets`
4. `POST /wp-json/grt/v1/tickets`
5. `GET /wp-json/grt/v1/tickets/{id}/messages`
6. `POST /wp-json/grt/v1/tickets/{id}/messages`
7. `POST /wp-json/grt/v1/tickets/{id}/assign`
8. `POST /wp-json/grt/v1/tickets/{id}/status`
9. `GET /wp-json/grt/v1/agents`
10. `POST /wp-json/wp/v2/media` (file upload)

**🔔 Notifications and polling**
1. Ticket list polling runs every 10 seconds for new messages.
2. Chat view refreshes every 5 seconds.
3. Dashboard refreshes every 15 seconds.
4. On iOS, notifications require "Add to Home Screen".

**🧭 Status mapping**
1. `in-progress` or `in_progress` is sent as `open` in the API request.

**📎 File attachments**
1. Files are uploaded using the WordPress Media API.
2. The API token must have media upload permissions.
3. On success, the app sends `[Attachment] URL` in the ticket chat.

**🧪 Project scripts**
1. `npm run dev` - start dev server
2. `npm run build` - production build
3. `npm run preview` - preview build
4. `npm run lint` - type check
5. `npm run cap-sync` - Capacitor sync (after build)
6. `npm run cap-open-android` - open Android project

**🛠️ Troubleshooting**
1. `Network Error` means the Site URL is wrong or CORS is not configured. Add the app origin to "Allowed Origins".
2. `Invalid API Token` means you need a new token from the plugin.
3. Notifications not showing usually means browser permission is blocked.

**🧱 Tech stack**
1. React 19 + Vite
2. Tailwind CSS
3. Motion (UI animations)
4. Capacitor (optional mobile packaging)
