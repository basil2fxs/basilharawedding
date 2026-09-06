# RSVP responses into a Google Sheet

The RSVP form on the website posts to whatever URL is in `RSVP_ENDPOINT` (near the bottom of
`index.html`, in the SETTINGS block). This folder gives you a Google Sheet that receives every
reply, plus an email to you for each one. Setup takes about five minutes and is free.

## Steps

1. Go to https://sheets.google.com and create a new blank spreadsheet. Name it
   **Wedding RSVPs** (any name is fine).
2. In the sheet, open **Extensions > Apps Script**. A code editor opens with an empty `Code.gs`.
3. Delete what is there, paste the entire contents of `Code.gs` from this folder, and press
   the save icon.
4. Click **Deploy > New deployment**. Click the gear next to "Select type" and choose **Web app**.
   - Description: `RSVP`
   - Execute as: **Me**
   - Who has access: **Anyone**
   Click **Deploy**.
5. Google asks you to authorise the script. Choose your account, click **Advanced**, then
   **Go to Untitled project (unsafe)** (it is your own script, this warning is normal), then **Allow**.
6. Copy the **Web app URL** it shows (it ends in `/exec`).
7. Open `index.html`, find this line near the bottom:

       var RSVP_ENDPOINT = '';

   and paste the URL between the quotes:

       var RSVP_ENDPOINT = 'https://script.google.com/macros/s/.../exec';

8. Save, then run Save Brain (or `git push` from this folder). The site redeploys in a minute.

## Test it

Open the site, fill in the RSVP form with a test name, and press Send. A row appears in the
sheet's **Responses** tab within a few seconds and an email arrives at basil2fxs@gmail.com.
If the sheet does not receive it, the website falls back to opening the guest's mail app with
the reply pre-filled, so nothing is lost either way.

## Changing things later

- To stop the emails, set `NOTIFY_EMAIL = ''` in the script and deploy again
  (**Deploy > Manage deployments > edit > Version: New version > Deploy**).
- Every time you edit `Code.gs` you must create a new version the same way, or the old code keeps running.
- The columns are: Received, Names, Attending, Number, Events, Dietary, Contact, Song, Message,
  Language, Submitted (device time).
