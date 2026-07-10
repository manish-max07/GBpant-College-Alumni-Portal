// Simple rate limiting without external dependencies
const rateMap = new Map();

// Clean up rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateMap.entries()) {
    if (now - data.windowStart > data.windowMs) {
      rateMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Email rate limiting to prevent abuse
const emailRateLimit = (req, res, next) => {
  const key = `${req.ip}_${req.body.email || 'unknown'}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  let userData = rateMap.get(key);
  
  if (!userData) {
    userData = { count: 0, windowStart: now, windowMs };
    rateMap.set(key, userData);
  }

  // Reset if window expired
  if (now - userData.windowStart > windowMs) {
    userData.count = 0;
    userData.windowStart = now;
  }

  userData.count++;

  if (userData.count > maxAttempts) {
    console.warn(`🚨 EMAIL RATE LIMIT EXCEEDED:`, {
      ip: req.ip,
      email: req.body.email?.replace(/(.{2}).*@/, '$1***@') || 'unknown',
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      endpoint: req.originalUrl
    });

    return res.status(429).json({
      success: false,
      message: 'Too many email requests. Please try again later.',
      retryAfter: '15 minutes'
    });
  }

  next();
};

// Stricter rate limiting for password reset emails
const passwordResetRateLimit = (req, res, next) => {
  const key = `${req.ip}_${req.body.email || 'unknown'}_password_reset`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxAttempts = 3;

  let userData = rateMap.get(key);
  
  if (!userData) {
    userData = { count: 0, windowStart: now, windowMs };
    rateMap.set(key, userData);
  }

  // Reset if window expired
  if (now - userData.windowStart > windowMs) {
    userData.count = 0;
    userData.windowStart = now;
  }

  userData.count++;

  if (userData.count > maxAttempts) {
    console.warn(`🚨 PASSWORD RESET RATE LIMIT EXCEEDED:`, {
      ip: req.ip,
      email: req.body.email?.replace(/(.{2}).*@/, '$1***@') || 'unknown',
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    return res.status(429).json({
      success: false,
      message: 'Too many password reset attempts. Please try again after 1 hour.',
      retryAfter: '1 hour'
    });
  }

  next();
};

// Email validation middleware
const validateEmailRequest = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  // Comprehensive list of temporary/fake email domains to block
  const bannedDomains = [
    // Explicitly mentioned domains
    'tempmail.com', 'tempmail.org', 'temp-mail.org', 'temp-mail.io',
    'mailinator.com', 'guerrillamail.com', '10minutemail.com', '10minutemail.net',
    'yopmail.com', 'yopmail.net', 'throwawaymail.com', 'dispostable.com',
    'getnada.com', 'maildrop.cc', 'sharklasers.com', 'grr.la',
    'guerillamail.net', 'spambog.com', 'spambog.de', 'spambog.ru',
    'trashmail.com', 'trashmail.de', 'fakeinbox.com', 'mintemail.com',
    'skateru.com', 'futurejs.com','admin.com','daouse.com','wyoxafp.com',
    
    // Additional known temporary email domains
    'mohmal.com', 'emailondeck.com', 'tempmail.net', 'temp-mail.com',
    'guerrillamailblock.com', 'guerrillamail.org', 'guerrillamail.biz',
    'guerrillamail.de', 'spam4.me', 'tempail.com', 'tmpemail.com',
    'tempinbox.com', 'tempmailer.com', 'tempmailer.de', 'tempmailaddress.com',
    'tempemail.com', 'tempemail.net', 'tempmailator.com', 'tempemailaddress.com',
    'tempemailgenerator.com', 'throwaway.email', 'trashemailgenerator.com',
    'tempmails.net', 'tmailor.com', 'nwldx.com', 'e4ward.com',
    'mailexpire.com', 'mailnesia.com', 'mailcatch.com', 'emailfake.com',
    'guerrilla.email', 'getairmail.com', 'mytrashmail.com', 'notmailinator.com',
    'spamgourmet.com', 'spamhole.com', 'spamstack.net', 'spamthisplease.com',
    'spaml.com', 'disposableemailaddresses.com', 'disposableinbox.com',
    'disposeamail.com', 'dodgeit.com', 'dontsendmespam.de', 'drdrb.net',
    'dumpyemail.com', 'e-mail.org', '0-mail.com', '20minutemail.com',
    'anonbox.net', 'binkmail.com', 'bobmail.info', 'byom.de',
    'chammy.info', 'childsavetrust.org', 'cool.fr.nf', 'correo.blogos.net',
    'damnthespam.com', 'deadaddress.com', 'deadspam.com', 'demail.tk',
    'despammed.com', 'devnullmail.com', 'dt.dirtycleanfun.nl',
    'fastacura.com', 'filzmail.com', 'gishpuppy.com', 'gotti.otherinbox.com',
    'great-host.in', 'hidemail.de', 'hotpop.com', 'incognitomail.org',
    'jetable.org', 'junk1e.com', 'kasmail.com', 'klzlk.com',
    'kurzepost.de', 'lifebyfood.com', 'link2mail.net', 'lookugly.com',
    'mail-temporaire.fr', 'mail.by', 'mail2rss.org', 'mailbidon.com',
    'mailforspam.com', 'mailfreeonline.com', 'mailin8r.com',
    'mailinator.net', 'mailinator.org', 'mailinator2.com',
    'mailmetrash.com', 'mailmoat.com', 'mailnull.com', 'mailzilla.com',
    'mbx.cc', 'mt2009.com', 'mx0.wwwnew.eu', 'myspaceinc.com',
    'myspaceinc.net', 'myspaceinc.org', 'myspacepimpedup.com',
    'mytrashemail.com', 'noclickemail.com', 'nogmailspam.info',
    'nomail.xl.cx', 'nomail2me.com', 'nomorespamemails.com',
    'nowmymail.com', 'objectmail.com', 'obobbo.com', 'odnorazovoe.ru',
    'oneoffemail.com', 'onewaymail.com', 'opayq.com', 'ordinaryamerican.net',
    'owlpic.com', 'pookmail.com', 'proxymail.eu', 'punkass.com',
    'putthisinyourspamdatabase.com', 'quickinbox.com', 'rcpt.at',
    'recode.me', 'recursor.net', 'regbypass.comsafe-mail.net',
    'safetymail.info', 'sandspambox.com', 'selfdestructingmail.com',
    'sendspamhere.com', 'shitmail.me', 'shitware.nl', 'shortmail.net',
    'sibmail.com', 'smellfear.com', 'snakemail.com', 'sneakemail.com',
    'sofort-mail.de', 'sogetthis.com', 'soodonims.com', 'spam.la',
    'spamavert.com', 'spambob.com', 'spambob.net', 'spambob.org',
    'spamday.com', 'spamex.com', 'spamfree24.org', 'spamgoes.com',
    'spamherelots.com', 'spamhereplease.com', 'spamio.de',
    'spamlot.com', 'spammotel.com', 'spamobox.com', 'spamspot.com',
    'spamthis.co.uk', 'spamtroll.net', 'speed.1s.fr', 'squizzy.de',
    'super-auswahl.de', 'supergreatmail.com', 'supermailer.jp',
    'superrito.com', 'teewars.org', 'temp-mail.ru', 'tempail.tk',
    'tempalias.com', 'tempe-mail.com', 'tempemail.biz', 'tempemail.co.za',
    'tempinbox.co.uk', 'tempmail.it', 'tempmail.tk', 'tempmaildemo.com',
    'tempmailer.info', 'tempmailid.com', 'tempmailinbox.com',
    'tempthe.net', 'thankyou2010.com', 'thisisnotmyrealemail.com',
    'throam.com', 'tilien.com', 'tmail.ws', 'tmailinator.com',
    'toiea.com', 'tradermail.info', 'trash2009.com', 'trash-amil.com',
    'trashdevil.com', 'trashemail.de', 'trashmail.at', 'trashmail.me',
    'trashmail.net', 'trashmail.org', 'trashmail.ws', 'trashmailer.com',
    'trashymail.com', 'trialmail.de', 'tryalert.com', 'turual.com',
    'twinmail.de', 'tyldd.com', 'uggsrock.com', 'wegwerfmail.de',
    'wegwerfmail.net', 'wegwerfmail.org', 'wh4f.org', 'whyspam.me',
    'willselfdestruct.com', 'winemaven.info', 'wronghead.com',
    'wuzup.net', 'xents.com', 'xmaily.com', 'xoxy.net',
    'yapped.net', 'yuurok.com', 'zehnminutenmail.de', 'zoemail.org'
  ];

  // Extract domain from email
  const emailDomain = email.toLowerCase().split('@')[1];
  
  // Check if email domain is in banned list
  if (bannedDomains.includes(emailDomain)) {
    console.warn(`🚨 TEMPORARY EMAIL BLOCKED:`, {
      email: email.replace(/(.{2}).*@/, '$1***@'),
      domain: emailDomain,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    return res.status(400).json({
      success: false,
      message: 'Suspicious email detected. You are not allowed to sign up, your IP will be blocked',
      errorType: 'TEMP_EMAIL_DETECTED'
    });
  }

  // Block suspicious email patterns (additional fallback)
  const suspiciousPatterns = [
    /temp.*mail/i,
    /trash.*mail/i,
    /guerrilla.*mail/i,
    /10.*minute.*mail/i,
    /mailinator/i,
    /throw.*away/i,
    /disposable/i,
    /spam/i,
    /fake.*mail/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(email));
  if (isSuspicious) {
    console.warn(`🚨 SUSPICIOUS EMAIL PATTERN BLOCKED:`, {
      email: email.replace(/(.{2}).*@/, '$1***@'),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    return res.status(400).json({
      success: false,
      message: 'Suspicious email detected. You are not allowed to sign up, your IP will be blocked',
      errorType: 'TEMP_EMAIL_DETECTED'
    });
  }

  next();
};

// Security logging middleware for email operations
const logEmailAttempt = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log email attempts for security monitoring
    console.log(`📧 EMAIL ATTEMPT:`, {
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip,
      email: req.body.email?.replace(/(.{2}).*@/, '$1***@') || 'unknown',
      userAgent: req.get('User-Agent'),
      success: typeof data === 'string' ? JSON.parse(data).success : data.success,
      timestamp: new Date().toISOString()
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  emailRateLimit,
  passwordResetRateLimit,
  validateEmailRequest,
  logEmailAttempt
};
