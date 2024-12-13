/**
 * Validates an email address.
 * @param {string} email - The email address to validate.
 * @throws {Error} If the email is invalid or empty.
 */
export function validateEmail({ email }: { email: string }): void {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email input');
  }
  
  // List of known problematic email patterns
  const excludedPatterns = [
    /@qq.com$/i,          // QQ mail
    /@163.com$/i,         // NetEase
    /@126.com$/i,         // NetEase
    /@yeah.net$/i,        // NetEase
    /disposable/i,        // Disposable email services
    /temporary/i,         // Temporary email services
    /spam/i,              // Spam-related
    /yopmail/i,           // YOPmail disposable service
    /tempmail/i,          // Temp mail services
    /guerrillamail/i,     // Guerrilla Mail
    /10minutemail/i,       // 10 Minute Mail
    /gmail.com$/i,
    /yahoo.com$/i,
    /hotmail.com$/i,
    /outlook.com$/i,
    /live.com$/i,
    /aol.com$/i,
    /icloud.com$/i,
    /protonmail.com$/i,
    /zoho.com$/i,
    /mail.com$/i,
    /gmx.com$/i,
    /yandex.com$/i,
    /tutanota.com$/i,
    /fastmail.com$/i,
    /hushmail.com$/i,
    /runbox.com$/i,
    /posteo.de$/i,
    /mailbox.org$/i,
    /disroot.org$/i,
    /kolabnow.com$/i,
    /riseup.net$/i,
    /autistici.org$/i,
    /tuta.io$/i,
    /disroot.org$/i,
    /countermail.com$/i,
    /openmailbox.org$/i,
    /protonmail.ch$/i,
    /protonmail.com$/i,
    /tutanota.com$/i,
    /keemail.me$/i
  ];

  // Check if email matches any excluded pattern
  for (const pattern of excludedPatterns) {
    if (pattern.test(email)) {
      throw new Error('Please use a company email address to sign up')
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new Error('Invalid email format');
  }
}