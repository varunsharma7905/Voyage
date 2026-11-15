# Voyage — setup (about 15 minutes)

Voyage has two parts: a **backend** (a small Google Apps Script that lives inside your sheet) and the **web app** (the files in this folder). Your Google Sheet stays the single source of truth.

Until step 5 is done, the app runs in **demo mode** with sample data, so you can open `index.html` and look around first.

## 1. Add the backend to your sheet
1. Open your sheet (KVS_Voyage) → **Extensions → Apps Script**.
2. Delete everything in `Code.gs` and paste in the contents of `backend/Code.gs`. Save.

## 2. Set your passcode
1. In Apps Script, click the **gear icon (Project Settings)**.
2. Under **Script properties → Add script property**: name `PASS_VARUN`, value = a passcode you will remember (6+ characters, not your Google password).

The passcode is never written in the code or in the web app files.

## 3. Run the one-time setup
1. In the editor, choose the function **setup** in the dropdown and press **Run**. Approve the permissions (Google may say "unverified app" — this is your own script: *Advanced → Go to project*).
2. Open **Execution log**. You should see lines like `Varun · CET_Varun → 63 rows found`. If a line says PROBLEM, tell me what it says.

This creates the new tabs it needs (`Mocks_Varun`, `Settings_Varun`) and adds a few helper columns (Box, Next review; Status, Added). Your existing columns and chapters are untouched.

## 4. Publish the backend
1. **Deploy → New deployment → type: Web app**.
2. *Execute as:* **Me**. *Who has access:* **Anyone**. (Anyone with the link can reach it, but every request needs your passcode.)
3. Deploy, then **copy the Web app URL**.

## 5. Connect the web app
Open `config.js` and paste the URL between the quotes:

```js
window.KVS_CONFIG = { API_URL: "https://script.google.com/macros/s/XXXX/exec" };
```

## 6. Host it (free)
**Cloudflare Pages:** Workers & Pages → Create → Pages → **Upload assets** → drag in the whole folder (`backend/` and `SETUP.md` are not needed, but harmless) → Deploy.
Or push the folder to a GitHub repo and connect it to Cloudflare Pages (no build command, output directory `/`).

## 7. Put it on your devices
- **iPhone / iPad:** open the site in Safari → Share → **Add to Home Screen**.
- **Laptop:** just bookmark it (Chrome: ⋮ → Cast, save and share → Install page as app).

## Switching Kiran on later
1. Duplicate your `CET_Varun` tab, rename it `CET_Kiran` (his progress starts fresh once you untick the boxes). His vocab tab `Kiran-Vocab` already exists.
2. Script properties: add `PASS_KIRAN` = his passcode and `ACTIVE_KIRAN` = `true`.
3. Run `setup` again. He opens the same site and signs in with his passcode and sees only his own data.

## Good to know
- **Exam dates** are edited inside the app (Home → tap a countdown, or the sliders icon). CET is marked tentative until you switch that off.
- **After changing Code.gs**, publish a new version: Deploy → Manage deployments → pencil → Version: New version → Deploy.
- **Your "Apprenticeship student" tab** contains other people's names and codes. The app never reads it, but I would not keep it in a sheet others can open by link.
