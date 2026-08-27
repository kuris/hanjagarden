// app.js — 화면 전환 & 앱 초기화

import {
  getState, save, addXP, addCoins, spendCoins,
  loseHeart, updateStreak, markCorrect, markWrong,
  getLearnedCount, getLevelName, getXPForNextLevel,
  getGardenStage, addToInventory, placeGardenObject,
  pickNextKanji, buildQuizOptions
} from './game-state.js';

import { initMiniGame, destroyMiniGame, getGradeRewards } from './mini-game.js';
import { renderGarden, renderShop, getItemById, GARDEN_ITEMS } from './garden.js';
import { UNIQUE_KANJI } from './kanji-data.js';
import { sound } from './sound.js';

// ─── 앱 상태 ─────────────────────────────────────────────────

let currentScreen = 'garden';
let currentGrade = null;
let currentKanji = null;
let placingItem = null;  // 배치 중인 정원 아이템

// ─── 초기화 ──────────────────────────────────────────────────

export function initApp() {
  updateStreak();
  updateHUD();
  showScreen('garden');
  setupNavigation();
  setupGlobalEvents();
  renderGardenScreen();
}

function setupNavigation() {
  // 하단 탭
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav;
      showScreen(target);
    });
  });

  // PLAY 버튼
  document.getElementById('btn-play')?.addEventListener('click', () => {
    showScreen('minigame');
    startMiniGame();
  });
}

function setupGlobalEvents() {
  // 정원 상점 열기
  document.getElementById('btn-shop')?.addEventListener('click', () => {
    showScreen('shop');
    renderShopScreen();
  });

  // 배치 모드 취소
  document.getElementById('btn-cancel-place')?.addEventListener('click', () => {
    placingItem = null;
    renderGardenScreen();
  });

  // 사운드 토글 버튼
  const soundBtn = document.getElementById('hud-sound');
  if (soundBtn) {
    soundBtn.textContent = sound.getMuted() ? '🔇' : '🔊';
    soundBtn.addEventListener('click', () => {
      const muted = sound.toggleMute();
      soundBtn.textContent = muted ? '🔇' : '🔊';
      if (!muted) {
        sound.startBGM();
      }
    });
  }

  // 첫 사용자 인터랙션 시 오디오 컨텍스트 활성화 및 BGM 시작
  const startAudioOnFirstInteraction = () => {
    sound.initContext();
    if (!sound.getMuted()) {
      sound.startBGM();
    }
    window.removeEventListener('click', startAudioOnFirstInteraction);
    window.removeEventListener('touchstart', startAudioOnFirstInteraction);
  };
  window.addEventListener('click', startAudioOnFirstInteraction, { once: true });
  window.addEventListener('touchstart', startAudioOnFirstInteraction, { once: true });
}

// ─── HUD 업데이트 ────────────────────────────────────────────

export function updateHUD() {
  const s = getState();
  setEl('hud-coins',  `🪙 ${s.player.coins}`);
  setEl('hud-hearts', heartsHTML(s.player.hearts));
  setEl('hud-level',  `⭐ Lv.${s.player.level}`);
  setEl('hud-book',   `📖 ${getLearnedCount()}/${UNIQUE_KANJI.length}`);
  const streakEl = document.getElementById('hud-streak');
  if (streakEl) {
    if (s.player.streak > 0) {
      streakEl.textContent = `🔥 ${s.player.streak}일`;
      streakEl.style.display = '';
    } else {
      streakEl.style.display = 'none';
    }
  }
}

function heartsHTML(count) {
  return '❤️'.repeat(count) + '🖤'.repeat(5 - count);
}

// ─── 화면 전환 ───────────────────────────────────────────────

export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('screen--active');
  });
  const el = document.getElementById(`screen-${name}`);
  if (el) {
    el.classList.add('screen--active');
    currentScreen = name;
  }

  // 탭 활성화
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.classList.toggle('nav-btn--active', btn.dataset.nav === name);
  });

  // 화면별 초기화
  if (name === 'garden') renderGardenScreen();
  if (name === 'kanjibook') renderKanjiBook();
  if (name === 'inventory') renderInventory();
  if (name === 'shop') renderShopScreen();
}

// ─── 정원 화면 ───────────────────────────────────────────────

function renderGardenScreen() {
  const container = document.getElementById('garden-svg-container');
  if (!container) return;

  if (placingItem) {
    renderGarden(container, {
      placingItem,
      onCellClick: (x, y) => handlePlacingItem(x, y),
    });
    setEl('garden-placing-hint', `${placingItem.emoji} ${placingItem.name} 배치할 위치를 선택하세요`);
    document.getElementById('garden-placing-bar')?.classList.remove('hidden');
  } else {
    renderGarden(container, {});
    document.getElementById('garden-placing-bar')?.classList.add('hidden');
  }

  updateHUD();
  updateGardenStageInfo();
}

function updateGardenStageInfo() {
  const stage = getGardenStage();
  const stageNames = ['', '황폐한 정원', '기본 꽃밭', '작은 연못', '벤치와 나무', '분수', '정자', '아름다운 정원'];
  setEl('garden-stage-name', `${stageNames[stage] || ''}`);
  setEl('garden-learned-count', `한자 ${getLearnedCount()}개 학습`);
}

function handlePlacingItem(x, y) {
  if (!placingItem) return;
  const s = getState();

  // 이미 배치된 셀인지 확인
  const occupied = s.garden.objects.some(o => o.x === x && o.y === y);
  if (occupied) {
    showToast('이미 다른 아이템이 있어요!');
    return;
  }

  placeGardenObject({
    type: placingItem.id,
    emoji: placingItem.emoji,
    name: placingItem.name,
    x, y,
  });

  const savedEmoji = placingItem.emoji;
  showPlacementEffect(x, y);
  placingItem = null;
  renderGardenScreen();
  showToast(`${savedEmoji} 배치 완료!`);
}

// ─── 미니게임 ────────────────────────────────────────────────

function startMiniGame() {
  const container = document.getElementById('screen-minigame');
  if (!container) return;

  initMiniGame(container, onMiniGameEnd);
}

function onMiniGameEnd(grade, score) {
  currentGrade = grade;

  // 기본 보상
  const rewards = getGradeRewards(grade);
  addXP(rewards.xp);
  addCoins(rewards.coins);

  updateHUD();

  // 한자 퀴즈로 이동
  currentKanji = pickNextKanji();
  setTimeout(() => {
    showScreen('kanji-quiz');
    renderKanjiQuiz();
  }, 500);
}

// ─── 한자 퀴즈 ───────────────────────────────────────────────

function renderKanjiQuiz() {
  if (!currentKanji) return;

  const container = document.getElementById('screen-kanji-quiz');
  if (!container) return;

  const options = buildQuizOptions(currentKanji);

  setEl('quiz-kanji-char', currentKanji.character);
  setEl('quiz-grade-label', `${getGradeLabel(currentGrade)} 오늘의 한자!`);

  const optionsEl = container.querySelector('#quiz-options');
  if (!optionsEl) return;
  optionsEl.innerHTML = '';
  delete optionsEl.dataset.answered;  // 이전 답변 열립 초기화

  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option-btn';
    btn.id = `quiz-opt-${i}`;
    btn.innerHTML = `<span class="quiz-opt-reading">${opt.reading}</span> / <span class="quiz-opt-meaning">${opt.meaning}</span>`;
    // opt.isCorrect를 취리즈로 사용하는 클로저
    btn.addEventListener('click', () => handleQuizAnswer(opt, btn, optionsEl, options));
    optionsEl.appendChild(btn);
  });
}

function getGradeLabel(grade) {
  return { excellent: '🌟 EXCELLENT! ', good: '✨ GOOD! ', normal: '👍 NICE! ' }[grade] || '✨';
}

function handleQuizAnswer(opt, btn, optionsEl, options) {
  // 이미 답 선택 후 클릭 방지
  if (optionsEl.dataset.answered) return;
  optionsEl.dataset.answered = 'true';

  // 모든 버튼 비활성화
  optionsEl.querySelectorAll('.quiz-option-btn').forEach(b => b.disabled = true);

  if (opt.isCorrect) {
    btn.classList.add('quiz-option-btn--correct');
    markCorrect(currentKanji.id);

    // 정답 보상
    addCoins(50);
    addToInventory({ id: 'flower_seed', emoji: '🌱', name: '꽃씨', count: 1 });

    setTimeout(() => showRewardScreen(true), 800);
  } else {
    btn.classList.add('quiz-option-btn--wrong');
    loseHeart();
    markWrong(currentKanji.id);

    // 정답 버튼만 표시 (options 리스트에서 isCorrect 확인)
    const allBtns = optionsEl.querySelectorAll('.quiz-option-btn');
    allBtns.forEach((b, i) => {
      if (b !== btn && options && options[i] && options[i].isCorrect) {
        b.classList.add('quiz-option-btn--correct');
      }
    });

    setTimeout(() => showRewardScreen(false), 1000);
  }

  updateHUD();
}

// ─── 보상 화면 ───────────────────────────────────────────────

function showRewardScreen(isCorrect) {
  showScreen('reward');

  const s = getState();
  const rewardEl = document.getElementById('reward-content');
  if (!rewardEl) return;

  if (isCorrect) {
    rewardEl.innerHTML = `
      <div class="reward-box">
        <div class="reward-burst">🎉</div>
        <div class="reward-title">정답!</div>
        <div class="reward-kanji-box">
          <span class="reward-char">${currentKanji.character}</span>
          <span class="reward-read">${currentKanji.reading} / ${currentKanji.meaning}</span>
        </div>
        <div class="reward-gifts">
          <div class="reward-gift" style="--d:.1s"><span class="gi">🪙</span><span>코인 +50</span></div>
          <div class="reward-gift" style="--d:.2s"><span class="gi">🌱</span><span>꽃씨 ×1</span></div>
          <div class="reward-gift" style="--d:.3s"><span class="gi">⭐</span><span>경험치 획득!</span></div>
        </div>
        <button class="btn btn-green btn-lg" id="btn-reward-continue">
          정원으로 돌아가기 🌿
        </button>
      </div>
    `;
    // 파티클 효과
    spawnParticles(rewardEl, ['🌸', '⭐', '🪙', '✨', '🌿']);
  } else {
    rewardEl.innerHTML = `
      <div class="reward-box">
        <div class="reward-burst">💪</div>
        <div class="reward-title" style="font-size:22px;">아쉽지만 괜찮아요!</div>
        <div class="reward-kanji-box">
          <span class="reward-char">${currentKanji.character}</span>
          <span class="reward-read">${currentKanji.reading} / ${currentKanji.meaning}</span>
        </div>
        <p class="reward-hint">이 한자는 다음에 다시 만나요! 💬</p>
        <div class="reward-hearts">남은 하트: ${heartsHTML(s.player.hearts)}</div>
        <button class="btn btn-green btn-lg" id="btn-reward-continue">
          계속하기 →
        </button>
      </div>
    `;
  }

  document.getElementById('btn-reward-continue')?.addEventListener('click', () => {
    showScreen('garden');
  });
}

// ─── 한자 도감 ───────────────────────────────────────────────

function renderKanjiBook() {
  const container = document.getElementById('kanjibook-grid');
  if (!container) return;

  const s = getState();
  container.innerHTML = '';

  const learnedCount = getLearnedCount();
  setEl('kanjibook-count', `${learnedCount} / ${UNIQUE_KANJI.length}`);

  // 진도 바 업데이트
  const progressFill = document.getElementById('kanjibook-progress-fill');
  if (progressFill) {
    progressFill.style.width = `${Math.round((learnedCount / UNIQUE_KANJI.length) * 100)}%`;
  }

  UNIQUE_KANJI.forEach(kanji => {
    const progress = s.kanji[kanji.id] || { mastery: 0, correctCount: 0, wrongCount: 0, learned: false };
    const learned = progress.learned;
    const mastery = progress.mastery || 0;
    const total = progress.correctCount + progress.wrongCount;
    const accuracy = total > 0 ? Math.round((progress.correctCount / total) * 100) : 0;

    const card = document.createElement('div');
    card.className = `kanji-card ${learned ? 'kanji-card--learned' : 'kanji-card--locked'}`;
    card.innerHTML = `
      <div class="kc-char">${learned ? kanji.character : '？'}</div>
      ${learned ? `
        <div class="kc-read">${kanji.reading} / ${kanji.meaning}</div>
        <div class="kc-stars">${'⭐'.repeat(mastery)}${'☆'.repeat(4 - mastery)}</div>
        <div class="kc-acc">${total > 0 ? `${accuracy}%` : '미도전'}</div>
      ` : `<div class="kc-lock">잠김</div>`}
    `;
    container.appendChild(card);
  });
}

// ─── 인벤토리 ────────────────────────────────────────────────

function renderInventory() {
  const container = document.getElementById('inventory-grid');
  if (!container) return;

  const s = getState();
  const inv = s.inventory;

  if (inv.length === 0) {
    container.innerHTML = '<p class="empty-msg">아직 아이템이 없어요.<br>게임을 플레이해서 아이템을 모아보세요! 🎮</p>';
    return;
  }

  container.innerHTML = inv.map(item => `
    <div class="inv-item" data-item-id="${item.id}">
      <div class="inv-emoji">${item.emoji}</div>
      <div class="inv-name">${item.name}</div>
      <div class="inv-count">×${item.count}</div>
    </div>
  `).join('');

  // 클릭 → 정원 배치 모드
  container.querySelectorAll('.inv-item').forEach(el => {
    el.addEventListener('click', () => {
      const itemId = el.dataset.itemId;
      const item = getItemById(itemId);
      if (!item) {
        // flower_seed 같은 상점 외 아이템은 정원 배치 불가
        showToast('이 아이템은 정원에 배치할 수 없어요.');
        return;
      }
      placingItem = item;
      showScreen('garden');
      showToast(`${item.emoji} 배치할 위치를 선택하세요`);
    });
  });
}

// ─── 상점 ────────────────────────────────────────────────────

function renderShopScreen() {
  const container = document.getElementById('shop-content');
  if (!container) return;

  renderShop(container);

  const stage = getGardenStage();
  const s = getState();

  // 구매 이벤트
  container.querySelectorAll('.shop-item').forEach(el => {
    const itemId = el.dataset.itemId;
    const item = getItemById(itemId);
    if (!item || item.stage > stage) return;

    el.addEventListener('click', () => {
      if (!spendCoins(item.cost)) {
        showToast('코인이 부족해요! 🪙');
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 400);
        return;
      }

      // 인벤토리에 추가
      addToInventory({ id: item.id, emoji: item.emoji, name: item.name, count: 1 });
      updateHUD();
      renderShopScreen();
      showToast(`${item.emoji} ${item.name} 구매 완료!`);

      // 배치 모드로 전환
      setTimeout(() => {
        placingItem = item;
        showScreen('garden');
        showToast(`${item.emoji} 정원에 배치할 위치를 선택하세요`);
      }, 800);
    });
  });
}

// ─── 파티클 효과 ─────────────────────────────────────────────

function spawnParticles(container, emojis) {
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    p.style.setProperty('--x', `${Math.random() * 100}%`);
    p.style.setProperty('--delay', `${Math.random() * 0.5}s`);
    p.style.setProperty('--dur', `${0.8 + Math.random() * 0.6}s`);
    container.appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }
}

// ─── 배치 효과 ───────────────────────────────────────────────

function showPlacementEffect(x, y) {
  const container = document.getElementById('garden-svg-container');
  if (!container) return;
  const sparkle = document.createElement('div');
  sparkle.className = 'sparkle-effect';
  sparkle.textContent = '✨';
  sparkle.style.left = `${(x + 0.5) * (100 / 7)}%`;
  sparkle.style.top = `${(y + 0.5) * (100 / 6)}%`;
  container.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 800);
}

// ─── 토스트 메시지 ───────────────────────────────────────────

export function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--show'));
  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

// ─── 유틸 ────────────────────────────────────────────────────

function setEl(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
