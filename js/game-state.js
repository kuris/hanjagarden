// game-state.js — 전역 상태 관리 & 한자 선택 알고리즘

import { loadState, saveState } from './storage.js';
import { UNIQUE_KANJI, generateWrongOptions } from './kanji-data.js';

let state = null;

export function getState() {
  if (!state) state = loadState();
  return state;
}

export function save() {
  if (state) saveState(state);
}

// ─── 플레이어 ───────────────────────────────────────────────

export function addXP(amount) {
  const s = getState();
  s.player.xp += amount;
  // 레벨업 체크 (100xp per level)
  const newLevel = Math.floor(s.player.xp / 100) + 1;
  const leveled = newLevel > s.player.level;
  s.player.level = newLevel;
  save();
  return { leveled, newLevel };
}

export function addCoins(amount) {
  const s = getState();
  s.player.coins += amount;
  save();
}

export function spendCoins(amount) {
  const s = getState();
  if (s.player.coins < amount) return false;
  s.player.coins -= amount;
  save();
  return true;
}

export function loseHeart() {
  const s = getState();
  if (s.player.hearts > 0) s.player.hearts -= 1;
  save();
  return s.player.hearts;
}

export function gainHeart() {
  const s = getState();
  if (s.player.hearts < 5) s.player.hearts += 1;
  save();
}

export function updateStreak() {
  const s = getState();
  const today = new Date().toDateString();
  const last = s.player.lastPlayedDate;
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (last === today) {
    // 이미 오늘 했음
  } else if (last === yesterday) {
    s.player.streak += 1;
  } else {
    s.player.streak = 1;
  }
  s.player.lastPlayedDate = today;
  s.player.totalGamesPlayed += 1;
  save();
}

// ─── 한자 선택 알고리즘 ──────────────────────────────────────

/**
 * 가중치 기반 한자 선택
 * mastery 0 → weight 10, 1 → 7, 2 → 4, 3 → 2, 4 → 1
 */
export function pickNextKanji() {
  const s = getState();
  const recent = s.recentKanji || [];

  // 숙련도 초기화되지 않은 한자들 포함
  const weighted = UNIQUE_KANJI.map(k => {
    const progress = s.kanji[k.id] || { mastery: 0 };
    const mastery = Math.min(4, Math.max(0, progress.mastery || 0));
    const weightMap = [10, 7, 4, 2, 1];
    const weight = weightMap[mastery];
    // 최근 출제 한자는 가중치 0 (바로 제외)
    const isRecent = recent.includes(k.id);
    return { kanji: k, weight: isRecent ? 0 : weight };
  }).filter(w => w.weight > 0);

  if (weighted.length === 0) {
    // 모든 한자가 recent에 있으면 그냥 랜덤
    return UNIQUE_KANJI[Math.floor(Math.random() * UNIQUE_KANJI.length)];
  }

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const { kanji, weight } of weighted) {
    rand -= weight;
    if (rand <= 0) {
      // 최근 목록 업데이트
      s.recentKanji = [kanji.id, ...recent].slice(0, 5);
      save();
      return kanji;
    }
  }
  return weighted[weighted.length - 1].kanji;
}

/**
 * 한자 4지선다 선택지 생성
 */
export function buildQuizOptions(kanji) {
  const correct = { reading: kanji.reading, meaning: kanji.meaning, isCorrect: true };
  const wrongs = generateWrongOptions(kanji.reading, kanji.meaning).map(w => ({
    ...w, isCorrect: false
  }));
  const all = [correct, ...wrongs].sort(() => Math.random() - 0.5);
  return all;
}

// ─── 한자 숙련도 ─────────────────────────────────────────────

export function markCorrect(kanjiId) {
  const s = getState();
  if (!s.kanji[kanjiId]) s.kanji[kanjiId] = { mastery: 0, correctCount: 0, wrongCount: 0, learned: false };
  const k = s.kanji[kanjiId];
  k.mastery = Math.min(4, k.mastery + 1);
  k.correctCount += 1;
  k.learned = true;
  k.lastSeen = Date.now();
  save();
}

export function markWrong(kanjiId) {
  const s = getState();
  if (!s.kanji[kanjiId]) s.kanji[kanjiId] = { mastery: 0, correctCount: 0, wrongCount: 0, learned: true };
  const k = s.kanji[kanjiId];
  k.mastery = Math.max(0, k.mastery - 1);
  k.wrongCount += 1;
  k.learned = true;
  k.lastSeen = Date.now();
  save();
}

export function getKanjiProgress(kanjiId) {
  const s = getState();
  return s.kanji[kanjiId] || { mastery: 0, correctCount: 0, wrongCount: 0, learned: false };
}

export function getLearnedCount() {
  const s = getState();
  return Object.values(s.kanji).filter(k => k.learned).length;
}

// ─── 인벤토리 ────────────────────────────────────────────────

export function addToInventory(item) {
  const s = getState();
  const existing = s.inventory.find(i => i.id === item.id);
  if (existing) {
    existing.count += (item.count || 1);
  } else {
    s.inventory.push({ ...item, count: item.count || 1 });
  }
  save();
}

export function removeFromInventory(itemId) {
  const s = getState();
  const idx = s.inventory.findIndex(i => i.id === itemId);
  if (idx === -1) return false;
  if (s.inventory[idx].count > 1) {
    s.inventory[idx].count -= 1;
  } else {
    s.inventory.splice(idx, 1);
  }
  save();
  return true;
}

// ─── 정원 ────────────────────────────────────────────────────

export function placeGardenObject(obj) {
  const s = getState();
  // 같은 위치에 이미 있는 오브젝트 제거
  s.garden.objects = s.garden.objects.filter(o => !(o.x === obj.x && o.y === obj.y));
  s.garden.objects.push({ ...obj, id: Date.now() + Math.random() });
  save();
}

export function removeGardenObject(objId) {
  const s = getState();
  s.garden.objects = s.garden.objects.filter(o => o.id !== objId);
  save();
}

// 정원 단계 계산
export function getGardenStage() {
  const learned = getLearnedCount();
  if (learned >= 100) return 7;
  if (learned >= 50)  return 6;
  if (learned >= 30)  return 5;
  if (learned >= 20)  return 4;
  if (learned >= 10)  return 3;
  if (learned >= 5)   return 2;
  return 1;
}

// ─── 레벨 정보 ───────────────────────────────────────────────

const LEVEL_NAMES = [
  '', '새싹', '정원사', '견습 정원사', '숙련 정원사', '정원 마스터',
  '꽃의 수호자', '한자 장인', '정원 현인', '한자 달인', '전설의 정원사'
];

export function getLevelName(level) {
  return LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)] || `Lv.${level}`;
}

export function getXPForNextLevel(level) {
  return level * 100;
}
