/**
 * Concentrik · Plan X landing page receiver
 * Google Apps Script web app: validates on the server, writes each lead to a
 * Google Sheet and emails the team a notification.
 *
 * Setup: see README.md in this folder.
 */

const SHEET_NAME = 'Plan X leads';
const NOTIFY_EMAIL = 'contact@concentrik.com';   // who gets the new-lead email
const COLUMNS = [
  'submittedAt', 'fullName', 'email', 'phone', 'company', 'role', 'linkedin', 'interest',
  'teamSize', 'message', 'consent', 'event', 'leadSource',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
  'pageUrl', 'referrer', 'timezone', 'receivedAt'
];
const INTERESTS = ['Executive Circle', 'Founder Circle', 'Membership with a private office'];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Honeypot: bots fill it, people never see it. Accept silently.
  if (p.website) return json_({ ok: true });

  const errors = [];
  const s = k => String(p[k] || '').trim().slice(0, 1000);
  if (s('fullName').length < 2) errors.push('fullName');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s('email'))) errors.push('email');
  if (!/^\+\d{1,4} \d{6,14}$/.test(s('phone'))) errors.push('phone');
  if (!s('company')) errors.push('company');
  if (s('role').length < 2) errors.push('role');
  if (INTERESTS.indexOf(s('interest')) === -1) errors.push('interest');
  if (s('consent') !== 'yes') errors.push('consent');
  if (errors.length) return json_({ ok: false, errors: errors });

  // Simple rate limit: one submission per email per 2 minutes.
  const cache = CacheService.getScriptCache();
  const key = 'lead_' + s('email').toLowerCase();
  if (cache.get(key)) return json_({ ok: true, duplicate: true });
  cache.put(key, '1', 120);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    const row = COLUMNS.map(c => c === 'receivedAt' ? new Date() : safe_(s(c)));
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }

  try {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      replyTo: s('email'),
      subject: 'Plan X invitation request: ' + s('fullName') + ', ' + s('company') + ' (' + s('interest') + ')',
      body: [
        'New invitation request from the Plan X QR landing page.', '',
        'Name: ' + s('fullName'),
        'Email: ' + s('email'),
        'Mobile: ' + s('phone'),
        'Company: ' + s('company'),
        'Role: ' + s('role'),
        'LinkedIn: ' + (s('linkedin') || 'not given'),
        'Interested in: ' + s('interest') + (s('teamSize') ? ' (team: ' + s('teamSize') + ')' : ''),
        'Note: ' + (s('message') || 'none'), '',
        'Reply to this email to answer them directly.'
      ].join('\n')
    });
  } catch (err) {
    console.error('Notification email failed', err);
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
