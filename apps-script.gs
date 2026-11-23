/**
 * Concentrik · Plan X mailing list receiver
 * Google Apps Script web app: checks each sign-up on the server, adds it to a
 * Google Sheet (one row per email) and emails the team a notification.
 *
 * Setup: see README.md in this folder.
 */

const SHEET_NAME = 'Mailing list';
const NOTIFY_EMAIL = 'contact@concentrik.com';   // set to '' to turn off notifications
const COLUMNS = [
  'submittedAt', 'fullName', 'email', 'consent', 'event', 'leadSource',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'pageUrl', 'receivedAt'
];

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return json_({ ok: true });            // honeypot: bot, accept silently

  const s = k => String(p[k] || '').trim().slice(0, 300);
  const errors = [];
  if (s('fullName').length < 2) errors.push('fullName');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s('email'))) errors.push('email');
  if (s('consent') !== 'yes') errors.push('consent');
  if (errors.length) return json_({ ok: false, errors: errors });

  const email = s('email').toLowerCase();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    // Skip duplicates: the same email signing up twice keeps one row.
    const last = sheet.getLastRow();
    if (last > 1) {
      const col = COLUMNS.indexOf('email') + 1;
      const existing = sheet.getRange(2, col, last - 1, 1).getValues().map(r => String(r[0]).toLowerCase());
      if (existing.indexOf(email) !== -1) return json_({ ok: true, duplicate: true });
    }
    sheet.appendRow(COLUMNS.map(c => c === 'receivedAt' ? new Date() : c === 'email' ? email : safe_(s(c))));
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        replyTo: email,
        subject: 'Plan X sign-up: ' + s('fullName'),
        body: 'New mailing list sign-up from the Plan X QR page.\n\nName: ' + s('fullName') + '\nEmail: ' + email
      });
    } catch (err) {
      console.error('Notification email failed', err);
    }
  }
  return json_({ ok: true });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Stop spreadsheet formula injection (=, +, -, @ at the start of a cell).
function safe_(v) { return /^[=+\-@]/.test(v) ? "'" + v : v; }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
