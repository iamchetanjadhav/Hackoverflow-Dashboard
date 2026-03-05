import QRCode from 'qrcode';

/**
 * Hackoverflow 4.0 Brand Colors
 */
const BRAND_GRADIENT_COLORS = [
  { stop: 0, color: '#FCB216' },    // Gold
  { stop: 0.35, color: '#E85D24' }, // Orange
  { stop: 0.7, color: '#D91B57' },  // Pink
  { stop: 1, color: '#63205F' }     // Purple
];

/**
 * Generate stylish ID Card QR code for Hackoverflow 4.0 participant check-in
 * Features: Rounded corners, gradient overlay, smooth edges
 * URL format: https://checkin.hackoverflow4.tech/checkin/PARTICIPANT_ID
 * 
 * @param participantId - The unique participant ID
 * @returns Base64 encoded QR code data URL
 */
export async function generateQRCode(participantId: string): Promise<string> {
  try {
    if (!participantId || participantId.trim() === '') {
      throw new Error('Invalid participant ID');
    }

    const checkInUrl = `https://checkin.hackoverflow4.tech/participant/${participantId}`;
    console.log('Generating branded QR code for:', checkInUrl);
    
    // Generate QR code data
    const qrCodeArray = await QRCode.create(checkInUrl, {
      errorCorrectionLevel: 'H', // High quality
    });

    // Create canvas for custom rendering
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Clear canvas with transparency
    ctx.clearRect(0, 0, size, size);

    // Calculate module size with margin
    const margin = 2;
    const moduleCount = qrCodeArray.modules.size;
    const moduleSize = size / (moduleCount + margin * 2);
    const offset = moduleSize * margin;

    // Create brand gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    BRAND_GRADIENT_COLORS.forEach(({ stop, color }) => {
      gradient.addColorStop(stop, color);
    });

    ctx.fillStyle = gradient;

    // Draw QR code modules with rounded corners
    const cornerRadius = moduleSize * 0.35; // 35% rounding for smooth look

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qrCodeArray.modules.get(row, col)) {
          const x = offset + col * moduleSize;
          const y = offset + row * moduleSize;

          // Draw rounded rectangle
          ctx.beginPath();
          ctx.moveTo(x + cornerRadius, y);
          ctx.lineTo(x + moduleSize - cornerRadius, y);
          ctx.quadraticCurveTo(x + moduleSize, y, x + moduleSize, y + cornerRadius);
          ctx.lineTo(x + moduleSize, y + moduleSize - cornerRadius);
          ctx.quadraticCurveTo(x + moduleSize, y + moduleSize, x + moduleSize - cornerRadius, y + moduleSize);
          ctx.lineTo(x + cornerRadius, y + moduleSize);
          ctx.quadraticCurveTo(x, y + moduleSize, x, y + moduleSize - cornerRadius);
          ctx.lineTo(x, y + cornerRadius);
          ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Convert to PNG with transparency
    const qrCodeDataURL = canvas.toDataURL('image/png');
    
    // Validate the generated QR code
    if (!qrCodeDataURL.startsWith('data:image/png;base64,')) {
      throw new Error('Invalid QR code format generated');
    }

    // Verify base64 data exists and is not empty
    const base64Part = qrCodeDataURL.split(',')[1];
    if (!base64Part || base64Part.length < 100) {
      throw new Error('QR code base64 data is too short or missing');
    }

    console.log('✓ Enhanced QR Code generated successfully for:', participantId);
    console.log('  URL:', checkInUrl);
    console.log('  Style: Rounded corners, gradient (Gold→Orange→Pink→Purple)');
    console.log('  Data length:', base64Part.length, 'chars');
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code for', participantId, ':', error);
    
    // Fallback: try generating basic QR without gradient
    try {
      const checkInUrl = `https://checkin.hackoverflow4.tech/checkin/${participantId}`;
      const basicQR = await QRCode.toDataURL(checkInUrl, {
        width: 512,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      console.log('⚠️ Fallback: Using basic QR code');
      return basicQR;
    } catch {
      // Ultimate fallback - a tiny valid PNG (2x2 black square)
      const fallbackPNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mNk+M9QzwAEjAwAATsA8VLxKQsAAAAASUVORK5CYII=';
      return fallbackPNG;
    }
  }
}

/**
 * Alternative: Generate QR with dot pattern instead of squares
 */
export async function generateDotQRCode(participantId: string): Promise<string> {
  try {
    if (!participantId || participantId.trim() === '') {
      throw new Error('Invalid participant ID');
    }

    const checkInUrl = `https://checkin.hackoverflow4.tech/checkin/${participantId}`;
    const qrCodeArray = await QRCode.create(checkInUrl, {
      errorCorrectionLevel: 'H',
    });

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.clearRect(0, 0, size, size);

    const margin = 2;
    const moduleCount = qrCodeArray.modules.size;
    const moduleSize = size / (moduleCount + margin * 2);
    const offset = moduleSize * margin;
    const dotRadius = moduleSize * 0.45; // Dots slightly smaller than modules

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    BRAND_GRADIENT_COLORS.forEach(({ stop, color }) => {
      gradient.addColorStop(stop, color);
    });

    ctx.fillStyle = gradient;

    // Center logo area
    const centerX = moduleCount / 2;
    const centerY = moduleCount / 2;
    const logoRadius = moduleCount * 0.15;

    // Draw dots instead of squares
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qrCodeArray.modules.get(row, col)) {
          const dx = col - centerX;
          const dy = row - centerY;
          const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
          
          if (distanceFromCenter < logoRadius) {
            continue;
          }

          const x = offset + col * moduleSize + moduleSize / 2;
          const y = offset + row * moduleSize + moduleSize / 2;

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Add center logo
    const logoX = offset + centerX * moduleSize;
    const logoY = offset + centerY * moduleSize;
    const logoSize = logoRadius * moduleSize;

    const logoGradient = ctx.createRadialGradient(logoX, logoY, 0, logoX, logoY, logoSize);
    logoGradient.addColorStop(0, '#FFFFFF');
    logoGradient.addColorStop(1, '#F5F5F5');

    ctx.fillStyle = logoGradient;
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = gradient;
    ctx.font = `bold ${logoSize * 0.8}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H4', logoX, logoY);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating dot QR code:', error);
    return generateQRCode(participantId); // Fallback to standard
  }
}

/**
 * Test function to verify QR code generation
 */
export async function testQRGeneration(participantId: string = 'TEST123'): Promise<void> {
  console.log('🧪 Testing enhanced QR code generation...');
  
  // Test standard rounded version
  const qrCode = await generateQRCode(participantId);
  console.log('Generated rounded QR code:', qrCode.substring(0, 100) + '...');
  
  const img = new Image();
  img.onload = () => {
    console.log('✓ Rounded QR code loaded successfully');
    console.log('  Dimensions:', img.width, 'x', img.height);
  };
  img.onerror = (err) => console.error('✗ QR code failed to load:', err);
  img.src = qrCode;

  // Test dot version
  const dotQR = await generateDotQRCode(participantId);
  console.log('\n🧪 Testing dot-style QR code...');
  
  const img2 = new Image();
  img2.onload = () => {
    console.log('✓ Dot QR code loaded successfully');
  };
  img2.src = dotQR;
}