// mini-game.js — 3×3 스와이프 연결 과일 게임

import { getState } from './game-state.js';

const FRUITS = ['🍎', '🍊', '🍌', '🍇', '🍓', '🍑'];

let grid = [];
let selectedCells = [];   // 현재 드래그 중인 셀 인덱스 배열
let isPointerDown = false;
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

  grid = generateGrid();
  render(container);
  startTimer(container);
}

export function destroyMiniGame() {
  clearInterval(timerInterval);
}

// ─── 그리드 생성 ─────────────────────────────────────────────

function generateGrid() {
  // 각 과일이 정확히 9개 중 균등하게
  const pool = [];
  for (let i = 0; i < 9; i++) {
    pool.push(FRUITS[i % FRUITS.length]);
  }
  // 섞기
  return pool.sort(() => Math.random() - 0.5);
}

// ─── 렌더링 ──────────────────────────────────────────────────

function render(container) {
  const gameEl = container.querySelector('#minigame-grid');
  if (!gameEl) return;

  gameEl.innerHTML = '';
  gameEl.style.setProperty('--cols', 3);

  grid.forEach((fruit, idx) => {
    const cell = document.createElement('div');
    cell.className = 'mg-cell';
    cell.dataset.idx = idx;

    if (fruit === null) {
      cell.classList.add('mg-cell--empty');
    } else {
      cell.textContent = fruit;
    }

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

// ─── 이벤트 ──────────────────────────────────────────────────

function attachEvents(gameEl) {
  // Pointer 이벤트 (마우스 + 터치 통합)
  gameEl.addEventListener('pointerdown', onPointerDown);
  gameEl.addEventListener('pointermove', onPointerMove);
  gameEl.addEventListener('pointerup', onPointerUp);
  gameEl.addEventListener('pointercancel', onPointerUp);
  gameEl.setPointerCapture && void 0;
}

function getCellAtPoint(gameEl, x, y) {
  const cells = gameEl.querySelectorAll('.mg-cell');
  for (const cell of cells) {
    const rect = cell.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return parseInt(cell.dataset.idx);
    }
  }
  return -1;
}

function onPointerDown(e) {
  e.preventDefault();
  isPointerDown = true;
  selectedCells = [];
  const gameEl = e.currentTarget;
  const idx = getCellAtPoint(gameEl, e.clientX, e.clientY);
  if (idx >= 0 && grid[idx] !== null) {
    selectedCells = [idx];
    updateSelectionVisual(gameEl);
  }
}

function onPointerMove(e) {
  if (!isPointerDown) return;
  e.preventDefault();
  const gameEl = e.currentTarget;
  const idx = getCellAtPoint(gameEl, e.clientX, e.clientY);
  if (idx < 0 || grid[idx] === null) return;
  if (selectedCells.includes(idx)) return;

  // 인접 체크 (8방향)
  const last = selectedCells[selectedCells.length - 1];
  if (last !== undefined && !isAdjacent(last, idx)) return;

  // 같은 과일인지 체크
  const firstFruit = grid[selectedCells[0]];
  if (grid[idx] !== firstFruit) return;

  selectedCells.push(idx);
  updateSelectionVisual(gameEl);
}

function onPointerUp(e) {
  if (!isPointerDown) return;
  isPointerDown = false;
  const gameEl = e.currentTarget;

  if (selectedCells.length >= MIN_MATCH) {
    // 매칭 성공
    const matchedFruit = grid[selectedCells[0]];
    score += 1;

    // 셀 제거
    selectedCells.forEach(idx => { grid[idx] = null; });

    // 성공 애니메이션
    showMatchEffect(gameEl, selectedCells, true);

    // 잠시 후 빈 셀 보충
    setTimeout(() => {
      refillGrid();
      const screenEl = document.getElementById('screen-minigame');
      if (screenEl) renderUpdate(screenEl);
      // 스코어 표시 업데이트
      const scoreEl = document.getElementById('minigame-score-text');
      if (scoreEl) scoreEl.textContent = `${score}번`;
      checkWin(screenEl || document.body);
    }, 400);
  } else {
    // 미완성 선택 — 흔들기 효과
    if (selectedCells.length > 0) {
      showMatchEffect(gameEl, selectedCells, false);
    }
    setTimeout(() => {
      clearSelection(gameEl);
    }, 300);
  }

  selectedCells = [];
}

function isAdjacent(a, b) {
  const ax = a % 3, ay = Math.floor(a / 3);
  const bx = b % 3, by = Math.floor(b / 3);
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
  // 빈 셀을 새 과일로 채운다
  for (let i = 0; i < 9; i++) {
    if (grid[i] === null) {
      grid[i] = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    }
  }
}

// ─── 승리 체크 ───────────────────────────────────────────────

function checkWin(screenEl) {
  // 5번 매칭하면 "Excellent" 엔딩
  if (score >= 5) {
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
      endGame(score >= 3 ? 'excellent' : score >= 2 ? 'good' : 'normal');
    }
  }, 1000);
}

function updateTimerDisplay(timerEl, timerBarEl) {
  if (timerEl) timerEl.textContent = timeLeft;
  if (timerBarEl) {
    const pct = (timeLeft / 30) * 100;
    timerBarEl.style.width = pct + '%';
    timerBarEl.style.background = timeLeft > 10
      ? 'var(--color-primary)'
      : timeLeft > 5 ? '#f59e0b' : '#ef4444';
  }
}

// ─── 게임 종료 ───────────────────────────────────────────────

function endGame(grade) {
  clearInterval(timerInterval);
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
