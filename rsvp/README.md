# Where the RSVPs go

The RSVP form on basilharawedding.com posts every reply straight into a Google Form in Basil's
Google account, so nothing runs on a server and there is nothing to maintain.

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

Since 7 September 2026 the reply card asks for each named guest separately (name, coming or not,
ceremony / reception / both, dietary needs). The site sends **one Form response per guest**, so the
Sheet and the CSV have one row per person:

- `Names`: that guest's name. `Attending`: Accepts / Declines (Greek: Ναι / Δυστυχώς όχι).
- `Number attending`: 1 if they accept, 0 if not, so a SUM of that column is the headcount.
- `Events`: Ceremony / Reception / Both (blank when declining). Filter on it for the church count
  and the dinner count.
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

## Fallback

If the Form ever refuses a post (Google outage, form closed), the site opens the guest's mail app
with the reply pre-filled, addressed to basil2fxs@gmail.com, so nothing is lost.

## Backup.gs

`Backup.gs` is the script attached to the Sheet (Extensions, Apps Script). It writes
`Wedding RSVPs.csv` next to the Sheet in Drive. If it ever stops (for example after the Sheet is
copied or the triggers are deleted), open the Sheet, Extensions, Apps Script, run
`installTriggers` once and approve the permission prompt.

## Alternative: Google Sheet + Apps Script

`Code.gs` in this folder is an alternative collector that appends replies to a Google Sheet and
emails you; to use it instead, follow the comments in that file and put its web-app URL into
`RSVP_ENDPOINT` (and empty `RSVP_GFORM.action`).
