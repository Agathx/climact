// Criar ícones placeholder para PWA
// Este seria executado em ambiente com Canvas/Node.js

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG base para conversão
const svgTemplate = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.125}" fill="#22c55e"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.3125}" fill="white" fill-opacity="0.2"/>
  <g transform="translate(${size * 0.25}, ${size * 0.25})">
    <path d="M${size * 0.25} 0c-${size * 0.132} 0-${size * 0.24} ${size * 0.107}-${size * 0.24} ${size * 0.24}s${size * 0.107} ${size * 0.24} ${size * 0.24} ${size * 0.24} ${size * 0.24}-${size * 0.107} ${size * 0.24}-${size * 0.24}-${size * 0.107}-${size * 0.24}-${size * 0.24}-${size * 0.24}z" fill="white"/>
    <circle cx="${size * 0.25}" cy="${size * 0.25}" r="${size * 0.146}" fill="white"/>
    <rect x="${size * 0.156}" y="${size * 0.208}" width="${size * 0.188}" height="${size * 0.021}" fill="#22c55e"/>
    <rect x="${size * 0.156}" y="${size * 0.25}" width="${size * 0.188}" height="${size * 0.021}" fill="#22c55e"/>
    <rect x="${size * 0.156}" y="${size * 0.292}" width="${size * 0.104}" height="${size * 0.021}" fill="#22c55e"/>
  </g>
</svg>`;

console.log('SVG templates for PWA icons generated');
console.log('Sizes:', iconSizes);

// Para usar em produção, converter SVG para PNG com sharp/canvas
