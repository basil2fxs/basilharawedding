// RSVP collector for basilharawedding.com
// -----------------------------------------
// Paste this into a Google Apps Script attached to a Google Sheet, deploy it as a
// web app, and put the web app URL into RSVP_ENDPOINT near the bottom of index.html.
// Every reply on the website then lands as a row in the sheet, and you get an email.
// Full steps are in README.md next to this file.

var NOTIFY_EMAIL = 'basil2fxs@gmail.com';   // where the "new RSVP" email goes ('' to switch it off)
var SHEET_NAME   = 'Responses';

var COLUMNS = ['Received', 'Names', 'Attending', 'Number', 'Events', 'Dietary', 'Contact', 'Song', 'Message', 'Language', 'Submitted (device time)'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var p = (e && e.parameter) || {};
    var sheet = getSheet_();
    var row = [
      new Date(),
      p.names || '', p.attending || '', p.count || '', p.events || '', p.dietary || '',
      p.contact || '', p.song || '', p.message || '', p.language || '', p.submitted || ''
    ];
    sheet.appendRow(row);
    if (NOTIFY_EMAIL) notify_(row);
    return json_({ result: 'ok' });
  } catch (err) {
    return json_({ result: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Opening the web app URL in a browser just confirms it is alive.
function doGet() {
  return json_({ result: 'ok', message: 'RSVP endpoint is live' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function notify_(row) {
  var lines = [];
  for (var i = 1; i < COLUMNS.length; i++) { if (row[i]) lines.push(COLUMNS[i] + ': ' + row[i]); }
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'Wedding RSVP: ' + (row[1] || 'new reply') + ' (' + (row[2] || '') + ')',
    body: lines.join('\n') + '\n\nSheet: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
