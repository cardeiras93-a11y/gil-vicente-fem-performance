import React from 'react';

interface ExerciseIllustrationProps {
  drawingKey: string;
  className?: string;
}

export const ExerciseIllustration: React.FC<ExerciseIllustrationProps> = ({
  drawingKey,
  className = 'w-full h-24 sm:h-28',
}) => {
  // Colors used for Gil Vicente aesthetic & clarity
  const athleteShirt = '#0284c7'; // Vibrant athletic blue
  const athleteShorts = '#0f172a'; // Navy/dark slate
  const athleteSkin = '#f6ad55'; // Athlete warm skin tone
  const athleteHair = '#1e293b';
  const bandColor = '#ea580c'; // Vibrant orange tension band
  const floorColor = '#334155'; // Subtle gym floor line
  const accentCyan = '#06b6d4'; // Motion / direction accents

  switch (drawingKey) {
    case 'rotation-band-reach':
      // 1.1 Rotação Torácica & Alcance Superior c/ Banda (Half-kneeling with band & reach to ceiling)
      return (
        <svg viewBox="0 0 240 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground & Anchor post */}
          <line x1="20" y1="108" x2="220" y2="108" stroke={floorColor} strokeWidth="2.5" strokeLinecap="round" />
          <rect x="24" y="25" width="4" height="83" rx="2" fill="#64748b" />
          <circle cx="26" cy="62" r="3" fill="#cbd5e1" />

          {/* Anchor band to athlete hand */}
          <path d="M26 62 Q75 66 112 70" stroke={bandColor} strokeWidth="3" strokeLinecap="round" />

          {/* Athlete Kneeling Body */}
          {/* Back kneeling leg (left knee on ground) */}
          <path d="M100 82 L90 108 L72 108" stroke={athleteShorts} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="72" cy="108" r="4" fill="#0284c7" />

          {/* Front lunging leg (right foot flat) */}
          <path d="M116 82 L132 94 L132 108" stroke={athleteShorts} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="135" cy="108" rx="6" ry="3" fill="#0284c7" />

          {/* Pelvis & Torso rotated */}
          <ellipse cx="108" cy="80" rx="9" ry="7" fill={athleteShorts} />
          <path d="M105 78 L114 52" stroke={athleteShirt} strokeWidth="12" strokeLinecap="round" />

          {/* Head */}
          <circle cx="119" cy="40" r="7" fill={athleteSkin} />
          <path d="M115 36 Q119 32 124 37" stroke={athleteHair} strokeWidth="3" strokeLinecap="round" />

          {/* Left hand holding band */}
          <path d="M110 56 L112 70" stroke={athleteSkin} strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="112" cy="70" r="3" fill="#ea580c" />

          {/* Right arm reaching high to ceiling */}
          <path d="M117 50 L142 28" stroke={athleteSkin} strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="142" cy="28" r="3" fill={athleteSkin} />

          {/* Upward motion arrow */}
          <path d="M148 24 L158 14 M158 14 L151 13 M158 14 L157 21" stroke={accentCyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Badge indicator text */}
          <rect x="156" y="86" width="62" height="18" rx="4" fill="#0369a1" fillOpacity="0.2" stroke="#0284c7" strokeWidth="1" />
          <text x="187" y="98" fill="#38bdf8" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.5">ROTAÇÃO</text>
        </svg>
      );

    case 'shoulder-dislocates-band':
      // 1.2 Passagens de Ombros e Peitoral c/ Banda (Standing wide band pass-through)
      return (
        <svg viewBox="0 0 240 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground */}
          <line x1="40" y1="108" x2="200" y2="108" stroke={floorColor} strokeWidth="2.5" strokeLinecap="round" />

          {/* Athlete Standing */}
          {/* Legs */}
          <path d="M112 80 L108 108" stroke={athleteShorts} strokeWidth="6" strokeLinecap="round" />
          <path d="M128 80 L132 108" stroke={athleteShorts} strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="106" cy="108" rx="5" ry="2.5" fill="#0284c7" />
          <ellipse cx="134" cy="108" rx="5" ry="2.5" fill="#0284c7" />

          {/* Torso */}
          <ellipse cx="120" cy="78" rx="10" ry="6" fill={athleteShorts} />
          <rect x="112" y="48" width="16" height="28" rx="5" fill={athleteShirt} />

          {/* Head */}
          <circle cx="120" cy="38" r="7.5" fill={athleteSkin} />
          <path d="M115 34 Q120 30 125 34" stroke={athleteHair} strokeWidth="3" strokeLinecap="round" />

          {/* Wide Grip Arms holding Band Overhead */}
          <path d="M114 50 L88 34" stroke={athleteSkin} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M126 50 L152 34" stroke={athleteSkin} strokeWidth="4.5" strokeLinecap="round" />

          {/* Band stretched between hands */}
          <path d="M88 34 L152 34" stroke={bandColor} strokeWidth="3" strokeLinecap="round" />
          <circle cx="88" cy="34" r="3" fill="#ea580c" />
          <circle cx="152" cy="34" r="3" fill="#ea580c" />

          {/* Circular fluid pass arrow */}
          <path d="M82 46 C70 20, 170 20, 158 46" stroke={accentCyan} strokeWidth="1.8" strokeDasharray="3 3" strokeLinecap="round" />
          <path d="M158 46 L163 40 M158 46 L154 39" stroke={accentCyan} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

          <rect x="156" y="86" width="62" height="18" rx="4" fill="#0369a1" fillOpacity="0.2" stroke="#0284c7" strokeWidth="1" />
          <text x="187" y="98" fill="#38bdf8" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.5">DISLOCATES</text>
        </svg>
      );

    case 'cossack-squat-band':
      // 2.1 Agachamento Cossack c/ Banda (Deep lateral squat with support band)
      return (
        <svg viewBox="0 0 240 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground & Anchor post */}
          <line x1="20" y1="108" x2="220" y2="108" stroke={floorColor} strokeWidth="2.5" strokeLinecap="round" />
          <rect x="24" y="45" width="4" height="63" rx="2" fill="#64748b" />
          <circle cx="26" cy="72" r="3" fill="#cbd5e1" />

          {/* Support band */}
          <path d="M26 72 Q65 74 95 76" stroke={bandColor} strokeWidth="3" strokeLinecap="round" />

          {/* Bent deep squat leg (left) */}
          <path d="M96 90 L85 106" stroke={athleteShorts} strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="84" cy="106" rx="5" ry="3" fill="#0284c7" />

          {/* Straight extended leg (right) with toes pointed UP */}
          <path d="M102 90 L168 106" stroke={athleteShorts} strokeWidth="6" strokeLinecap="round" />
          <path d="M168 106 L175 98" stroke={athleteSkin} strokeWidth="4" strokeLinecap="round" />
          <circle cx="175" cy="98" r="3" fill="#0284c7" />

          {/* Torso & Head */}
          <ellipse cx="98" cy="88" rx="10" ry="7" fill={athleteShorts} />
          <path d="M98 84 L102 62" stroke={athleteShirt} strokeWidth="11" strokeLinecap="round" />
          <circle cx="104" cy="52" r="6.5" fill={athleteSkin} />
          <path d="M100 48 Q105 45 109 49" stroke={athleteHair} strokeWidth="2.5" strokeLinecap="round" />

          {/* Hands holding support band */}
          <path d="M100 66 L95 76" stroke={athleteSkin} strokeWidth="4" strokeLinecap="round" />
          <circle cx="95" cy="76" r="3" fill="#ea580c" />

          <rect x="156" y="86" width="62" height="18" rx="4" fill="#0369a1" fillOpacity="0.2" stroke="#0284c7" strokeWidth="1" />
          <text x="187" y="98" fill="#38bdf8" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.5">COSSACK</text>
        </svg>
      );

    case 'hip-90-90-reach':
      // 2.2 Transições 90/90 de Anca c/ Alcance Dinâmico (90/90 Hip sit with reach)
      return (
        <svg viewBox="0 0 240 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Mat/Ground line */}
          <rect x="40" y="104" width="160" height="4" rx="2" fill="#0284c7" fillOpacity="0.4" />

          {/* Legs in 90/90 formation */}
          {/* Front leg at 90 deg */}
          <path d="M90 98 L114 98 L114 105" stroke={athleteShorts} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          {/* Back leg at 90 deg */}
          <path d="M80 98 L60 98 L60 104" stroke={athleteShorts} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />

          {/* Torso leaning forward into reach */}
          <path d="M86 94 L110 82" stroke={athleteShirt} strokeWidth="12" strokeLinecap="round" />
          <circle cx="116" cy="76" r="7" fill={athleteSkin} />
          <path d="M112 72 Q117 68 122 72" stroke={athleteHair} strokeWidth="2.5" strokeLinecap="round" />

          {/* Arms reaching forward with band */}
          <path d="M106 82 L142 84" stroke={athleteSkin} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M142 84 L160 84" stroke={bandColor} strokeWidth="3" strokeLinecap="round" />
          <circle cx="142" cy="84" r="3" fill="#ea580c" />
          <circle cx="160" cy="84" r="3" fill="#ea580c" />

          {/* Transition curved arrows */}
          <path d="M68 84 Q90 68 112 84" stroke={accentCyan} strokeWidth="1.8" strokeDasharray="2 2" strokeLinecap="round" />

          <rect x="156" y="86" width="62" height="18" rx="4" fill="#0369a1" fillOpacity="0.2" stroke="#0284c7" strokeWidth="1" />
          <text x="187" y="98" fill="#38bdf8" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.5">ANCA 90/90</text>
        </svg>
      );

    case 'ankle-dorsiflexion-band':
      // 3.1 Mobilização de Dorsiflexão do Tornozelo c/ Banda (Half-kneeling band around ankle)
      return (
        <svg viewBox="0 0 240 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground & Anchor post */}
          <line x1="20" y1="108" x2="220" y2="108" stroke={floorColor} strokeWidth="2.5" strokeLinecap="round" />
          <rect x="24" y="65" width="4" height="43" rx="2" fill="#64748b" />

          {/* Band pulling talus back to post */}
          <path d="M26 96 L140 102" stroke={bandColor} strokeWidth="3" strokeLinecap="round" />

          {/* Back knee resting on mat */}
          <path d="M85 85 L70 108 L55 108" stroke={athleteShorts} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="55" cy="108" r="3.5" fill="#0284c7" />

          {/* Front working leg driving knee OVER foot */}
          <path d="M102 85 L144 92 L144 108" stroke={athleteShorts} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="148" cy="108" rx="7" ry="3" fill="#0284c7" />

          {/* Torso upright resting hands on front knee */}
          <ellipse cx="94" cy="84" rx="9" ry="6" fill={athleteShorts} />
          <path d="M94 82 L98 56" stroke={athleteShirt} strokeWidth="11" strokeLinecap="round" />
          <circle cx="100" cy="45" r="6.5" fill={athleteSkin} />

          {/* Arms on forward knee */}
          <path d="M96 62 L128 88" stroke={athleteSkin} strokeWidth="4" strokeLinecap="round" />

          {/* Knee forward glide pulse arrow */}
          <path d="M142 86 L158 86 M158 86 L152 82 M158 86 L152 90" stroke={accentCyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          <rect x="156" y="86" width="62" height="18" rx="4" fill="#0369a1" fillOpacity="0.2" stroke="#0284c7" strokeWidth="1" />
          <text x="187" y="98" fill="#38bdf8" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.5">TORNOZELO</text>
        </svg>
      );

    case 'lateral-step-band':
      // 3.2 Passo Lateral em Base de Queda c/ Mini-Banda (Goalkeeper set position lateral steps)
      return (
        <svg viewBox="0 0 240 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground */}
          <line x1="50" y1="108" x2="190" y2="108" stroke={floorColor} strokeWidth="2.5" strokeLinecap="round" />

          {/* Athlete in GK Ready Stance (Athletic semi-squat) */}
          {/* Left leg */}
          <path d="M108 72 L96 88 L94 108" stroke={athleteShorts} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="92" cy="108" rx="6" ry="2.5" fill="#0284c7" />

          {/* Right leg stepping out */}
          <path d="M124 72 L138 88 L142 108" stroke={athleteShorts} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="144" cy="108" rx="6" ry="2.5" fill="#0284c7" />

          {/* Mini-band above knees */}
          <rect x="98" y="84" width="38" height="6" rx="2" fill={bandColor} stroke="#c2410c" strokeWidth="1" />

          {/* Torso & Head */}
          <ellipse cx="116" cy="70" rx="12" ry="7" fill={athleteShorts} />
          <path d="M116 68 L116 46" stroke={athleteShirt} strokeWidth="15" strokeLinecap="round" />
          <circle cx="116" cy="35" r="7.5" fill={athleteSkin} />
          <path d="M111 31 Q116 27 121 31" stroke={athleteHair} strokeWidth="3" strokeLinecap="round" />

          {/* Goalkeeper Ready Hands forward */}
          <path d="M108 50 L96 64" stroke={athleteSkin} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M124 50 L136 64" stroke={athleteSkin} strokeWidth="4.5" strokeLinecap="round" />

          {/* Lateral step arrows */}
          <path d="M146 104 L160 104 M160 104 L155 100 M160 104 L155 108" stroke={accentCyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M90 104 L76 104 M76 104 L81 100 M76 104 L81 108" stroke={accentCyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          <rect x="156" y="86" width="62" height="18" rx="4" fill="#0369a1" fillOpacity="0.2" stroke="#0284c7" strokeWidth="1" />
          <text x="187" y="98" fill="#38bdf8" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.5">BASE DE QUEDA</text>
        </svg>
      );

    case 'wall-wy-slides-band':
      // 4.1 Deslize de Braços em W-Y na Parede c/ Mini-Banda (Wall W-Y slide with mini band)
      return (
        <svg viewBox="0 0 240 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground & Wall line */}
          <line x1="30" y1="108" x2="210" y2="108" stroke={floorColor} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="160" y1="15" x2="160" y2="108" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="6 3" />

          {/* Athlete standing facing wall */}
          <path d="M110 80 L110 108" stroke={athleteShorts} strokeWidth="6.5" strokeLinecap="round" />
          <path d="M122 80 L124 108" stroke={athleteShorts} strokeWidth="6.5" strokeLinecap="round" />
          <ellipse cx="112" cy="108" rx="5" ry="2.5" fill="#0284c7" />
          <ellipse cx="126" cy="108" rx="5" ry="2.5" fill="#0284c7" />

          {/* Torso */}
          <ellipse cx="116" cy="78" rx="9" ry="6" fill={athleteShorts} />
          <rect x="110" y="48" width="14" height="28" rx="5" fill={athleteShirt} />
          <circle cx="117" cy="38" r="7" fill={athleteSkin} />

          {/* Forearms on wall sliding up with mini-band */}
          <path d="M116 52 L142 42 L160 30" stroke={athleteSkin} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="138" y="36" width="5" height="12" rx="2" fill={bandColor} stroke="#c2410c" strokeWidth="1" />

          {/* Upward slide arrows on wall */}
          <path d="M166 45 L166 22 M166 22 L162 27 M166 22 L170 27" stroke={accentCyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          <rect x="156" y="86" width="62" height="18" rx="4" fill="#0369a1" fillOpacity="0.2" stroke="#0284c7" strokeWidth="1" />
          <text x="187" y="98" fill="#38bdf8" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.5">W-Y NA PAREDE</text>
        </svg>
      );

    case 'bird-dog-cross-band':
      // 4.2 Pássaro-Cão Dinâmico c/ Banda Cruzada (Quadruped bird-dog with cross band)
      return (
        <svg viewBox="0 0 240 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground */}
          <line x1="20" y1="108" x2="220" y2="108" stroke={floorColor} strokeWidth="2.5" strokeLinecap="round" />

          {/* Grounded supporting knee (left) */}
          <path d="M110 82 L110 108 L98 108" stroke={athleteShorts} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="98" cy="108" r="3.5" fill="#0284c7" />

          {/* Grounded supporting arm (left hand) */}
          <path d="M136 78 L136 108" stroke={athleteSkin} strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="136" cy="108" r="3" fill="#0284c7" />

          {/* Horizontal Torso */}
          <path d="M106 78 L142 78" stroke={athleteShirt} strokeWidth="12" strokeLinecap="round" />
          <circle cx="148" cy="74" r="6.5" fill={athleteSkin} />

          {/* Extended right leg straight back */}
          <path d="M106 78 L54 78" stroke={athleteShorts} strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="50" cy="78" rx="5" ry="3" fill="#0284c7" />

          {/* Extended right arm straight forward */}
          <path d="M142 76 L186 76" stroke={athleteSkin} strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="186" cy="76" r="3" fill={athleteSkin} />

          {/* Cross band from hand to foot */}
          <line x1="52" y1="78" x2="186" y2="76" stroke={bandColor} strokeWidth="2" strokeDasharray="4 2" />

          {/* Extension dual arrows */}
          <path d="M44 78 L34 78 M34 78 L39 74 M34 78 L39 82" stroke={accentCyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M192 76 L202 76 M202 76 L197 72 M202 76 L197 80" stroke={accentCyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          <rect x="156" y="86" width="62" height="18" rx="4" fill="#0369a1" fillOpacity="0.2" stroke="#0284c7" strokeWidth="1" />
          <text x="187" y="98" fill="#38bdf8" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.5">BIRD-DOG</text>
        </svg>
      );

    default:
      return (
        <div className="flex h-24 sm:h-28 items-center justify-center rounded-xl bg-slate-900/60 border border-slate-800 text-slate-500 text-xs font-bold">
          <span>Exercício Dinâmico</span>
        </div>
      );
  }
};
