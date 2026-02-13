# Putting the PWA online and (optionally) protecting it

## Can you do it for free?

**Yes.** You can host and protect the app for free with:

- **Firebase Hosting** – Free tier is generous (10 GB storage, 360 MB/day transfer). Fits well because you already use Firebase (Firestore). No credit card required for the free tier.
- **Vercel** or **Netlify** – Also free tiers if you prefer; you’d point the app at your existing Firestore.

Recommendation: use **Firebase Hosting** so everything (Firestore + hosting) stays in one project.

---

## Should you put it behind a login?

**For an event, it’s a good idea** so random people can’t open the app or see orders.

Options:

| Option | Pros | Cons |
|--------|------|------|
| **Shared password (one screen)** | Easiest: one password you tell staff/volunteers. No user accounts. | Same password for everyone; if it leaks, you change it in env and redeploy. |
| **Firebase Auth (email/password or magic link)** | Real accounts, revocable. Good if you want different people to log in. | More setup (Auth UI, rules, user management). |

For a **single event** where you just want “only people I gave the password to”: a **shared password** is usually enough. For **ongoing use** with multiple people: Firebase Auth is better.

---

## How to publish (Firebase Hosting)

1. **Build the app**
   ```bash
   npm run build
   ```
   This creates a `dist/` folder with the production files.

2. **Deploy to Firebase (hosting + Firestore rules)**
   ```bash
   npm run firebase:deploy
   ```
   Or build and deploy in one step:
   ```bash
   npm run deploy
   ```
   (`deploy` runs `npm run build` then `firebase deploy`.)

3. **Open the URL**  
   After deploy, Firebase prints a URL like `https://quiz-pwa-e4f17.web.app`. That’s your live PWA. You can add a custom domain later in Firebase Console → Hosting.

---

## Optional: shared password (already added)

A **shared password** gate is already in the app. It’s **off** unless you set a password.

**To turn it on:**

1. In your **`.env`** (in the quiz-pwa root), add:
   ```
   VITE_APP_PASSWORD=your-event-password
   ```
   Use a password you’ll share only with staff/volunteers.

2. **Build and deploy** (so the password is baked into the build):
   ```bash
   npm run deploy
   ```

After that, anyone opening the PWA sees “Quiz Event Orders” and an “Enter password” field. Only after entering the correct password do they see Orders / Bar / Ranking / Admin. The unlock is stored in **sessionStorage** (per tab; closing the tab asks for the password again).

**To leave the app public:** Don’t set `VITE_APP_PASSWORD` in `.env`. Build and deploy as usual; no password screen is shown.

**Note:** The password is embedded in the built JS, so someone who inspects the bundle could find it. For a single event where you just want to avoid random visitors, this is usually fine. For stronger protection, you’d add Firebase Auth (e.g. email sign-in).

---

## Summary

| Question | Answer |
|----------|--------|
| **Can I do it for free?** | Yes. Firebase Hosting (and Firestore) free tiers are enough. |
| **Should I add login?** | For an event, yes—at least a shared password so not everyone can open the PWA. |
| **How do I publish?** | `npm run build` then `npm run firebase:deploy`. Use the printed URL (e.g. `https://quiz-pwa-e4f17.web.app`). |

Next step: I can (1) add the Firebase Hosting config and a deploy script so you can publish with one command, and (2) optionally add a simple password screen so you can protect the PWA without changing how the rest of the app works.
