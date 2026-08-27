// garden.js — SVG 정원 렌더링 & 꾸미기 시스템

import { getState, placeGardenObject, getGardenStage } from './game-state.js';

// ─── 정원 아이템 카탈로그 ────────────────────────────────────

export const GARDEN_ITEMS = [
  // Stage 1 — 기본
  { id: 'flower_red',  emoji: '🌸', name: '붉은 꽃',    cost: 50,  stage: 1, category: 'plant',     size: 1 },
  { id: 'flower_yellow', emoji: '🌼', name: '노란 꽃',  cost: 50,  stage: 1, category: 'plant',     size: 1 },
  { id: 'seedling',   emoji: '🌱', name: '새싹',         cost: 30,  stage: 1, category: 'plant',     size: 1 },
  { id: 'mushroom',   emoji: '🍄', name: '버섯',         cost: 40,  stage: 1, category: 'deco',      size: 1 },
  { id: 'stone',      emoji: '🪨', name: '장식 돌',      cost: 20,  stage: 1, category: 'deco',      size: 1 },
  { id: 'butterfly',  emoji: '🦋', name: '나비 조각상',  cost: 80,  stage: 1, category: 'deco',      size: 1 },

  // Stage 2 — 꽃밭
  { id: 'tulip',      emoji: '🌷', name: '튤립',         cost: 100, stage: 2, category: 'plant',     size: 1 },
  { id: 'sunflower',  emoji: '🌻', name: '해바라기',     cost: 120, stage: 2, category: 'plant',     size: 1 },
  { id: 'rose',       emoji: '🌹', name: '장미',         cost: 150, stage: 2, category: 'plant',     size: 1 },
  { id: 'lantern',    emoji: '🏮', name: '등불',         cost: 80,  stage: 2, category: 'deco',      size: 1 },

  // Stage 3 — 연못
  { id: 'tree',       emoji: '🌳', name: '나무',         cost: 200, stage: 3, category: 'plant',     size: 2 },
  { id: 'pine',       emoji: '🌲', name: '소나무',       cost: 180, stage: 3, category: 'plant',     size: 2 },
  { id: 'lily',       emoji: '🪷', name: '연꽃',         cost: 160, stage: 3, category: 'plant',     size: 1 },
  { id: 'frog',       emoji: '🐸', name: '개구리 석상',  cost: 90,  stage: 3, category: 'deco',      size: 1 },

  // Stage 4 — 벤치
  { id: 'bench',      emoji: '🪑', name: '벤치',         cost: 250, stage: 4, category: 'furniture', size: 2 },
  { id: 'umbrella',   emoji: '☂️', name: '파라솔',       cost: 200, stage: 4, category: 'furniture', size: 1 },
  { id: 'basket',     emoji: '🧺', name: '꽃바구니',     cost: 150, stage: 4, category: 'deco',      size: 1 },

  // Stage 5 — 분수
  { id: 'fountain',   emoji: '⛲', name: '분수',          cost: 400, stage: 5, category: 'furniture', size: 2 },
  { id: 'pond',       emoji: '🫧', name: '작은 연못',    cost: 350, stage: 5, category: 'nature',    size: 2 },
  { id: 'swan',       emoji: '🦢', name: '백조 조각',    cost: 200, stage: 5, category: 'deco',      size: 1 },

  // Stage 6 — 정자
  { id: 'pagoda',     emoji: '🏯', name: '정자',          cost: 600, stage: 6, category: 'structure', size: 3 },
  { id: 'lantern2',   emoji: '🪔', name: '촛불 등',       cost: 150, stage: 6, category: 'deco',      size: 1 },
  { id: 'peach',      emoji: '🍑', name: '복숭아 나무',  cost: 300, stage: 6, category: 'plant',     size: 2 },

  // Stage 7 — 완성
  { id: 'shrine',     emoji: '⛩️', name: '신사 문',       cost: 800, stage: 7, category: 'structure', size: 3 },
  { id: 'dragon',     emoji: '🐉', name: '용 조각상',    cost: 1000,stage: 7, category: 'deco',      size: 2 },
  { id: 'rainbow',    emoji: '🌈', name: '무지개 아치',  cost: 500, stage: 7, category: 'deco',      size: 3 },
];

// ─── 정원 그리드 설정 ─────────────────────────────────────────

const GRID_COLS = 7;
const GRID_ROWS = 6;
const CELL_SIZE = 64;   // px
const PADDING = 16;

// 초기 황폐 오브젝트 (제거 불가)
const INITIAL_DEBRIS = [
  { id: 'debris_0', type: 'debris', emoji: '🌾', x: 1, y: 0, fixed: true },
  { id: 'debris_1', type: 'debris', emoji: '🪨', x: 3, y: 1, fixed: true },
  { id: 'debris_2', type: 'debris', emoji: '🌾', x: 5, y: 0, fixed: true },
  { id: 'debris_3', type: 'debris', emoji: '🪨', x: 0, y: 4, fixed: true },
  { id: 'debris_4', type: 'debris', emoji: '🌾', x: 6, y: 3, fixed: true },
  { id: 'debris_5', type: 'debris', emoji: '🏚️', x: 2, y: 3, fixed: true },
];

// ─── SVG 정원 렌더링 ─────────────────────────────────────────

/**
 * SVG 정원을 생성/업데이트
 * @param {HTMLElement} container - SVG가 들어갈 컨테이너
 * @param {Object} opts - { onCellClick, placingItem }
 */
export function renderGarden(container, opts = {}) {
  const { onCellClick, placingItem } = opts;
  const state = getState();
  const stage = getGardenStage();
  const objects = state.garden.objects;

  // 배치된 오브젝트 id 목록
  const occupiedSet = new Set();
  objects.forEach(o => occupiedSet.add(`${o.x},${o.y}`));
  INITIAL_DEBRIS.forEach(d => {
    // 이미 플레이어가 해당 위치에 배치했으면 debris 숨김
    if (!occupiedSet.has(`${d.x},${d.y}`)) {
      occupiedSet.add(`${d.x},${d.y}-debris`);
    }
  });

  const svgW = GRID_COLS * CELL_SIZE + PADDING * 2;
  const svgH = GRID_ROWS * CELL_SIZE + PADDING * 2;

  let svg = container.querySelector('svg.garden-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('garden-svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    container.appendChild(svg);
  }

  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.setAttribute('width', '100%');
  svg.style.maxWidth = svgW + 'px';

  svg.innerHTML = ''; // 전체 재렌더링

  // ── 배경 그라데이션 ──
  const defs = makeSVGEl('defs');
  const grad = makeSVGEl('linearGradient', { id: 'garden-bg', x1: '0', y1: '0', x2: '0', y2: '1' });
  grad.innerHTML = `
    <stop offset="0%" stop-color="${stageColors(stage).top}"/>
    <stop offset="100%" stop-color="${stageColors(stage).bottom}"/>
  `;
  defs.appendChild(grad);
  svg.appendChild(defs);

  // ── 배경 ──
  const bg = makeSVGEl('rect', {
    x: 0, y: 0, width: svgW, height: svgH,
    fill: 'url(#garden-bg)',
    rx: 16
  });
  svg.appendChild(bg);

  // ── 격자 경로 그라운드 ──
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const cx = PADDING + col * CELL_SIZE;
      const cy = PADDING + row * CELL_SIZE;
      const cell = makeSVGEl('rect', {
        x: cx + 2, y: cy + 2,
        width: CELL_SIZE - 4, height: CELL_SIZE - 4,
        fill: getCellFill(row, col, stage),
        rx: 8,
        opacity: 0.6,
      });
      if (placingItem) {
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => onCellClick && onCellClick(col, row));
        // hover 효과
        cell.addEventListener('mouseenter', () => {
          cell.setAttribute('opacity', '0.9');
          cell.setAttribute('fill', 'rgba(134,239,172,0.4)');
        });
        cell.addEventListener('mouseleave', () => {
          cell.setAttribute('opacity', '0.6');
          cell.setAttribute('fill', getCellFill(row, col, stage));
        });
      }
      svg.appendChild(cell);
    }
  }

  // ── debris (황폐 오브젝트) ──
  INITIAL_DEBRIS.forEach(d => {
    const placed = objects.some(o => o.x === d.x && o.y === d.y);
    if (!placed) {
      renderObject(svg, d, stage, false);
    }
  });

  // ── 배치된 오브젝트 ──
  objects.forEach(obj => {
    renderObject(svg, obj, stage, true);
  });
}

function renderObject(svg, obj, stage, withAnim) {
  const cx = PADDING + obj.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = PADDING + obj.y * CELL_SIZE + CELL_SIZE / 2;
  const fontSize = obj.fixed ? 22 : 28;

  const g = makeSVGEl('g');
  if (withAnim) {
    g.classList.add('garden-obj-placed');
    g.style.transformOrigin = `${cx}px ${cy}px`;
  }

  // 그림자 효과
  if (!obj.fixed) {
    const shadow = makeSVGEl('ellipse', {
      cx: cx, cy: cy + 14,
      rx: 18, ry: 6,
      fill: 'rgba(0,0,0,0.12)'
    });
    g.appendChild(shadow);
  }

  const text = makeSVGEl('text', {
    x: cx, y: cy + fontSize * 0.38,
    'text-anchor': 'middle',
    'font-size': fontSize,
    opacity: obj.fixed ? 0.5 : 1,
  });
  text.textContent = obj.emoji;

  g.appendChild(text);
  svg.appendChild(g);
}

function makeSVGEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

function stageColors(stage) {
  const palettes = [
    { top: '#d4a96a', bottom: '#b8954a' }, // stage 1 — 황토
    { top: '#86efac', bottom: '#4ade80' }, // stage 2 — 연두
    { top: '#67e8f9', bottom: '#22d3ee' }, // stage 3 — 청록
    { top: '#86efac', bottom: '#34d399' }, // stage 4 — 초록
    { top: '#a5f3fc', bottom: '#34d399' }, // stage 5 — 청록+초록
    { top: '#bbf7d0', bottom: '#4ade80' }, // stage 6 — 밝은 초록
    { top: '#d9f99d', bottom: '#86efac' }, // stage 7 — 황금 정원
  ];
  return palettes[Math.min(stage - 1, palettes.length - 1)];
}

function getCellFill(row, col, stage) {
  if (stage <= 1) return 'rgba(139,90,43,0.3)';
  if (stage <= 3) return 'rgba(74,222,128,0.25)';
  return 'rgba(134,239,172,0.25)';
}

// ─── 상점 UI ─────────────────────────────────────────────────

export function renderShop(container) {
  const state = getState();
  const stage = getGardenStage();
  const coins = state.player.coins;

  container.innerHTML = `
    <div class="shop-header-bar">
      <span class="shop-title">🏪 정원 상점</span>
      <span class="shop-coin-display">🪙 ${coins}</span>
    </div>
    <div class="shop-grid">
      ${GARDEN_ITEMS.map(item => {
        const locked = item.stage > stage;
        const canAfford = coins >= item.cost;
        return `
          <div class="shop-item ${locked ? 'shop-item--locked' : ''} ${!canAfford && !locked ? 'shop-item--poor' : ''}"
               data-item-id="${item.id}" ${locked ? '' : 'role="button" tabindex="0"'}>
            <div class="si-emoji">${locked ? '🔒' : item.emoji}</div>
            <div class="si-name">${locked ? '잠금' : item.name}</div>
            <div class="si-cost">${locked ? `Lv.${item.stage}` : `🪙 ${item.cost}`}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export function getItemById(id) {
  return GARDEN_ITEMS.find(i => i.id === id);
}
