# Where the RSVPs go

The RSVP form on basilharawedding.com posts every reply straight into a Google Form in Basil's
Google account, so nothing runs on a server and there is nothing to maintain.

- Form (edit / see replies): https://docs.google.com/forms/d/1hq1UgfEoUi_3nIemHt3VYKUbfvrEJSKwijK1EavSOYw/edit
- Replies appear under the **Responses** tab. Click the green Sheets icon there once
  ("Link to Sheets") and every reply also lands in a spreadsheet you can sort and share.
- To get an email for each reply: Responses tab, three-dot menu, **Get email notifications for new responses**.

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

## Alternative: Google Sheet + Apps Script

`Code.gs` in this folder is an alternative collector that appends replies to a Google Sheet and
emails you; to use it instead, follow the comments in that file and put its web-app URL into
`RSVP_ENDPOINT` (and empty `RSVP_GFORM.action`).
