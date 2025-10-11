/**
 * Logo do Autazul - Coração Puzzle
 * 
 * Este arquivo centraliza o gerenciamento da logo do sistema.
 * A logo é um coração formado por peças de quebra-cabeça coloridas,
 * simbolizando a conscientização sobre o autismo.
 */

// Importar logo da pasta assets (funciona em dev e produção)
// Para usar: salve a imagem da logo como /assets/logo.png
let logoUrl: string;

try {
  // Tenta importar do Figma (desenvolvimento)
  logoUrl = require('figma:asset/4808b01f93843e68942dc5705a8c21d55435df1b.png');
} catch {
  // Fallback: SVG inline do coração puzzle
  logoUrl = 'data:image/svg+xml;base64,' + btoa(`
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Coração base -->
  <path d="M100 170 C100 170, 40 130, 40 90 C40 60, 60 40, 85 40 C95 40, 100 50, 100 50 C100 50, 105 40, 115 40 C140 40, 160 60, 160 90 C160 130, 100 170, 100 170 Z" fill="#FFD700"/>
  
  <!-- Peça puzzle amarela (topo esquerdo) -->
  <path d="M60 60 L80 60 L80 50 L90 50 L90 70 L80 70 L80 80 L60 80 Z" fill="#FFD700"/>
  
  <!-- Peça puzzle verde (topo direito) -->
  <path d="M110 50 L130 50 L130 70 L140 70 L140 80 L120 80 L120 60 L110 60 Z" fill="#22C55E"/>
  
  <!-- Peça puzzle azul (meio esquerda) -->
  <path d="M50 90 L70 90 L70 80 L80 80 L80 100 L70 100 L70 110 L50 110 Z" fill="#3B82F6"/>
  
  <!-- Peça puzzle vermelha (meio direita) -->
  <path d="M130 90 L150 90 L150 110 L140 110 L140 120 L120 120 L120 100 L130 100 Z" fill="#EF4444"/>
  
  <!-- Sombra suave -->
  <ellipse cx="100" cy="180" rx="60" ry="10" fill="black" opacity="0.1"/>
</svg>
`);
}

export const autazulLogo = logoUrl;

// Background para tela de login
export const loginBackground = 'data:image/svg+xml;base64,' + btoa(`
<svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradiente suave -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F0F9FF;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#E0F2FE;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#BAE6FD;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  
  <!-- Formas suaves de puzzle em background -->
  <g opacity="0.05">
    <path d="M200 200 L300 200 L300 190 L310 190 L310 210 L300 210 L300 300 L200 300 Z" fill="#3B82F6"/>
    <path d="M1600 150 L1700 150 L1700 140 L1710 140 L1710 160 L1700 160 L1700 250 L1600 250 Z" fill="#22C55E"/>
    <path d="M300 800 L400 800 L400 790 L410 790 L410 810 L400 810 L400 900 L300 900 Z" fill="#EF4444"/>
    <path d="M1500 700 L1600 700 L1600 690 L1610 690 L1610 710 L1600 710 L1600 800 L1500 800 Z" fill="#FFD700"/>
  </g>
</svg>
`);
