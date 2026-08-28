// mini-game.js — 과일 스왑 매치-3 퍼즐 (4매치 폭탄 / 5매치 슈퍼스타 특수 아이템 & 연쇄 콤보)

import { sound } from './sound.js';

export const GRID_SIZE = 6; // 6×6 격자 (다채로운 4/5매칭 지원)
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const ALL_FRUITS = ['🍎', '🍊', '🍇', '🍓', '🍋', '🍑'];
const ITEM_BOMB = '💣';   // 4매치 특수 아이템
const ITEM_SUPER = '🌟';  // 5매치 특수 아이템

let activeFruits = ['🍎', '🍊', '🍇', '🍓'];
let grid = [];             // 셀 데이터: 과일 이모지 또는 특수 아이템
let isProcessing = false;  // 애니메이션/매칭 처리 중 입력 잠금
let selectedIdx = -1;      // 현재 탭 선택된 셀 인덱스
let dragStartPos = null;   // 드래그 시작 좌표
let dragStartIdx = -1;     // 드래그 시작 셀 인덱스
let timeLeft = 30;
let timerInterval = null;
let hintTimer = null;      // 10초 이상 멈춰있을 때 힌트를 띄우는 타이머
let hintsUsed = 0;          // 한 판당 사용된 힌트 횟수 (최대 2회)
const MAX_HINTS_PER_GAME = 2;
const HINT_IDLE_TIME = 10000; // 10초
let activeHintIndices = []; // 현재 반짝이는 힌트 타일 인덱스
let score = 0;              // 제거한 횟수
let matchCount = 0;         // 매치 콤보/횟수
let onGameEnd = null;       // 콜백

// ─── 공개 API ───────────────────────────────────────────────

export function initMiniGame(container, endCallback) {
  onGameEnd = endCallback;
  score = 0;
  matchCount = 0;
  timeLeft = 30;
  selectedIdx = -1;
  isProcessing = false;
  dragStartPos = null;
  dragStartIdx = -1;
  hintsUsed = 0;
  activeHintIndices = [];
  if (hintTimer) clearTimeout(hintTimer);

  // 매 판 6가지 과일 중 4~5가지 무작위 선택
  const shuffled = [...ALL_FRUITS].sort(() => Math.random() - 0.5);
  activeFruits = shuffled.slice(0, 4);

  grid = createInitialBoard();
  render(container);
  startTimer(container);
  scheduleHint();

  const scoreEl = container.querySelector('#minigame-score-text');
  if (scoreEl) scoreEl.textContent = '0점';

  sound.initContext();
}

export function destroyMiniGame() {
  if (timerInterval) clearInterval(timerInterval);
  if (hintTimer) clearTimeout(hintTimer);
  clearHintVisuals();
  isProcessing = false;
  selectedIdx = -1;
}

// ─── 보드 초기화 (초기 매칭 없는 안정된 상태) ─────────────────

function createInitialBoard() {
  let board = [];
  do {
    board = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        let available = [...activeFruits];
        // 가로 3연속 방지
        if (c >= 2 && board[r * GRID_SIZE + c - 1] === board[r * GRID_SIZE + c - 2]) {
          available = available.filter(f => f !== board[r * GRID_SIZE + c - 1]);
        }
        // 세로 3연속 방지
        if (r >= 2 && board[(r - 1) * GRID_SIZE + c] === board[(r - 2) * GRID_SIZE + c]) {
          available = available.filter(f => f !== board[(r - 1) * GRID_SIZE + c]);
        }
        const fruit = available[Math.floor(Math.random() * available.length)] || activeFruits[0];
        board.push(fruit);
      }
    }
  } while (!hasPossibleMoves(board));

  return board;
}

// 가능한 스왑 이동이 있는지 검사
function hasPossibleMoves(board) {
  return findHintMove(board) !== null;
}

// 힌트로 보여줄 유효한 스왑 쌍 찾기
function findHintMove(board) {
  // 1) 보드에 폭탄(💣)이나 슈퍼스타(🌟)가 있으면 해당 아이템과 인접 타일을 힌트로 우선 제시
  for (let idx = 0; idx < TOTAL_CELLS; idx++) {
    if (board[idx] === ITEM_BOMB || board[idx] === ITEM_SUPER) {
      const r = Math.floor(idx / GRID_SIZE);
      const c = idx % GRID_SIZE;
      if (c + 1 < GRID_SIZE && board[idx + 1]) return [idx, idx + 1];
      if (r + 1 < GRID_SIZE && board[idx + GRID_SIZE]) return [idx, idx + GRID_SIZE];
      if (c - 1 >= 0 && board[idx - 1]) return [idx, idx - 1];
      if (r - 1 >= 0 && board[idx - GRID_SIZE]) return [idx, idx - GRID_SIZE];
    }
  }

  // 2) 가로/세로 스왑 매칭 탐색
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const idx = r * GRID_SIZE + c;
      // 오른쪽 스왑 테스트
      if (c + 1 < GRID_SIZE) {
        const rightIdx = r * GRID_SIZE + (c + 1);
        swapBoard(board, idx, rightIdx);
        const matches = findMatches(board);
        swapBoard(board, idx, rightIdx);
        if (matches.length > 0) return [idx, rightIdx];
      }
      // 아래쪽 스왑 테스트
      if (r + 1 < GRID_SIZE) {
        const downIdx = (r + 1) * GRID_SIZE + c;
        swapBoard(board, idx, downIdx);
        const matches = findMatches(board);
        swapBoard(board, idx, downIdx);
        if (matches.length > 0) return [idx, downIdx];
      }
    }
  }
  return null;
}

function swapBoard(board, a, b) {
  const temp = board[a];
  board[a] = board[b];
  board[b] = temp;
}

// ─── 힌트 스케줄러 & 시각 효과 ────────────────────────────────

export function scheduleHint() {
  if (hintTimer) clearTimeout(hintTimer);
  clearHintVisuals();

  // 한 판에 2회까지만 힌트 제공
  if (hintsUsed >= MAX_HINTS_PER_GAME) return;

  // 사용자가 10초 이상 멈춰있으면 살짝 반짝거리며 힌트 제시!
  hintTimer = setTimeout(() => {
    if (isProcessing) return;
    if (hintsUsed >= MAX_HINTS_PER_GAME) return;

    const move = findHintMove(grid);
    if (move) {
      hintsUsed++;
      showHintVisuals(move);
    }
  }, HINT_IDLE_TIME);
}

function showHintVisuals(indices) {
  activeHintIndices = indices;
  const gameEl = document.getElementById('minigame-grid');
  if (!gameEl) return;

  indices.forEach(idx => {
    const cell = gameEl.children[idx];
    if (cell) {
      cell.classList.add('mg-cell--hint');
    }
  });

  const hintBar = document.querySelector('.mg-hint');
  if (hintBar) {
    hintBar.classList.add('mg-hint--glow');
  }
}

function clearHintVisuals() {
  activeHintIndices = [];
  const gameEl = document.getElementById('minigame-grid');
  if (gameEl) {
    const cells = gameEl.querySelectorAll('.mg-cell--hint');
    cells.forEach(c => c.classList.remove('mg-cell--hint'));
  }
  const hintBar = document.querySelector('.mg-hint');
  if (hintBar) {
    hintBar.classList.remove('mg-hint--glow');
  }
}

// ─── 렌더링 ──────────────────────────────────────────────────

function render(container) {
  const gameEl = container.querySelector('#minigame-grid');
  if (!gameEl) return;

  gameEl.innerHTML = '';
  gameEl.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;

  grid.forEach((item, idx) => {
    const cell = document.createElement('div');
    cell.className = 'mg-cell';
    cell.dataset.idx = idx;
    updateCellAppearance(cell, item);
    gameEl.appendChild(cell);
  });

  attachEvents(gameEl);
}

function updateCellAppearance(cell, item) {
  cell.textContent = item || '';
  cell.className = 'mg-cell';

  if (!item) {
    cell.classList.add('mg-cell--empty');
  } else if (item === ITEM_BOMB) {
    cell.classList.add('mg-cell--bomb');
  } else if (item === ITEM_SUPER) {
    cell.classList.add('mg-cell--super');
  }
}

function refreshAllCells() {
  const gameEl = document.getElementById('minigame-grid');
  if (!gameEl) return;

  grid.forEach((item, idx) => {
    const cell = gameEl.children[idx];
    if (cell) {
      updateCellAppearance(cell, item);
      if (idx === selectedIdx) {
        cell.classList.add('mg-cell--selected');
      }
    }
  });
}

// ─── 이벤트 처리 (탭 & 스와이프) ───────────────────────────────

function attachEvents(gameEl) {
  gameEl.addEventListener('pointerdown', (e) => onPointerDown(e, gameEl));
  gameEl.addEventListener('pointermove', (e) => onPointerMove(e, gameEl));
  window.addEventListener('pointerup', (e) => onPointerUp(e, gameEl));
  window.addEventListener('pointercancel', (e) => onPointerUp(e, gameEl));
}

function getCellAtPoint(gameEl, x, y) {
  const cells = gameEl.querySelectorAll('.mg-cell');
  for (const cell of cells) {
    const rect = cell.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return parseInt(cell.dataset.idx, 10);
    }
  }
  return -1;
}

function onPointerDown(e, gameEl) {
  if (isProcessing) return;
  const idx = getCellAtPoint(gameEl, e.clientX, e.clientY);
  if (idx < 0 || !grid[idx]) return;

  // 사용자 인터랙션 시 힌트 해제 및 타이머 리셋
  clearHintVisuals();
  scheduleHint();

  dragStartPos = { x: e.clientX, y: e.clientY };
  dragStartIdx = idx;

  // 이미 다른 셀이 선택되어 있는 경우 스왑 시도
  if (selectedIdx >= 0 && selectedIdx !== idx) {
    if (isAdjacentOrthogonal(selectedIdx, idx)) {
      const first = selectedIdx;
      selectedIdx = -1;
      clearSelection(gameEl);
      handleSwap(first, idx, gameEl);
      return;
    }
  }

  // 선택 토글
  if (selectedIdx === idx) {
    selectedIdx = -1;
    clearSelection(gameEl);
  } else {
    selectedIdx = idx;
    clearSelection(gameEl);
    const cell = gameEl.children[idx];
    if (cell) cell.classList.add('mg-cell--selected');
    sound.playSelect();
  }
}

function onPointerMove(e, gameEl) {
  if (isProcessing || !dragStartPos || dragStartIdx < 0) return;

  const dx = e.clientX - dragStartPos.x;
  const dy = e.clientY - dragStartPos.y;
  const dist = Math.hypot(dx, dy);

  // 24px 이상 스와이프 감지 시 즉시 방향 결정 및 스왑
  if (dist >= 24) {
    const r = Math.floor(dragStartIdx / GRID_SIZE);
    const c = dragStartIdx % GRID_SIZE;
    let targetIdx = -1;

    if (Math.abs(dx) > Math.abs(dy)) {
      // 좌우 스와이프
      if (dx > 0 && c + 1 < GRID_SIZE) targetIdx = r * GRID_SIZE + (c + 1);
      else if (dx < 0 && c - 1 >= 0)   targetIdx = r * GRID_SIZE + (c - 1);
    } else {
      // 상하 스와이프
      if (dy > 0 && r + 1 < GRID_SIZE) targetIdx = (r + 1) * GRID_SIZE + c;
      else if (dy < 0 && r - 1 >= 0)   targetIdx = (r - 1) * GRID_SIZE + c;
    }

    const fromIdx = dragStartIdx;
    dragStartPos = null;
    dragStartIdx = -1;
    selectedIdx = -1;
    clearSelection(gameEl);

    if (targetIdx >= 0) {
      handleSwap(fromIdx, targetIdx, gameEl);
    }
  }
}

function onPointerUp(e, gameEl) {
  dragStartPos = null;
  dragStartIdx = -1;
}

function clearSelection(gameEl) {
  const cells = gameEl.querySelectorAll('.mg-cell');
  cells.forEach(c => c.classList.remove('mg-cell--selected'));
}

function isAdjacentOrthogonal(a, b) {
  const ar = Math.floor(a / GRID_SIZE), ac = a % GRID_SIZE;
  const br = Math.floor(b / GRID_SIZE), bc = b % GRID_SIZE;
  return (Math.abs(ar - br) === 1 && ac === bc) || (Math.abs(ac - bc) === 1 && ar === br);
}

// ─── 스왑 & 매칭 실행 ─────────────────────────────────────────

async function handleSwap(idxA, idxB, gameEl) {
  if (isProcessing) return;
  isProcessing = true;

  sound.playSwap();

  // 스왑 애니메이션 연출
  const cellA = gameEl.children[idxA];
  const cellB = gameEl.children[idxB];
  await animateSwap(cellA, cellB, idxA, idxB);

  // 데이터 교환
  swapBoard(grid, idxA, idxB);
  refreshAllCells();

  // 특수 아이템 스왑 처리 (폭탄이나 슈퍼스타와 교환한 경우)
  const itemA = grid[idxA];
  const itemB = grid[idxB];
  const isSpecialSwap = itemA === ITEM_SUPER || itemB === ITEM_SUPER || itemA === ITEM_BOMB || itemB === ITEM_BOMB;

  let matches = findMatches(grid);

  if (matches.length === 0 && !isSpecialSwap) {
    // 매치 실패: 제자리로 복귀
    sound.playSwapFail();
    if (cellA) cellA.classList.add('mg-cell--wrong');
    if (cellB) cellB.classList.add('mg-cell--wrong');
    await wait(220);

    await animateSwap(cellA, cellB, idxA, idxB);
    swapBoard(grid, idxA, idxB);
    refreshAllCells();
    isProcessing = false;
    scheduleHint();
    return;
  }

  // 성공적인 스왑: 매치 및 폭발 처리 루프 시작
  await processBoardMatches(idxA, idxB, gameEl, isSpecialSwap);
  isProcessing = false;
}

// 스왑 시각 애니메이션
function animateSwap(cellA, cellB, idxA, idxB) {
  return new Promise((resolve) => {
    if (!cellA || !cellB) return resolve();
    const ar = Math.floor(idxA / GRID_SIZE), ac = idxA % GRID_SIZE;
    const br = Math.floor(idxB / GRID_SIZE), bc = idxB % GRID_SIZE;
    const dx = (bc - ac) * 100;
    const dy = (br - ar) * 100;

    cellA.style.transform = `translate(${dx}%, ${dy}%) scale(1.05)`;
    cellB.style.transform = `translate(${-dx}%, ${-dy}%) scale(1.05)`;
    cellA.style.transition = 'transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1)';
    cellB.style.transition = 'transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1)';

    setTimeout(() => {
      cellA.style.transform = '';
      cellB.style.transform = '';
      cellA.style.transition = '';
      cellB.style.transition = '';
      resolve();
    }, 190);
  });
}

// ─── 매치 탐색 알고리즘 (3, 4, 5매치 구분) ─────────────────────

function findMatches(board) {
  const matchGroups = [];
  const visitedHorizontal = Array(TOTAL_CELLS).fill(false);
  const visitedVertical = Array(TOTAL_CELLS).fill(false);

  // 1) 가로 매치 탐색
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 2; c++) {
      const idx = r * GRID_SIZE + c;
      const fruit = board[idx];
      if (!fruit || fruit === ITEM_BOMB || fruit === ITEM_SUPER) continue;

      let len = 1;
      while (c + len < GRID_SIZE && board[r * GRID_SIZE + (c + len)] === fruit) {
        len++;
      }

      if (len >= 3) {
        const group = [];
        for (let i = 0; i < len; i++) {
          group.push(r * GRID_SIZE + (c + i));
          visitedHorizontal[r * GRID_SIZE + (c + i)] = true;
        }
        matchGroups.push({ fruit, cells: group, length: len, type: 'horizontal' });
        c += len - 1;
      }
    }
  }

  // 2) 세로 매치 탐색
  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      const idx = r * GRID_SIZE + c;
      const fruit = board[idx];
      if (!fruit || fruit === ITEM_BOMB || fruit === ITEM_SUPER) continue;

      let len = 1;
      while (r + len < GRID_SIZE && board[(r + len) * GRID_SIZE + c] === fruit) {
        len++;
      }

      if (len >= 3) {
        const group = [];
        for (let i = 0; i < len; i++) {
          group.push((r + i) * GRID_SIZE + c);
          visitedVertical[(r + i) * GRID_SIZE + c] = true;
        }
        matchGroups.push({ fruit, cells: group, length: len, type: 'vertical' });
        r += len - 1;
      }
    }
  }

  return matchGroups;
}

// ─── 매치 & 연쇄 콤보 연속 처리 루프 ───────────────────────────

async function processBoardMatches(lastSwapA, lastSwapB, gameEl, isSpecialSwap = false) {
  let combo = 0;
  let targetSwapA = lastSwapA;
  let targetSwapB = lastSwapB;

  while (true) {
    combo++;
    let explodedIndices = new Set();
    let newSpawns = []; // { idx, item } 특수 아이템 생성 대기열

    // 슈퍼스타 스왑 또는 폭탄 스왑인지 확인
    if (isSpecialSwap && combo === 1) {
      isSpecialSwap = false;
      const triggered = await handleSpecialItemSwap(targetSwapA, targetSwapB, gameEl);
      triggered.forEach(idx => explodedIndices.add(idx));
    }

    const matches = findMatches(grid);

    if (matches.length === 0 && explodedIndices.size === 0) {
      break; // 더 이상 매치나 폭발 없음
    }

    // 매치 그룹별 특수 아이템 생성 위치 계산 및 폭발 셀 등록
    matches.forEach(m => {
      m.cells.forEach(idx => explodedIndices.add(idx));

      // 생성 위치 결정 (마지막 스왑한 위치가 포함되어 있으면 그곳에, 아니면 그룹 중앙)
      let spawnIdx = m.cells[Math.floor(m.cells.length / 2)];
      if (m.cells.includes(targetSwapA)) spawnIdx = targetSwapA;
      else if (m.cells.includes(targetSwapB)) spawnIdx = targetSwapB;

      if (m.length >= 5) {
        // 5개 매치: 엄청 좋은 슈퍼 아이템 (🌟) 생성!
        newSpawns.push({ idx: spawnIdx, item: ITEM_SUPER });
      } else if (m.length === 4) {
        // 4개 매치: 좋은 폭탄 아이템 (💣) 생성!
        newSpawns.push({ idx: spawnIdx, item: ITEM_BOMB });
      }
    });

    // 매치에 포함된 기존 폭탄/슈퍼스타가 터질 때 연쇄 폭발 전파
    let addedCount = 0;
    do {
      addedCount = 0;
      const currentExploded = Array.from(explodedIndices);
      for (const idx of currentExploded) {
        const item = grid[idx];
        if (item === ITEM_BOMB) {
          const bombHits = getBombBlastIndices(idx);
          for (const bi of bombHits) {
            if (!explodedIndices.has(bi)) {
              explodedIndices.add(bi);
              addedCount++;
            }
          }
        } else if (item === ITEM_SUPER) {
          const superHits = getSuperBlastIndices(idx);
          for (const si of superHits) {
            if (!explodedIndices.has(si)) {
              explodedIndices.add(si);
              addedCount++;
            }
          }
        }
      }
    } while (addedCount > 0);

    // 사운드 및 이펙트 연출
    const hasBomb = newSpawns.some(s => s.item === ITEM_BOMB) || Array.from(explodedIndices).some(i => grid[i] === ITEM_BOMB);
    const hasSuper = newSpawns.some(s => s.item === ITEM_SUPER) || Array.from(explodedIndices).some(i => grid[i] === ITEM_SUPER);

    if (hasSuper) {
      sound.playSuperExplode();
      showFloatingText(gameEl, '🌟 SUPER!', '#f59e0b');
      triggerShake(gameEl, 12);
    } else if (hasBomb) {
      sound.playBombExplode();
      showFloatingText(gameEl, '💥 BOOM!', '#ef4444');
      triggerShake(gameEl, 8);
    } else {
      sound.playMatch(combo);
      if (combo > 1) {
        showFloatingText(gameEl, `COMBO x${combo}!`, '#22c55e');
      }
    }

    // 터짐 애니메이션
    await playExplosionAnimation(gameEl, Array.from(explodedIndices));

    // 점수 가산 (터진 셀 개수 * 콤보)
    const pointsGained = explodedIndices.size * 10 * combo;
    score += pointsGained;
    matchCount++;
    updateScoreDisplay();

    // 그리드 데이터 갱신 (터진 셀은 null로 비움)
    explodedIndices.forEach(idx => {
      grid[idx] = null;
    });

    // 특수 아이템 스폰 적용
    newSpawns.forEach(s => {
      grid[s.idx] = s.item;
      if (s.item === ITEM_SUPER) sound.playSuperSpawn();
      else if (s.item === ITEM_BOMB) sound.playBombSpawn();
    });

    refreshAllCells();
    await wait(80);

    // 중력 낙하 및 상단 리필
    await applyGravityAndRefill(gameEl);

    // 다음 루프를 위해 스왑 대상 리셋
    targetSwapA = -1;
    targetSwapB = -1;

    await wait(180);
  }

  // 매치 가능한 상태인지 확인 후 없으면 셔플
  if (!hasPossibleMoves(grid)) {
    showFloatingText(gameEl, '🔀 SHUFFLE!', '#8b5cf6');
    await wait(300);
    grid = createInitialBoard();
    render(document.getElementById('screen-minigame'));
  }

  checkWin();
  scheduleHint();
}

// ─── 특수 아이템 스왑 처리 ───────────────────────────────────

async function handleSpecialItemSwap(idxA, idxB, gameEl) {
  const hitIndices = new Set();
  const itemA = grid[idxA];
  const itemB = grid[idxB];

  // 1) 슈퍼스타 + 과일 스왑 -> 해당 과일 전체 제거 + 슈퍼 대폭발
  if (itemA === ITEM_SUPER && itemB && itemB !== ITEM_SUPER && itemB !== ITEM_BOMB) {
    hitIndices.add(idxA);
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (grid[i] === itemB) hitIndices.add(i);
    }
  } else if (itemB === ITEM_SUPER && itemA && itemA !== ITEM_SUPER && itemA !== ITEM_BOMB) {
    hitIndices.add(idxB);
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (grid[i] === itemA) hitIndices.add(i);
    }
  }
  // 2) 슈퍼스타 + 슈퍼스타 스왑 -> 보드 전체 폭발!
  else if (itemA === ITEM_SUPER && itemB === ITEM_SUPER) {
    for (let i = 0; i < TOTAL_CELLS; i++) hitIndices.add(i);
  }
  // 3) 슈퍼스타 + 폭탄 스왑 -> 모든 과일 중 하나를 폭탄으로 바꾸고 연쇄 폭파
  else if ((itemA === ITEM_SUPER && itemB === ITEM_BOMB) || (itemA === ITEM_BOMB && itemB === ITEM_SUPER)) {
    hitIndices.add(idxA);
    hitIndices.add(idxB);
    const randomFruit = activeFruits[Math.floor(Math.random() * activeFruits.length)];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (grid[i] === randomFruit) {
        grid[i] = ITEM_BOMB;
        hitIndices.add(i);
      }
    }
  }
  // 4) 폭탄 스왑
  else if (itemA === ITEM_BOMB || itemB === ITEM_BOMB) {
    if (itemA === ITEM_BOMB) getBombBlastIndices(idxA).forEach(i => hitIndices.add(i));
    if (itemB === ITEM_BOMB) getBombBlastIndices(idxB).forEach(i => hitIndices.add(i));
  }

  return hitIndices;
}

// 4매치 폭탄 폭발 범위 (가로/세로 십자 전체 + 3x3 주변)
function getBombBlastIndices(centerIdx) {
  const hits = new Set();
  const cr = Math.floor(centerIdx / GRID_SIZE);
  const cc = centerIdx % GRID_SIZE;

  // 가로 전체 & 세로 전체
  for (let c = 0; c < GRID_SIZE; c++) hits.add(cr * GRID_SIZE + c);
  for (let r = 0; r < GRID_SIZE; r++) hits.add(r * GRID_SIZE + cc);

  // 3x3 주변
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = cr + dr, nc = cc + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        hits.add(nr * GRID_SIZE + nc);
      }
    }
  }
  return hits;
}

// 5매치 슈퍼스타 폭발 범위 (초대형 5x5 다이아몬드 & 방사형 폭발)
function getSuperBlastIndices(centerIdx) {
  const hits = new Set();
  const cr = Math.floor(centerIdx / GRID_SIZE);
  const cc = centerIdx % GRID_SIZE;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (Math.abs(r - cr) + Math.abs(c - cc) <= 3) {
        hits.add(r * GRID_SIZE + c);
      }
    }
  }
  return hits;
}

// ─── 중력 낙하 & 리필 ─────────────────────────────────────────

async function applyGravityAndRefill(gameEl) {
  // 각 열마다 아래에서 위로 스캔하며 빈 칸 메우기
  for (let c = 0; c < GRID_SIZE; c++) {
    let emptyRow = GRID_SIZE - 1;
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      const idx = r * GRID_SIZE + c;
      if (grid[idx] !== null) {
        if (emptyRow !== r) {
          const targetIdx = emptyRow * GRID_SIZE + c;
          grid[targetIdx] = grid[idx];
          grid[idx] = null;
        }
        emptyRow--;
      }
    }

    // 상단 빈자리 새 과일 리필
    for (let r = emptyRow; r >= 0; r--) {
      const idx = r * GRID_SIZE + c;
      grid[idx] = activeFruits[Math.floor(Math.random() * activeFruits.length)];
    }
  }

  refreshAllCells();
}

// ─── 애니메이션 & 시각 효과 ────────────────────────────────────

function playExplosionAnimation(gameEl, indices) {
  return new Promise((resolve) => {
    if (!indices || indices.length === 0) return resolve();

    indices.forEach(idx => {
      const cell = gameEl.children[idx];
      if (cell) {
        cell.classList.add('mg-cell--match');
        spawnParticles(cell);
      }
    });

    if (navigator.vibrate) navigator.vibrate(35);
    setTimeout(resolve, 320);
  });
}

function spawnParticles(cell) {
  const rect = cell.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < 4; i++) {
    const p = document.createElement('div');
    p.className = 'mg-particle';
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 40;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    document.body.appendChild(p);

    setTimeout(() => p.remove(), 600);
  }
}

function showFloatingText(gameEl, text, color = '#22c55e') {
  const floatEl = document.createElement('div');
  floatEl.className = 'mg-combo-popup';
  floatEl.textContent = text;
  floatEl.style.color = color;
  gameEl.parentElement.appendChild(floatEl);

  setTimeout(() => floatEl.remove(), 900);
}

function triggerShake(element, intensity = 6) {
  element.style.transform = `translate(${(Math.random() - 0.5) * intensity}px, ${(Math.random() - 0.5) * intensity}px)`;
  setTimeout(() => {
    element.style.transform = `translate(${(Math.random() - 0.5) * intensity * 0.5}px, ${(Math.random() - 0.5) * intensity * 0.5}px)`;
    setTimeout(() => {
      element.style.transform = '';
    }, 80);
  }, 80);
}

function updateScoreDisplay() {
  const scoreEl = document.getElementById('minigame-score-text');
  if (scoreEl) scoreEl.textContent = `${score}점 (${matchCount}회)`;
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── 승리 체크 ───────────────────────────────────────────────

function checkWin() {
  // 목표 점수 600점 이상 또는 5회 이상 매칭 시 승리 보상
  if (score >= 600 || matchCount >= 6) {
    endGame('excellent');
  }
}

// ─── 타이머 ──────────────────────────────────────────────────

function startTimer(container) {
  const timerEl = container.querySelector('#minigame-timer');
  const timerBarEl = container.querySelector('#minigame-timer-bar');

  updateTimerDisplay(timerEl, timerBarEl);

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerDisplay(timerEl, timerBarEl);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame(score >= 500 ? 'excellent' : score >= 200 ? 'good' : 'normal');
    }
  }, 1000);
}

function updateTimerDisplay(timerEl, timerBarEl) {
  if (timerEl) timerEl.textContent = timeLeft;
  if (timerBarEl) {
    const pct = (timeLeft / 30) * 100;
    timerBarEl.style.width = pct + '%';
    timerBarEl.style.background = timeLeft > 10
      ? 'var(--primary)'
      : timeLeft > 5 ? '#f59e0b' : '#ef4444';
  }
}

// ─── 게임 종료 ───────────────────────────────────────────────

function endGame(grade) {
  if (timerInterval) clearInterval(timerInterval);
  sound.playWin();
  if (onGameEnd) onGameEnd(grade, score);
}

export function getGradeLabel(grade) {
  return { excellent: 'EXCELLENT!', good: 'GOOD!', normal: 'NICE!' }[grade] || 'NICE!';
}

export function getGradeRewards(grade) {
  return {
    excellent: { xp: 35, coins: 80 },
    good:      { xp: 25, coins: 55 },
    normal:    { xp: 15, coins: 35 },
  }[grade] || { xp: 15, coins: 35 };
}
