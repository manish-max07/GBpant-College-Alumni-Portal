const crypto = require('crypto');

/**
 * Generate a random CAPTCHA string
 * @param {number} length - Length of the CAPTCHA string
 * @returns {string} Random alphanumeric string
 */
function generateRandomString(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  // Use crypto for better randomization (not Math.random)
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % chars.length;
    result += chars.charAt(randomIndex);
  }

  return result;
}

/**
 * Create a secure hash for CAPTCHA verification
 * @param {string} text - CAPTCHA text
 * @param {number} timestamp - Timestamp when CAPTCHA was generated
 * @returns {string} SHA-256 hash
 */
function createSecureHash(text, timestamp) {
  const salt = process.env.CAPTCHA_SALT || "gbpant_alumni_captcha_salt_2024";
  const combined = text.toLowerCase() + timestamp.toString() + salt;
  return crypto.createHash("sha256").update(combined).digest("hex");
}

/**
 * Generate SVG-based CAPTCHA image (fallback method)
 * @param {string} text - Text to display in CAPTCHA
 * @returns {string} Base64 encoded SVG data URL
 */
function generateSVGCaptcha(text) {
  const width = 200;
  const height = 60;
  const fontSize = 24;
  
  // Generate noise elements
  let noiseCircles = "";
  for (let i = 0; i < 50; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const r = Math.random() * 3 + 1;
    const opacity = Math.random() * 0.3 + 0.1;
    const color = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`;
    noiseCircles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}" />`;
  }

  // Generate noise lines
  let noiseLines = "";
  for (let i = 0; i < 8; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    const opacity = Math.random() * 0.3 + 0.1;
    const color = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`;
    noiseLines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="${opacity}" />`;
  }

  // Generate character elements with distortion
  let textElements = "";
  const charWidth = width / text.length;
  const fonts = ["Arial", "Times New Roman", "Courier New", "Helvetica", "Georgia"];
  
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const x = i * charWidth + charWidth / 2 + (Math.random() - 0.5) * 10;
    const y = height / 2 + (Math.random() - 0.5) * 10;
    const rotation = (Math.random() - 0.5) * 30;
    const scale = 0.8 + Math.random() * 0.4;
    const font = fonts[Math.floor(Math.random() * fonts.length)];
    const color = `rgb(${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 80)})`;
    
    textElements += `
      <text x="${x}" y="${y}" 
            font-family="${font}" 
            font-size="${fontSize * scale}" 
            fill="${color}" 
            text-anchor="middle" 
            dominant-baseline="middle"
            transform="rotate(${rotation} ${x} ${y})">
        ${char}
      </text>`;
  }

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#e9ecef;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#dee2e6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" />
      ${noiseCircles}
      ${noiseLines}
      ${textElements}
    </svg>`;

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate Canvas-based PNG CAPTCHA (requires canvas package)
 * @param {string} text - Text to display in CAPTCHA
 * @returns {string} Base64 encoded PNG data URL
 */
function generateCanvasCaptcha(text) {
  try {
    // Try to use canvas package if available
    const { createCanvas } = require('canvas');
    
    const width = 200;
    const height = 60;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(0.5, '#e9ecef');
    gradient.addColorStop(1, '#dee2e6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add noise dots
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 2 + 1;
      const color = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Add noise lines
    for (let i = 0; i < 5; i++) {
      const x1 = Math.random() * width;
      const y1 = Math.random() * height;
      const x2 = Math.random() * width;
      const y2 = Math.random() * height;
      const color = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw characters with distortion
    const charWidth = width / text.length;
    const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Helvetica', 'Georgia'];
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      const x = i * charWidth + charWidth / 2 + (Math.random() - 0.5) * 10;
      const y = height / 2 + (Math.random() - 0.5) * 8;
      const fontSize = 20 + Math.random() * 8;
      const rotation = (Math.random() - 0.5) * 0.4;
      const font = fonts[Math.floor(Math.random() * fonts.length)];
      const color = `rgb(${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 80)})`;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.font = `${fontSize}px ${font}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 1;
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    // Add overlay noise
    for (let i = 0; i < 10; i++) {
      const x1 = Math.random() * width;
      const y1 = Math.random() * height;
      const x2 = Math.random() * width;
      const y2 = Math.random() * height;
      
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, 0.2)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    return canvas.toDataURL('image/png');
  } catch (error) {
    // Fall back to SVG if canvas is not available
    console.warn('Canvas package not available, falling back to SVG CAPTCHA');
    return generateSVGCaptcha(text);
  }
}

/**
 * Generate CAPTCHA challenge
 * @returns {Object} CAPTCHA data including image and metadata
 */
function generateCaptchaChallenge() {
  const captchaText = generateRandomString(6);
  const timestamp = Date.now();
  const hash = createSecureHash(captchaText, timestamp);
  
  // Try canvas first, fall back to SVG
  const imageData = generateCanvasCaptcha(captchaText);
  
  return {
    success: true,
    imageData,
    hash,
    timestamp,
    // Don't send the actual text to client for security
    textLength: captchaText.length
  };
}

/**
 * Verify CAPTCHA response
 * @param {string} userInput - User's CAPTCHA input
 * @param {string} storedHash - Stored hash from generation
 * @param {number} storedTimestamp - Stored timestamp from generation
 * @returns {Object} Verification result
 */
function verifyCaptchaChallenge(userInput, storedHash, storedTimestamp) {
  const currentTime = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  const minAge = 2 * 1000; // 2 seconds (anti-bot measure)

  // Check if CAPTCHA has expired
  if (currentTime - storedTimestamp > maxAge) {
    return {
      success: false,
      shouldRegenerate: true,
      message: 'CAPTCHA has expired. Please try again.'
    };
  }

  // Anti-bot check - prevent instant submissions
  if (currentTime - storedTimestamp < minAge) {
    return {
      success: false,
      message: 'Please take your time to solve the CAPTCHA.'
    };
  }

  // Verify input by recreating hash
  const userInputHash = createSecureHash(userInput, storedTimestamp);
  
  if (userInputHash === storedHash) {
    return {
      success: true,
      message: 'CAPTCHA verified successfully.'
    };
  } else {
    return {
      success: false,
      shouldRegenerate: true,
      message: 'Incorrect CAPTCHA. Please try again.'
    };
  }
}

module.exports = {
  generateRandomString,
  createSecureHash,
  generateSVGCaptcha,
  generateCanvasCaptcha,
  generateCaptchaChallenge,
  verifyCaptchaChallenge
};
