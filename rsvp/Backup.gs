// Backup of the RSVP replies as a plain CSV file
// -----------------------------------------------
// This script is bound to the "Wedding RSVPs" Google Sheet (Extensions > Apps Script).
// Every time a guest replies (and once a day as a safety net) it rewrites
// "Wedding RSVPs.csv" in the same Drive folder as the Sheet (Basil's Brain/Wedding).
// Google Drive for desktop syncs that CSV to the Mac as a real file, so the
// Save Brain command commits the actual replies, not just a .gsheet shortcut.
// The Sheet and the CSV stay private to Basil's Google account; neither is in
// the public website repo.
//
// One-off setup (already done): run installTriggers() once from the Apps Script
// editor and approve the permission prompt. To re-install, run it again.

var BACKUP_NAME = 'Wedding RSVPs.csv';

function backupResponses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone();
  var sheet = ss.getSheets()[0];                       // "Form Responses 1"
  var values = sheet.getDataRange().getValues();
  var lines = values.map(function (row) {
    return row.map(function (cell) {
      var s = (cell instanceof Date)
        ? Utilities.formatDate(cell, tz, 'yyyy-MM-dd HH:mm:ss')
        : String(cell == null ? '' : cell);
      return '"' + s.replace(/"/g, '""') + '"';
    }).join(',');
  });
  var csv = lines.join('\r\n') + '\r\n';

  // Write next to the Sheet itself, so moving the Sheet moves the backup too.
  var parents = DriveApp.getFileById(ss.getId()).getParents();
  var folder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  var existing = folder.getFilesByName(BACKUP_NAME);
  if (existing.hasNext()) {
    existing.next().setContent(csv);
  } else {
    folder.createFile(BACKUP_NAME, csv, MimeType.CSV);
  }
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
