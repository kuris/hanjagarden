// mini-game.js — 5×5 스와이프 & 탭 연결 과일 게임 (꿈의 정원 스타일)

export const GRID_SIZE = 5; // 5x5 그리드 (25칸)
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const ALL_FRUITS = ['🍎', '🍊', '🍇', '🍓', '🍋', '🍑'];
// 5x5 판에서 4종류의 과일을 균형 있게 사용하여 다채로운 매칭 제공
let activeFruits = ['🍎', '🍊', '🍇', '🍓'];

let grid = [];
let selectedCells = [];   // 현재 선택/드래그 중인 셀 인덱스 배열
let isPointerDown = false;
let pointerMoved = false;
let timeLeft = 30;
let timerInterval = null;
let score = 0;             // 제거한 매칭 횟수
let onGameEnd = null;      // 콜백

const MIN_MATCH = 3;       // 같은 과일 최소 3개

// ─── 공개 API ───────────────────────────────────────────────

export function initMiniGame(container, endCallback) {
  onGameEnd = endCallback;
  score = 0;
  timeLeft = 30;
  selectedCells = [];
  isPointerDown = false;
  pointerMoved = false;

  // 매 판 6가지 과일 중 4가지를 무작위 선택
  const shuffled = [...ALL_FRUITS].sort(() => Math.random() - 0.5);
  activeFruits = shuffled.slice(0, 4);

  grid = generateValidGrid();
  render(container);
  startTimer(container);

  const scoreEl = container.querySelector('#minigame-score-text');
  if (scoreEl) scoreEl.textContent = '0번';
}

export function destroyMiniGame() {
  if (timerInterval) clearInterval(timerInterval);
  selectedCells = [];
}

// ─── 그리드 생성 ─────────────────────────────────────────────

function generateValidGrid() {
  let attempts = 0;
  while (attempts < 50) {
    const candidate = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      candidate.push(activeFruits[Math.floor(Math.random() * activeFruits.length)]);
    }

    if (hasAnyValidMatch(candidate)) {
      return candidate;
    }
    attempts++;
  }

  // fallback: 무조건 생성
  const candidate = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    candidate.push(activeFruits[i % activeFruits.length]);
  }
  return candidate.sort(() => Math.random() - 0.5);
}

// 인접 3매칭 탐색 (8방향 인접 DFS)
function hasAnyValidMatch(board) {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    const fruit = board[i];
    if (!fruit) continue;
    if (findMatchFrom(board, i, fruit, [i])) {
      return true;
    }
  }
  return false;
}

function findMatchFrom(board, currentIdx, fruit, path) {
  if (path.length >= MIN_MATCH) return true;
  const neighbors = getAdjacentIndices(currentIdx);
  for (const n of neighbors) {
    if (!path.includes(n) && board[n] === fruit) {
      if (findMatchFrom(board, n, fruit, [...path, n])) {
        return true;
      }
    }
  }
  return false;
}

function getAdjacentIndices(idx) {
  const r = Math.floor(idx / GRID_SIZE);
  const c = idx % GRID_SIZE;
  const list = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        list.push(nr * GRID_SIZE + nc);
      }
    }
  }
  return list;
}

// ─── 렌더링 ──────────────────────────────────────────────────

function render(container) {
  const gameEl = container.querySelector('#minigame-grid');
  if (!gameEl) return;

  gameEl.innerHTML = '';
  grid.forEach((fruit, idx) => {
    const cell = document.createElement('div');
    cell.className = 'mg-cell';
    cell.dataset.idx = idx;
    cell.textContent = fruit || '';
    if (!fruit) cell.classList.add('mg-cell--empty');
    gameEl.appendChild(cell);
  });

  attachEvents(gameEl);
}

function renderUpdate(container) {
  const gameEl = container.querySelector('#minigame-grid');
  if (!gameEl) return;

  grid.forEach((fruit, idx) => {
    const cell = gameEl.children[idx];
    if (!cell) return;
    if (fruit === null) {
      cell.classList.add('mg-cell--empty');
      cell.textContent = '';
    } else {
      cell.classList.remove('mg-cell--empty');
      cell.textContent = fruit;
    }
    cell.classList.remove('mg-cell--selected', 'mg-cell--match', 'mg-cell--wrong');
  });
}

// ─── 이벤트 (드래그 + 탭 듀얼 지원) ──────────────────────────────

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
  const idx = getCellAtPoint(gameEl, e.clientX, e.clientY);
  if (idx < 0 || grid[idx] === null) return;

  isPointerDown = true;
  pointerMoved = false;

  if (selectedCells.length > 0) {
    const last = selectedCells[selectedCells.length - 1];
    const firstFruit = grid[selectedCells[0]];

    if (selectedCells.includes(idx)) {
      if (idx === last && selectedCells.length > 1) {
        selectedCells.pop();
        updateSelectionVisual(gameEl);
        return;
      }
    } else if (isAdjacent(last, idx) && grid[idx] === firstFruit) {
      selectedCells.push(idx);
      updateSelectionVisual(gameEl);
      if (navigator.vibrate) navigator.vibrate(15);
      return;
    }
  }

  selectedCells = [idx];
  updateSelectionVisual(gameEl);
  if (navigator.vibrate) navigator.vibrate(10);
}

function onPointerMove(e, gameEl) {
  if (!isPointerDown) return;
  const idx = getCellAtPoint(gameEl, e.clientX, e.clientY);
  if (idx < 0 || grid[idx] === null) return;

  pointerMoved = true;

  if (selectedCells.includes(idx)) {
    if (selectedCells.length >= 2 && idx === selectedCells[selectedCells.length - 2]) {
      selectedCells.pop();
      updateSelectionVisual(gameEl);
    }
    return;
  }

  const last = selectedCells[selectedCells.length - 1];
  if (last !== undefined && !isAdjacent(last, idx)) return;

  const firstFruit = grid[selectedCells[0]];
  if (grid[idx] !== firstFruit) return;

  selectedCells.push(idx);
  updateSelectionVisual(gameEl);
  if (navigator.vibrate) navigator.vibrate(18);
}

function onPointerUp(e, gameEl) {
  if (!isPointerDown) return;
  isPointerDown = false;

  if (selectedCells.length >= MIN_MATCH) {
    finishMatch(gameEl);
  } else {
    if (pointerMoved) {
      if (selectedCells.length > 1) {
        showMatchEffect(gameEl, selectedCells, false);
      }
      setTimeout(() => clearSelection(gameEl), 250);
      selectedCells = [];
    }
  }
}

function finishMatch(gameEl) {
  if (selectedCells.length < MIN_MATCH) return;

  score += 1;
  const matched = [...selectedCells];
  selectedCells = [];

  showMatchEffect(gameEl, matched, true);
  if (navigator.vibrate) navigator.vibrate([30, 40, 50]);

  matched.forEach(idx => { grid[idx] = null; });

  setTimeout(() => {
    refillGrid();
    const screenEl = document.getElementById('screen-minigame');
    if (screenEl) renderUpdate(screenEl);

    const scoreEl = document.getElementById('minigame-score-text');
    if (scoreEl) scoreEl.textContent = `${score}번`;

    checkWin();
  }, 350);
}

function isAdjacent(a, b) {
  const ax = a % GRID_SIZE, ay = Math.floor(a / GRID_SIZE);
  const bx = b % GRID_SIZE, by = Math.floor(b / GRID_SIZE);
  return Math.abs(ax - bx) <= 1 && Math.abs(ay - by) <= 1;
}

function updateSelectionVisual(gameEl) {
  const cells = gameEl.querySelectorAll('.mg-cell');
  cells.forEach((cell, i) => {
    if (selectedCells.includes(i)) {
      cell.classList.add('mg-cell--selected');
    } else {
      cell.classList.remove('mg-cell--selected');
    }
  });
}

function showMatchEffect(gameEl, indices, success) {
  const cells = gameEl.querySelectorAll('.mg-cell');
  indices.forEach(i => {
    const cell = cells[i];
    if (!cell) return;
    cell.classList.remove('mg-cell--selected');
    cell.classList.add(success ? 'mg-cell--match' : 'mg-cell--wrong');
  });
}

function clearSelection(gameEl) {
  const cells = gameEl.querySelectorAll('.mg-cell');
  cells.forEach(c => c.classList.remove('mg-cell--selected', 'mg-cell--wrong'));
}

// ─── 그리드 보충 ─────────────────────────────────────────────

function refillGrid() {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (grid[i] === null) {
      grid[i] = activeFruits[Math.floor(Math.random() * activeFruits.length)];
    }
  }

  if (!hasAnyValidMatch(grid)) {
    grid = generateValidGrid();
  }
}

// ─── 승리 체크 ───────────────────────────────────────────────

function checkWin() {
  // 3번 이상 매칭 시 성공으로 바로 한자 퀴즈 전환 가능
  if (score >= 3) {
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
      endGame(score >= 3 ? 'excellent' : score >= 1 ? 'good' : 'normal');
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
  if (onGameEnd) onGameEnd(grade, score);
}

export function getGradeLabel(grade) {
  return { excellent: 'EXCELLENT!', good: 'GOOD!', normal: 'NICE!' }[grade] || 'NICE!';
}

export function getGradeRewards(grade) {
  return {
    excellent: { xp: 30, coins: 70 },
    good:      { xp: 20, coins: 50 },
    normal:    { xp: 10, coins: 30 },
  }[grade] || { xp: 10, coins: 30 };
}
