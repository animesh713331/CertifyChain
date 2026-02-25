export const generateCertificateSVG = ({ name, course, date, issuer, id }) => {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
            </linearGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            </pattern>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#grad1)" />
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <!-- Border -->
        <rect x="20" y="20" width="760" height="560" rx="15" ry="15" fill="none" stroke="#4cc9f0" stroke-width="2" stroke-dasharray="10 5" />
        
        <!-- Header -->
        <text x="400" y="100" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#4cc9f0" text-anchor="middle" letter-spacing="2">CERTIFICATE OF COMPLETION</text>
        
        <!-- Icon/Logo Placeholder -->
        <circle cx="400" cy="180" r="40" fill="rgba(76, 201, 240, 0.1)" stroke="#4cc9f0" stroke-width="2" />
        <text x="400" y="190" font-family="Arial, sans-serif" font-size="30" fill="#4cc9f0" text-anchor="middle">🎓</text>

        <!-- Content -->
        <text x="400" y="260" font-family="Arial, sans-serif" font-size="18" fill="#a0a0a0" text-anchor="middle">This certifies that</text>
        
        <text x="400" y="310" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle">${name}</text>
        
        <text x="400" y="360" font-family="Arial, sans-serif" font-size="18" fill="#a0a0a0" text-anchor="middle">has successfully completed the course</text>
        
        <text x="400" y="410" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#4cc9f0" text-anchor="middle">${course}</text>
        
        <!-- Footer Info -->
        <line x1="200" y1="480" x2="600" y2="480" stroke="#4cc9f0" stroke-width="1" stroke-opacity="0.3" />
        
        <text x="250" y="520" font-family="Arial, sans-serif" font-size="16" fill="#a0a0a0" text-anchor="middle">Date Issued</text>
        <text x="250" y="545" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" text-anchor="middle">${date}</text>
        
        <text x="550" y="520" font-family="Arial, sans-serif" font-size="16" fill="#a0a0a0" text-anchor="middle">Issuer</text>
        <text x="550" y="545" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" text-anchor="middle">${issuer}</text>
        
        <text x="400" y="580" font-family="monospace" font-size="12" fill="#505050" text-anchor="middle">ID: ${id}</text>
    </svg>
    `;
};

// Unicode-safe Base64 encoder
const encodeBase64 = (str) => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
};

export const generateTokenURI = ({ name, course, date, issuer, id }) => {
    const svg = generateCertificateSVG({ name, course, date, issuer, id });
    const svgBase64 = encodeBase64(svg);
    const imageURI = `data:image/svg+xml;base64,${svgBase64}`;

    const metadata = {
        name: `Certificate: ${course}`,
        description: `Certificate awarded to ${name} for completing ${course}.`,
        image: imageURI,
        attributes: [
            { trait_type: "Student Name", value: name },
            { trait_type: "Course", value: course },
            { trait_type: "Date", value: date },
            { trait_type: "Issuer", value: issuer },
            { trait_type: "ID", value: id }
        ]
    };

    const metadataBase64 = encodeBase64(JSON.stringify(metadata));
    return `data:application/json;base64,${metadataBase64}`;
};
