import React, { useState, useRef } from 'react';

// ── Zone positions on the 760×500 map ─────────────────────────────────────────
const ZONE_META = {
  'bamboo-thicket':            { x: 218, y: 428, lp: 'below' },
  'jade-river-delta':          { x: 420, y: 444, lp: 'below' },
  'crimson-petal-grove':       { x: 124, y: 338, lp: 'left'  },
  'iron-gate-pass':            { x: 302, y: 316, lp: 'right' },
  'ascending-mist-temple':     { x: 498, y: 304, lp: 'right' },
  'sunken-lotus-marshes':      { x: 160, y: 230, lp: 'left'  },
  'shattered-sky-ridge':       { x: 330, y: 190, lp: 'right' },
  'desert-of-forgotten-kings': { x: 518, y: 174, lp: 'right' },
  'sea-of-swaying-bamboo':     { x: 238, y: 145, lp: 'left'  },
  'frost-peak-hermitage':      { x: 374, y: 105, lp: 'below' },
  'celestial-dragon-spire':    { x: 476, y: 86,  lp: 'right' },
  'palace-of-jade-emperor':    { x: 354, y: 55,  lp: 'above' },
};

// Progression routes drawn as dashed lines on the map
const CONNECTIONS = [
  ['bamboo-thicket',        'jade-river-delta'],
  ['bamboo-thicket',        'crimson-petal-grove'],
  ['bamboo-thicket',        'iron-gate-pass'],
  ['jade-river-delta',      'ascending-mist-temple'],
  ['crimson-petal-grove',   'iron-gate-pass'],
  ['crimson-petal-grove',   'sunken-lotus-marshes'],
  ['iron-gate-pass',        'ascending-mist-temple'],
  ['iron-gate-pass',        'shattered-sky-ridge'],
  ['ascending-mist-temple', 'desert-of-forgotten-kings'],
  ['sunken-lotus-marshes',  'shattered-sky-ridge'],
  ['sunken-lotus-marshes',  'sea-of-swaying-bamboo'],
  ['shattered-sky-ridge',   'desert-of-forgotten-kings'],
  ['shattered-sky-ridge',   'sea-of-swaying-bamboo'],
  ['shattered-sky-ridge',   'frost-peak-hermitage'],
  ['desert-of-forgotten-kings', 'celestial-dragon-spire'],
  ['sea-of-swaying-bamboo', 'frost-peak-hermitage'],
  ['frost-peak-hermitage',  'celestial-dragon-spire'],
  ['frost-peak-hermitage',  'palace-of-jade-emperor'],
  ['celestial-dragon-spire','palace-of-jade-emperor'],
];

function zoneColor(zone) {
  const m = (zone.minLevel + zone.maxLevel) / 2;
  if (m <= 15) return '#2F8070';   // teal-jade
  if (m <= 36) return '#4A8A40';   // forest
  if (m <= 59) return '#9A7820';   // earthy gold
  if (m <= 79) return '#C09040';   // bright gold
  if (m <= 93) return '#B05530';   // burnt orange
  return '#B33A3A';                // crimson
}

// ── Terrain helpers ───────────────────────────────────────────────────────────

function Mtn({ x, y, h = 18, w = 12, snow = false }) {
  const snowFrac = 0.35;
  const sw = w * snowFrac, sh = h * snowFrac;
  return (
    <g>
      <polygon points={`${x},${y - h} ${x - w / 2},${y} ${x + w / 2},${y}`}
               fill="#9A8A72" stroke="#6A5840" strokeWidth="0.7" />
      {snow && (
        <polygon points={`${x},${y - h} ${x - sw / 2},${y - h + sh} ${x + sw / 2},${y - h + sh}`}
                 fill="#E4DDD0" opacity="0.9" />
      )}
    </g>
  );
}

function Grove({ x, y, count = 4, col = '#3D6B3A' }) {
  const pts = [[0,0],[-8,5],[7,4],[-2,9],[8,9],[-9,2],[9,2],[-5,-3],[6,-4]].slice(0, count);
  return (
    <g opacity="0.72">
      {pts.map(([dx, dy], i) => <circle key={i} cx={x+dx} cy={y+dy} r={4.8} fill={col} />)}
    </g>
  );
}

// ── Zone node ─────────────────────────────────────────────────────────────────

function ZoneNode({ zone, meta, isSelected, isLocked, isFighting, onSelect, onHover, onLeave }) {
  const { x, y } = meta;
  const col = isLocked ? '#706858' : zoneColor(zone);
  const opacity = isLocked ? 0.38 : 1;

  return (
    <g transform={`translate(${x},${y})`}
       style={{ cursor: isLocked ? 'not-allowed' : 'pointer', opacity }}
       onClick={() => !isLocked && onSelect(zone.id)}
       onMouseEnter={e => onHover(e, zone)}
       onMouseMove={e  => onHover(e, zone)}
       onMouseLeave={onLeave}>

      {/* Outer glow for selected */}
      {isSelected && (
        <circle cx={0} cy={0} r={17} fill="none"
                stroke="var(--gold)" strokeWidth="2" opacity="0.9"
                className="zn-selected-ring" />
      )}

      {/* Expanding pulse for fighting zone */}
      {isFighting && (
        <circle cx={0} cy={0} r={14} fill="none"
                stroke={col} strokeWidth="2"
                className="zn-fight-pulse" />
      )}

      {/* Shadow */}
      <circle cx={1} cy={2} r={10} fill="rgba(0,0,0,0.35)" />

      {/* Main body */}
      <circle cx={0} cy={0} r={10} fill={col} stroke="#1C150A" strokeWidth="1.8" />

      {/* Inner highlight */}
      <circle cx={-3} cy={-3} r={3.5} fill="rgba(255,255,255,0.18)" />

      {/* Active-players dot (jade, top-right) */}
      {zone.activeCount > 0 && (
        <circle cx={8} cy={-8} r={4.5} fill="var(--jade)" stroke="#1C150A" strokeWidth="1.2" />
      )}

      {/* Kill-bonus dot (gold, top-left) */}
      {(zone.playerStats?.bonusPercent ?? 0) > 0 && (
        <circle cx={-8} cy={-8} r={4.5} fill="var(--gold)" stroke="#1C150A" strokeWidth="1.2" />
      )}
    </g>
  );
}

// ── Zone label ────────────────────────────────────────────────────────────────

function ZoneLabel({ zone, meta, isSelected }) {
  const { x, y, lp } = meta;
  const words = zone.name.split(' ');
  const half  = Math.ceil(words.length / 2);
  const l1    = words.slice(0, half).join(' ');
  const l2    = words.length > 2 ? words.slice(half).join(' ') : '';

  let tx = x, ty = y, anchor = 'middle';
  if (lp === 'below') { ty = y + 24; }
  else if (lp === 'above') { ty = y - 20; }
  else if (lp === 'left')  { tx = x - 15; ty = y + 4; anchor = 'end'; }
  else if (lp === 'right') { tx = x + 15; ty = y + 4; anchor = 'start'; }

  const fill = isSelected ? '#C6A85C' : '#DDD0A8';

  return (
    <text x={tx} y={ty} textAnchor={anchor}
          fontSize="8.5" fontFamily="Cinzel, serif"
          fontWeight={isSelected ? '600' : '400'} fill={fill}
          style={{ paintOrder: 'stroke', stroke: 'rgba(12,8,4,0.92)', strokeWidth: '3.5px', userSelect: 'none' }}>
      <tspan x={tx} dy="0">{l1}</tspan>
      {l2 && <tspan x={tx} dy="11">{l2}</tspan>}
    </text>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function MapTooltip({ zone, pos, playerLevel }) {
  const locked  = playerLevel < zone.minLevel;
  const bonus   = zone.playerStats?.bonusPercent ?? 0;
  const kills   = zone.playerStats?.kills ?? 0;
  const col     = zoneColor(zone);
  return (
    <div className="map-tooltip" style={{ left: pos.x, top: pos.y }}>
      <div className="map-tt-name" style={{ color: col }}>{zone.name}</div>
      <div className="map-tt-level">Lv {zone.minLevel} – {zone.maxLevel}</div>
      {locked
        ? <div className="map-tt-locked">Requires Level {zone.minLevel}</div>
        : (
          <div className="map-tt-row">
            {zone.activeCount > 0 && <span className="map-tt-active">{zone.activeCount} present</span>}
            {bonus > 0 && <span className="map-tt-bonus">+{bonus}% drop</span>}
            {kills > 0 && <span className="map-tt-kills">{kills.toLocaleString()} kills</span>}
          </div>
        )
      }
      <div className="map-tt-tags">{zone.tags?.join(' · ')}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const CONTINENT =
  'M 100,490 C 70,472 54,438 58,400 C 62,362 72,322 66,280 ' +
  'C 60,236 72,196 93,165 C 113,140 132,120 158,103 ' +
  'C 190,84 230,70 274,61 C 312,53 352,49 374,51 ' +
  'C 400,53 432,60 466,71 C 507,84 542,106 566,132 ' +
  'C 594,162 609,194 616,228 C 623,264 620,300 612,334 ' +
  'C 604,368 588,398 563,424 C 538,450 506,466 472,476 ' +
  'C 436,486 398,490 360,490 C 322,490 282,488 244,485 ' +
  'C 204,482 162,484 128,478 C 112,475 104,490 100,490 Z';

export default function WorldMap({ zones, selectedId, onSelect, playerLevel, fighting }) {
  const [hoveredZone, setHoveredZone] = useState(null);
  const [tooltipPos,  setTooltipPos]  = useState({ x: 0, y: 0 });
  const wrapRef = useRef(null);

  function handleHover(e, zone) {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - r.left + 16, y: e.clientY - r.top - 58 });
    setHoveredZone(zone);
  }

  return (
    <div className="world-map-wrap" ref={wrapRef}>
      <svg viewBox="0 0 760 500" className="world-map-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="wm-water" cx="50%" cy="50%" r="70%">
            <stop offset="0%"   stopColor="#1C3D55" />
            <stop offset="100%" stopColor="#0E2236" />
          </radialGradient>
          <radialGradient id="wm-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="55%"  stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.42)" />
          </radialGradient>
          <filter id="wm-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Water ── */}
        <rect width="760" height="500" fill="url(#wm-water)" />
        {/* Wave texture */}
        {[45, 88, 138, 188, 458, 485, 510].map((y, i) => (
          <path key={i} d={`M 10,${y} Q 380,${y + 7} 750,${y}`}
                stroke="rgba(100,155,195,0.1)" strokeWidth="1" fill="none" />
        ))}
        {/* Small island (east) */}
        <path d="M 658,385 C 644,372 638,352 642,338 C 646,323 660,315 672,320 C 684,325 690,340 688,356 C 686,372 672,385 658,385 Z"
              fill="#BBAA80" stroke="#907850" strokeWidth="0.7" opacity="0.85" />

        {/* ── Continent ── */}
        <path d={CONTINENT} fill="#C8BA8C" stroke="#9A7E50" strokeWidth="0.9" />
        {/* Vignette */}
        <path d={CONTINENT} fill="url(#wm-vignette)" />

        {/* ── Regional color overlays ── */}
        {/* Bamboo south – warm green tint */}
        <ellipse cx="230" cy="440" rx="80" ry="38" fill="#4A7A30" opacity="0.12" />
        {/* Desert northeast – sandy */}
        <ellipse cx="524" cy="178" rx="62" ry="45" fill="#C8A040" opacity="0.22" />
        {/* Swamp northwest */}
        <ellipse cx="162" cy="234" rx="42" ry="32" fill="#3A6040" opacity="0.20" />
        {/* Ice/frost north */}
        <ellipse cx="385" cy="100" rx="90" ry="40" fill="#B0C8D8" opacity="0.18" />
        {/* Celestial peak glow */}
        <ellipse cx="420" cy="75" rx="70" ry="28" fill="#C6A85C" opacity="0.08" />

        {/* ── Terrain decorations ── */}

        {/* River — Jade River, flowing south */}
        <path d="M 334,154 Q 338,210 332,262 Q 326,314 338,366 Q 348,406 356,450"
              stroke="#4A82A0" strokeWidth="2.5" fill="none" opacity="0.38" />

        {/* Marsh dots (Sunken Lotus) */}
        {[0,1,2,3,4,5].map(i => (
          <circle key={i} cx={146 + i * 7} cy={224 + (i % 2) * 9} r={2.8}
                  fill="#2A5840" opacity="0.45" />
        ))}

        {/* Forests */}
        <Grove x={205} y={416} count={6} col="#3D6B3A" />
        <Grove x={224} y={432} count={4} col="#3A6838" />
        <Grove x={116} y={328} count={5} col="#5A4040" />   {/* Crimson grove — reddish */}
        <Grove x={130} y={345} count={3} col="#6A3838" />
        <Grove x={226} y={133} count={7} col="#3A6535" />   {/* Sea of Bamboo */}
        <Grove x={244} y={150} count={4} col="#376030" />
        <Grove x={150} y={220} count={4} col="#2A5535" />   {/* Swamp */}

        {/* Mountains – Iron Gate Pass */}
        <Mtn x={286} y={308} h={15} w={11} />
        <Mtn x={300} y={302} h={20} w={13} />
        <Mtn x={315} y={310} h={14} w={10} />

        {/* Mountains – Shattered Sky Ridge */}
        <Mtn x={316} y={182} h={22} w={14} snow />
        <Mtn x={332} y={174} h={28} w={16} snow />
        <Mtn x={346} y={180} h={22} w={14} snow />
        <Mtn x={324} y={177} h={20} w={13} snow />

        {/* Mountains – Frost Peak Hermitage */}
        <Mtn x={356} y={97}  h={26} w={16} snow />
        <Mtn x={372} y={89}  h={32} w={18} snow />
        <Mtn x={388} y={94}  h={28} w={17} snow />
        <Mtn x={364} y={86}  h={30} w={17} snow />
        <Mtn x={382} y={82}  h={34} w={19} snow />

        {/* Mountains – Celestial Dragon Spire (very tall, narrow) */}
        <Mtn x={465} y={78}  h={36} w={9}  snow />
        <Mtn x={478} y={70}  h={44} w={10} snow />
        <Mtn x={492} y={76}  h={38} w={9}  snow />

        {/* Western hills */}
        <Mtn x={96}  y={296} h={14} w={10} />
        <Mtn x={110} y={290} h={18} w={12} />

        {/* ── Zone connections ── */}
        {CONNECTIONS.map(([a, b]) => {
          const ma = ZONE_META[a], mb = ZONE_META[b];
          if (!ma || !mb) return null;
          return (
            <line key={`${a}--${b}`}
                  x1={ma.x} y1={ma.y} x2={mb.x} y2={mb.y}
                  stroke="rgba(190,160,80,0.22)" strokeWidth="1.4" strokeDasharray="5,5" />
          );
        })}

        {/* ── Labels (rendered before nodes so nodes sit on top) ── */}
        {zones.map(zone => {
          const meta = ZONE_META[zone.id];
          if (!meta) return null;
          return <ZoneLabel key={zone.id} zone={zone} meta={meta} isSelected={zone.id === selectedId} />;
        })}

        {/* ── Zone nodes ── */}
        {zones.map(zone => {
          const meta = ZONE_META[zone.id];
          if (!meta) return null;
          return (
            <ZoneNode key={zone.id} zone={zone} meta={meta}
                      isSelected={zone.id === selectedId}
                      isLocked={playerLevel < zone.minLevel}
                      isFighting={zone.id === selectedId && fighting}
                      onSelect={onSelect}
                      onHover={handleHover}
                      onLeave={() => setHoveredZone(null)} />
          );
        })}

        {/* ── Map title ── */}
        <text x="382" y="484" textAnchor="middle"
              fontSize="10" fontFamily="Cinzel, serif" fontWeight="600"
              fill="rgba(110,88,44,0.55)"
              style={{ paintOrder: 'stroke', stroke: 'rgba(190,170,110,0.25)', strokeWidth: '2px', userSelect: 'none' }}>
          TIANXIA  ·  天下
        </text>
      </svg>

      {/* Tooltip */}
      {hoveredZone && (
        <MapTooltip zone={hoveredZone} pos={tooltipPos} playerLevel={playerLevel} />
      )}
    </div>
  );
}
