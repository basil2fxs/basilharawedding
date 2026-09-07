// Apps Script bound to the "Wedding RSVPs" Google Sheet (Extensions > Apps Script, project "RSVP backup").
// This one file does two jobs:
//
//  1. doPost: the website's reply endpoint. Deployed as a web app (execute as Basil, anyone may post),
//     it writes one row per guest into the "Responses" tab, ignores a repeat of the same reply id
//     (so the site can retry safely), refreshes the CSV, and answers {"result":"ok"} so the website
//     can tell the guest their reply has truly reached us.
//  2. backupResponses: rewrites "Wedding RSVPs.csv" (and the form-fallback CSV) next to the Sheet in
//     Drive, so Google Drive for desktop syncs a real file to the Mac and Save Brain commits it.
//
// One-off setup (done 7 Sep 2026): run installTriggers() once and approve the permission prompt;
// then Deploy > New deployment > Web app, execute as Me, access Anyone, and put the /exec URL into
// RSVP_ENDPOINT near the bottom of index.html. Re-deploy (Manage deployments > edit > new version)
// after changing doPost, or the live endpoint keeps running the old code.

var BACKUP_NAME = 'Wedding RSVPs.csv';
var FALLBACK_BACKUP_NAME = 'Wedding RSVPs (form fallback).csv';
var RESPONSES = 'Responses';
var FORM_TAB = 'Form Responses 1';
var HEADER = ['Received', 'Reply id', 'Names', 'Attending', 'Number attending', 'Events', 'Dietary',
              'Contact', 'Song', 'Message', 'Language', 'Submitted (device time)', 'Source'];

// ---------------------------------------------------------------- the endpoint
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(20000);
  try {
    var data;
    try { data = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
    catch (err) { return json_({ result: 'error', message: 'bad json' }); }
    if (!data || !data.guests || !data.guests.length) return json_({ result: 'error', message: 'no guests' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getSheet_(ss, data.test ? 'Test' : RESPONSES);
    var id = String(data.id || '').slice(0, 64) || Utilities.getUuid();

    // a retry of a reply that already landed is answered "ok" without writing it twice
    var last = sheet.getLastRow();
    var ids = last > 1 ? sheet.getRange(2, 2, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
    if (ids.indexOf(id) >= 0) return json_({ result: 'ok', id: id, rows: 0, repeat: true });

    var now = new Date(), rows = [], first = data.guests[0];
    var withTag = (data.language === 'el' ? 'Μαζί με: ' : 'With: ') + s_(first.name);
    data.guests.slice(0, 20).forEach(function (g, i) {
      rows.push([now, id, s_(g.name), s_(g.attending), Number(g.count) || 0, s_(g.events), s_(g.dietary),
                 s_(data.contact), i === 0 ? s_(data.song) : '', i === 0 ? s_(data.message) : withTag,
                 s_(data.language), s_(data.submitted), data.test ? 'test' : 'website']);
    });
    sheet.getRange(last + 1, 1, rows.length, HEADER.length).setValues(rows);
    SpreadsheetApp.flush();
    if (!data.test) { try { backupResponses(); } catch (err2) {} }
    return json_({ result: 'ok', id: id, rows: rows.length });
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

function s_(v) { return v == null ? '' : String(v).slice(0, 500); }

function getSheet_(ss, name) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADER);
    sh.getRange(1, 1, 1, HEADER.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------- the CSV backups
function backupResponses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var folder = folderOf_(ss);
  var main = getSheet_(ss, RESPONSES);          // the tab exists from day one, header and all
  writeCsv_(folder, BACKUP_NAME, csvOf_(ss, main));
  var form = ss.getSheetByName(FORM_TAB) || ss.getSheets()[0];
  if (form && form.getLastRow() > 1) writeCsv_(folder, FALLBACK_BACKUP_NAME, csvOf_(ss, form));
}

function csvOf_(ss, sheet) {
  var tz = ss.getSpreadsheetTimeZone();
  var values = sheet.getDataRange().getValues();
  return values.map(function (row) {
    return row.map(function (cell) {
      var s = (cell instanceof Date) ? Utilities.formatDate(cell, tz, 'yyyy-MM-dd HH:mm:ss') : String(cell == null ? '' : cell);
      return q_(s);
    }).join(',');
  }).join('\r\n') + '\r\n';
}

function q_(s) { return '"' + String(s).replace(/"/g, '""') + '"'; }

function folderOf_(ss) {
  // the backups sit next to the Sheet itself, so moving the Sheet moves them too
  var parents = DriveApp.getFileById(ss.getId()).getParents();
  return parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
}

function writeCsv_(folder, name, csv) {
  var existing = folder.getFilesByName(name);
  if (existing.hasNext()) existing.next().setContent(csv);
  else folder.createFile(name, csv, MimeType.CSV);
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('backupResponses')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
  ScriptApp.newTrigger('backupResponses')
    .timeBased()
    .everyDays(1)
    .atHour(20)
    .create();
  backupResponses();
}
