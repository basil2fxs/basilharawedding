# Where the RSVPs go

The RSVP card on basilharawedding.com sends every reply to a small Apps Script web app in Basil's
Google account (`Code.gs` in this folder, project "RSVP backup", bound to the Sheet). The script
writes one row per guest into the **Responses** tab of the Sheet and answers `{"result":"ok"}`;
the website shows "Thank you" only after it has read that answer. Nothing else runs on a server.

How a reply cannot get lost:

- The reply is saved in the guest's browser (localStorage) before the first attempt, and only
  removed once the Sheet has confirmed it.
- The site tries the endpoint three times (20 s each, short pauses between). While it waits the
  button reads "Sending...".
- If all three fail, the site posts a second, unconfirmed copy into the Google Form (the old
  channel, see below), shows "Not sent yet" with **Try again** and **Send by email** (the mail app
  opens with the whole reply pre-filled, addressed to basil2fxs@gmail.com), and keeps retrying
  quietly whenever the page is open or the connection comes back. Opening the card later shows
  the same screen for the saved reply.
- Every reply carries an id; a retry that already landed is answered "ok" without a second row.
- Every confirmed reply also refreshes `Wedding RSVPs.csv` next to the Sheet in Drive, so Save
  Brain commits the replies to the private Brain repo.

Endpoint URL (deployment "Website reply endpoint", 7 Sep 2026): the `RSVP_ENDPOINT` value near
the bottom of `index.html`. After editing `doPost` in the Apps Script editor, publish a new
version (Deploy > Manage deployments > pencil > Version: New) or the live endpoint keeps the old code.
A "Test" tab in the Sheet holds rows written by test runs (payloads with `test: true`); delete it
whenever you like.

The Google Form below is now the fallback channel only.

Two files carry the replies in the Wedding folder: **Wedding RSVPs** (no extension on the Mac,
a shortcut to the live Google Sheet; replies are in its first tab, "Responses") and
**Wedding RSVPs.csv** (a plain copy of that tab, rewritten after every confirmed reply, which is
what Save Brain commits). Open the Sheet to read or edit; the CSV is the backup.

Everything RSVP-related lives in one private Drive folder, `My Drive/Basil's Brain/Wedding/`
(one level above this repo folder, so nothing private is ever inside the public repo):

- `Wedding RSVP` (Google Form): https://docs.google.com/forms/d/1hq1UgfEoUi_3nIemHt3VYKUbfvrEJSKwijK1EavSOYw/edit
  The website posts every reply straight into it. Replies show under its **Responses** tab.
- `Wedding RSVPs` (Google Sheet, linked to the Form): https://docs.google.com/spreadsheets/d/1xTVhJES-VaM8Z93CMZlghPSw7uhu_iulN6yd2R-oqp8/edit
  Every reply lands here live. On the Mac, Drive shows it as `Wedding/Wedding RSVPs.gsheet`
  (double-click to open).
- `Wedding RSVPs.csv`: a plain-text copy of the Sheet, rewritten by `Backup.gs` (an Apps Script
  bound to the Sheet) on every reply and once a day. Drive syncs it to the Mac as a real file, so
  **Save Brain commits the actual replies** to the private Brain repo, not just a shortcut.
- `Basil and Hara wedding photos` (Drive folder, anyone with the link can add files):
  https://drive.google.com/drive/folders/1i0xxIpHFRsNDGSY-i67S7ZgnWNRXafpC
  This is the album the website's Photographs section links to (the QR code on the page is this
  link, drawn as vector art at build time). Guests need a Google account to upload.
- This repo (`basilharawedding/`): the website itself, `index.html`, plus this folder.

Responses are deliberately NOT stored in this repo: the repo is public (it is the website), so
anything in it can be read by anyone. `.gsheet`/`.gdoc`/`.gform` stubs are git-ignored here as
a safety net.
- To get an email for each reply: Responses tab, three-dot menu, **Get email notifications for new responses**.

## One row per guest

Since 7 September 2026 the reply card asks for one card per guest (Guest 1, Guest 2 ... added with
a plus): full name, coming or not, ceremony / reception / both, dietary needs. A finished card folds
into "Name - Accepts" and the card shows a running tally. The site sends **one Form response per
guest**:

- `Names`: that guest's name. `Attending`: Accepts / Declines (Greek: Ναι / Δυστυχώς όχι).
- `Number attending`: 1 if they accept, 0 if not, so a SUM of that column is the headcount.
- `Events`: Ceremony / Reception / Both (blank when declining). Filter on it for the church count
  and the dinner count. Extra people a guest brings to the church only will appear as their own
  rows marked Ceremony (the site tells guests the service is open to all, the reception is not).
- `Dietary`: per guest. `Contact`: the same for every guest of one reply, which is how you tell a
  party apart. `Song` and `Message` sit on the first guest's row; the other rows carry
  "With: <first guest>" in Message.

The website side is the `RSVP_GFORM` block near the bottom of `index.html`: the Form's
`formResponse` address plus one `entry.NNNN` id per question. If you ever change the Form's
questions, the ids change too; they can be read from the Form's public page (or ask Claude).

The first reply in the Form is a test sent while wiring it up ("Test reply from Claude"); delete it.

The Form's "Language" question was left as multiple choice, so the site does not fill it in.
The language a guest used is obvious from the Attending value (English or Greek text). To record
it properly: change that question's type to Short answer, then put its `entry` id into
`RSVP_GFORM.fields.language`.

## Protection against bots and bad actors (7 September 2026)

What an attacker can reach, and what stops them:

- **The reply endpoint** (the Apps Script web app) is the only thing that accepts input. Every reply
  must carry the site key (`SITE_KEY`, the same value in `index.html` and `Code.gs`; it is visible
  in the page source, so it is not a secret, but it turns away the generic bots that post to any
  form they find), a device token the site keeps in the browser, and a well-formed body: 1 to 12
  guests, names up to 80 characters, only the known answer and event values, dietary up to 200,
  contact up to 120 and a real email or phone when anyone accepts, song up to 200, message up to
  1000. Anything else is refused and nothing is written.
- **A hidden trap field** sits in the form off-screen; people never see it, bots fill it. A reply
  with it filled is answered "ok" and thrown away. A reply sent within two seconds of opening the
  page is dropped by the page itself.
- **Rate limits** (counters in the script cache, holding no personal data): 3 replies per device
  per hour, 6 per device per day, 4 per contact address per day, 40 replies from everyone per ten
  minutes. Google Apps Script cannot see the sender's IP address, so the device token stands in
  for it; a determined attacker can mint tokens, which is why the global limit exists. Over the
  limit the site shows "Not sent yet" with Try again and Send by email, so a real guest is never
  lost, only delayed.
- **The endpoint never returns data.** Opening it shows "RSVP endpoint is live" and nothing else.
  The Sheet, the CSV and the Form responses are private to Basil's Google account. Nothing on the
  website reads guest data back, so there is no anonymous path to anyone's details. The only
  public data is what Basil chose to publish (bank details, the album folder).
- **The page itself** carries a Content Security Policy: only its own two inline scripts (by
  hash) may run, styles and fonts may come only from Google Fonts, network calls may go only to
  Google Forms and the Apps Script endpoint, and nothing can be framed or embedded. Guest input is
  only ever placed as text, never as HTML. Every outside link opens with `rel="noopener"`.
- **The album folder** is "anyone with the link can add": guests who have the link can see and add
  photos, which is the point of it; nothing else lives in that folder.
- **Hosting**: GitHub Pages is static and served over HTTPS only; there is no server to break into.
  The two accounts that matter are the GitHub account (the site) and the Spaceship account (the
  domain): keep two-factor authentication on for both, and on the Google account (the replies).

If the site key ever needs changing: pick a new value, put it in `Code.gs` (SITE_KEY) and in
`index.html` (SITE_KEY), and publish a new version of the web app.

## Fallback

If the Form ever refuses a post (Google outage, form closed), the site opens the guest's mail app
with the reply pre-filled, addressed to basil2fxs@gmail.com, so nothing is lost.

## Code.gs

`Code.gs` is the script attached to the Sheet (Extensions, Apps Script): the reply endpoint plus
the CSV backup, which writes `Wedding RSVPs.csv` (Responses tab) and `Wedding RSVPs (form fallback).csv`
next to the Sheet in Drive. If it ever stops (for example after the Sheet is
copied or the triggers are deleted), open the Sheet, Extensions, Apps Script, run
`installTriggers` once and approve the permission prompt.

