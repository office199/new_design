# Hindustani Jyotish — Admin Console

React + Vite + TypeScript admin panel for the Hindustani Jyotish platform. It
talks to the FastAPI backend's `/v1/admin/*` API.

## Features

- **Login** — admin email/password → JWT (stored in `localStorage`).
- **Dashboard** — platform stats (users, astrologers, online count, consultations,
  gross revenue, commission earned).
- **KYC Review** — queue filtered by status; review masked PII (PAN, Aadhaar
  last-4, bank) and **approve / reject** with notes.
- **Astrologers** — searchable list of all astrologer accounts.
- **Refunds** — refund a consultation to the user (full or partial); the
  astrologer's payout is reversed proportionally.

## Stack

React 19 · Vite · TypeScript · React Router 7. No UI framework — a small
hand-rolled design system in `src/index.css` using the brand palette
(Deep Indigo + Saffron + Copper).

## Develop

```bash
npm install
cp .env.example .env          # optional; defaults work with the proxy
npm run dev                   # http://localhost:5173
```

The dev server proxies `/v1` → `http://localhost:8000` (the FastAPI backend);
override with `VITE_API_TARGET`. Start the backend first (see
`../hindustani_jyotish_backen_fastapi`) and seed an admin via `ADMIN_EMAIL` /
`ADMIN_PASSWORD`.

```bash
npm run build                 # type-check + production build → dist/
npm run lint
```

## Layout

```
src/
├── api/            client (fetch + auth), endpoints, types
├── auth/           AuthContext (login/logout, token)
├── components/     Layout (sidebar), Badge
├── pages/          Login, Dashboard, KYCQueue, Astrologers, Refunds
└── App.tsx         router + protected routes
```
