/**
 * GripAndReview - Apps Script backend (Sheet B)
 *
 * Subscribers sheet columns (header row):
 *   A: JoinDate | B: Email | C: Status | D: Token
 *
 * Reviews sheet unchanged (see earlier).
 *
 * IMPORTANT:
 * - Ganti WEB_APP_URL dengan URL Web App Anda (https://script.google.com/macros/s/AKfy.../exec)
 */

const WEB_APP_URL = "REPLACE_WITH_YOUR_WEBAPP_URL"; // <-- GANTI DENGAN URL /exec web app Anda
const MAX_REVIEWS_PER_EMAIL = 3;
const TEMP_DOMAINS = ['tempmail.com','10minutemail.com','mailinator.com','guerrillamail.com','10minutemail.net','yopmail.com'];
const BLOCKED_DOMAINS = ['spamdomain.com','badsite.xyz'];

// Allowed domains (unchanged)
const ALLOWED_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.id',
  'outlook.com', 'outlook.co.uk',
  'hotmail.com',
  'live.com',
  'msn.com'
];

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// helpers
function sanitizeText(text) {
  if (!text) return '';
  return text.replace(/https?:\/\/[^\s]+/gi, '[link nonaktif]').replace(/\bwww\.[^\s]+/gi, '[link nonaktif]');
}
function extractDomains(text) {
  if (!text) return [];
  const regex = /https?:\/\/([^\/\s]+)/gi;
  const matches = [];
  let m;
  while ((m = regex.exec(text)) !== null) matches.push(m[1].toLowerCase());
  return matches;
}
function isTempMail(email) {
  if (!email) return false;
  const domain = (email.split('@')[1] || '').toLowerCase();
  return TEMP_DOMAINS.some(d => domain.indexOf(d) !== -1);
}
function isAllowedDomain(email) {
  if (!email || email.indexOf('@') === -1) return false;
  const domain = (email.split('@')[1] || '').toLowerCase();
  return ALLOWED_DOMAINS.some(d => domain === d);
}
function generateToken() {
  return Utilities.getUuid();
}

/** find subscriber row by email
 * returns { row: number (sheet row index) , rowValues: array } or null
 */
function findSubscriberRow(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const s = ss.getSheetByName('Subscribers');
  if (!s) return null;
  const last = s.getLastRow();
  if (last < 2) return null;
  const rows = s.getRange(2, 1, last - 1, 4).getValues(); // JoinDate, Email, Status, Token
  email = (email || '').toLowerCase();
  for (let i = 0; i < rows.length; i++) {
    const rowEmail = (rows[i][1] || '').toString().toLowerCase();
    if (rowEmail === email) {
      return { row: i + 2, rowValues: rows[i] }; // sheet row index
    }
  }
  return null;
}

function sendVerificationEmail(toEmail, token) {
  const confirmLink = WEB_APP_URL + '?action=confirm&token=' + encodeURIComponent(token);
  const subject = "Konfirmasi email - GripAndReview";
  const plainBody = "Terima kasih telah subscribe di GripAndReview.\n\nKlik link berikut untuk mengonfirmasi email Anda:\n" + confirmLink + "\n\nJika Anda tidak mendaftar, abaikan email ini.";
  const htmlBody = "<p>Terima kasih telah subscribe di <b>GripAndReview</b>.</p>" +
    "<p>Silakan klik tombol di bawah untuk mengonfirmasi email Anda:</p>" +
    "<p><a href='" + confirmLink + "' style='display:inline-block;padding:10px 16px;background:#ff6600;color:#fff;border-radius:4px;text-decoration:none'>Konfirmasi Email</a></p>" +
    "<p>Atau buka link ini: <br/><small>" + confirmLink + "</small></p>" +
    "<p>Jika Anda tidak mendaftar, abaikan email ini.</p>";

  MailApp.sendEmail({
    to: toEmail,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody
  });
}

/**
 * POST handler:
 * - { type: "subscribe", email }
 * - { type: "review", ... } (review logic later)
 */
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) return jsonResponse({ status: 'error', message: 'no post data' });
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ---------- SUBSCRIBE ----------
    if (data.type === 'subscribe') {
      let email = (data.email || '').toString().trim().toLowerCase();
      if (!email) return jsonResponse({ status: 'error', message: 'email required' });

      // format validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) return jsonResponse({ status: 'error', message: 'invalid email format' });

      // allowed domain
      if (!isAllowedDomain(email)) return jsonResponse({ status: 'error', message: 'only Gmail, Yahoo, or Outlook/Hotmail allowed' });

      // temporary mail check
      if (isTempMail(email)) return jsonResponse({ status: 'error', message: 'temporary email not allowed' });

      // ensure Subscribers sheet exists
      const subs = ss.getSheetByName('Subscribers');
      if (!subs) return jsonResponse({ status: 'error', message: 'Subscribers sheet missing' });

      const found = findSubscriberRow(email);
      if (found) {
        const status = (found.rowValues[2] || '').toString().toLowerCase(); // col C Status
        // If already approved
        if (status === 'approved') {
          return jsonResponse({ status: 'exists_approved', message: 'email already subscribed and approved' });
        }
        // If pending -> resend verification (generate new token)
        const newToken = generateToken();
        subs.getRange(found.row, 4).setValue(newToken); // col D Token
        subs.getRange(found.row, 1).setValue(new Date()); // update timestamp optionally
        // send email
        try {
          sendVerificationEmail(email, newToken);
        } catch (errMail) {
          // still return exists_pending but note email send failure
          return jsonResponse({ status: 'exists_pending', message: 'resend failed: ' + errMail.toString() });
        }
        return jsonResponse({ status: 'exists_pending', message: 'verification email resent' });
      }

      // else create new pending subscriber
      const token = generateToken();
      subs.appendRow([new Date(), email, 'pending', token]);
      // send verification email
      try {
        sendVerificationEmail(email, token);
      } catch (errMail) {
        return jsonResponse({ status: 'error', message: 'failed sending verification email: ' + errMail.toString() });
      }
      return jsonResponse({ status: 'ok', message: 'subscribed_pending' });
    }

    // ---------- REVIEW ----------
    if (data.type === 'review') {
      const name = (data.name || '').trim();
      const email = (data.email || '').trim().toLowerCase();
      const rating = Number(data.rating || 0);
      const text = (data.text || '').trim();
      const marketplace = (data.marketplace || '').trim();

      if (!name || !email || !text || rating < 1 || rating > 5) {
        return jsonResponse({ status: 'error', message: 'missing or invalid fields' });
      }

      // check subscriber and approval
      const sub = findSubscriberRow(email);
      if (!sub) return jsonResponse({ status: 'error', message: 'email not subscribed' });
      const status = (sub.rowValues[2] || '').toString().toLowerCase();
      if (status !== 'approved') return jsonResponse({ status: 'error', message: 'email not verified' });

      if (isTempMail(email)) return jsonResponse({ status: 'error', message: 'temporary email not allowed' });

      // limit reviews per email
      const cnt = countReviewsForEmail(email);
      if (cnt >= MAX_REVIEWS_PER_EMAIL) return jsonResponse({ status: 'error', message: 'max reviews reached' });

      // sanitize / moderation logic (existing)
      const domains = extractDomains(text);
      let moderation = false, visible = true, reason = '', urlDisabled = false;
      if (domains.length > 0) urlDisabled = true;
      const blocked = domains.find(d => BLOCKED_DOMAINS.some(b => d.indexOf(b) !== -1));
      if (blocked) { moderation = true; visible = false; reason = 'blocked_domain:' + blocked; }

      const sanitized = sanitizeText(text);
      const rev = ss.getSheetByName('Reviews');
      if (!rev) return jsonResponse({ status: 'error', message: 'Reviews sheet missing' });

      rev.appendRow([
        new Date(),
        name,
        email,
        rating,
        sanitized,
        marketplace,
        visible ? 'TRUE' : 'FALSE',
        moderation ? 'TRUE' : 'FALSE',
        reason,
        urlDisabled ? 'TRUE' : 'FALSE'
      ]);
      return jsonResponse({ status: 'ok', moderation: moderation });
    }

    return jsonResponse({ status: 'error', message: 'unknown type' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * GET handler:
 * - ?action=list_reviews
 * - ?action=all_reviews
 * - ?action=list_subscribers
 * - ?action=confirm&token=...  <-- token confirmation (opened in browser)
 */
function doGet(e) {
  try {
    const action = (e.parameter.action || 'list_reviews').toString().toLowerCase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'confirm') {
      const token = (e.parameter.token || '').toString().trim();
      if (!token) {
        return HtmlService.createHtmlOutput("<h3>Token tidak ditemukan.</h3>");
      }
      const subs = ss.getSheetByName('Subscribers');
      if (!subs) return HtmlService.createHtmlOutput("<h3>Subscribers sheet missing.</h3>");
      const last = subs.getLastRow();
      if (last < 2) return HtmlService.createHtmlOutput("<h3>Tidak ada subscriber.</h3>");

      const rows = subs.getRange(2, 1, last - 1, 4).getValues(); // A-D
      let found = false;
      for (let i = 0; i < rows.length; i++) {
        const rowToken = (rows[i][3] || '').toString();
        if (rowToken === token) {
          // set status approved, clear token
          subs.getRange(i + 2, 3).setValue('approved'); // col C
          subs.getRange(i + 2, 4).setValue(''); // clear token
          found = true;
          break;
        }
      }
      if (found) {
        const html = HtmlService.createHtmlOutput(
          "<h3>Terima kasih — Email Anda sudah terverifikasi.</h3>" +
          "<p>Anda sekarang dapat menulis review di GripAndReview.</p>" +
          "<p><a href='https://gripandreview.com'>Kembali ke GripAndReview</a></p>"
        );
        return html;
      } else {
        return HtmlService.createHtmlOutput("<h3>Token tidak valid atau kadaluarsa.</h3>");
      }
    }

    if (action === 'list_reviews') {
      const sheet = ss.getSheetByName('Reviews');
      if (!sheet) return jsonResponse([]);
      const last = sheet.getLastRow();
      if (last < 2) return jsonResponse([]);
      const rows = sheet.getRange(2, 1, last - 1, 10).getValues();
      const data = rows.map(r => ({
        Timestamp: r[0], Name: r[1], Email: r[2], Rating: r[3], Review: r[4],
        Marketplace: r[5], Visible: r[6], Moderation: r[7], Reason: r[8], UrlDisabled: r[9]
      })).filter(x => x.Visible === 'TRUE');
      return jsonResponse(data);
    }

    if (action === 'all_reviews') {
      const sheet = ss.getSheetByName('Reviews');
      if (!sheet) return jsonResponse([]);
      const last = sheet.getLastRow();
      if (last < 2) return jsonResponse([]);
      const rows = sheet.getRange(2, 1, last - 1, 10).getValues();
      const data = rows.map(r => ({
        Timestamp: r[0], Name: r[1], Email: r[2], Rating: r[3], Review: r[4],
        Marketplace: r[5], Visible: r[6], Moderation: r[7], Reason: r[8], UrlDisabled: r[9]
      }));
      return jsonResponse(data);
    }

    if (action === 'list_subscribers') {
      const sheet = ss.getSheetByName('Subscribers');
      if (!sheet) return jsonResponse([]);
      const last = sheet.getLastRow();
      if (last < 2) return jsonResponse([]);
      const rows = sheet.getRange(2, 1, last - 1, 4).getValues();
      const data = rows.map(r => ({ JoinDate: r[0], Email: r[1], Status: r[2] }));
      return jsonResponse(data);
    }

    return jsonResponse({ status: 'error', message: 'unknown action' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}
