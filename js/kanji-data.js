// kanji-data.js — 100개 기초 한자 데이터
// 음과 뜻은 한국어 교육용 한자 기준

const KANJI_DATA = [
  // ─── 숫자 ───
  { id: "一", character: "一", reading: "일", meaning: "하나", difficulty: 1, exampleWords: ["一日", "一人"] },
  { id: "二", character: "二", reading: "이", meaning: "둘", difficulty: 1, exampleWords: ["二月", "二人"] },
  { id: "三", character: "三", reading: "삼", meaning: "셋", difficulty: 1, exampleWords: ["三月", "三人"] },
  { id: "四", character: "四", reading: "사", meaning: "넷", difficulty: 1, exampleWords: ["四月", "四方"] },
  { id: "五", character: "五", reading: "오", meaning: "다섯", difficulty: 1, exampleWords: ["五月", "五色"] },
  { id: "六", character: "六", reading: "육", meaning: "여섯", difficulty: 1, exampleWords: ["六月", "六百"] },
  { id: "七", character: "七", reading: "칠", meaning: "일곱", difficulty: 1, exampleWords: ["七月", "七色"] },
  { id: "八", character: "八", reading: "팔", meaning: "여덟", difficulty: 1, exampleWords: ["八月", "八方"] },
  { id: "九", character: "九", reading: "구", meaning: "아홉", difficulty: 1, exampleWords: ["九月", "九九"] },
  { id: "十", character: "十", reading: "십", meaning: "열", difficulty: 1, exampleWords: ["十月", "十年"] },
  { id: "百", character: "百", reading: "백", meaning: "백", difficulty: 1, exampleWords: ["百年", "百方"] },
  { id: "千", character: "千", reading: "천", meaning: "천", difficulty: 1, exampleWords: ["千年", "千里"] },
  { id: "萬", character: "萬", reading: "만", meaning: "일만", difficulty: 2, exampleWords: ["萬年", "萬能"] },

  // ─── 자연 ───
  { id: "日", character: "日", reading: "일", meaning: "날, 해", difficulty: 1, exampleWords: ["日月", "日記"] },
  { id: "月", character: "月", reading: "월", meaning: "달", difficulty: 1, exampleWords: ["月光", "月曜"] },
  { id: "火", character: "火", reading: "화", meaning: "불", difficulty: 1, exampleWords: ["火山", "火曜"] },
  { id: "水", character: "水", reading: "수", meaning: "물", difficulty: 1, exampleWords: ["水泳", "水曜"] },
  { id: "木", character: "木", reading: "목", meaning: "나무", difficulty: 1, exampleWords: ["木曜", "木材"] },
  { id: "金", character: "金", reading: "금", meaning: "쇠, 금", difficulty: 1, exampleWords: ["金曜", "金色"] },
  { id: "土", character: "土", reading: "토", meaning: "흙", difficulty: 1, exampleWords: ["土曜", "土地"] },
  { id: "山", character: "山", reading: "산", meaning: "산", difficulty: 1, exampleWords: ["山山", "山水"] },
  { id: "川", character: "川", reading: "천", meaning: "내, 강", difficulty: 1, exampleWords: ["川변", "小川"] },
  { id: "天", character: "天", reading: "천", meaning: "하늘", difficulty: 1, exampleWords: ["天國", "天氣"] },
  { id: "地", character: "地", reading: "지", meaning: "땅", difficulty: 1, exampleWords: ["地球", "地圖"] },
  { id: "花", character: "花", reading: "화", meaning: "꽃", difficulty: 1, exampleWords: ["花草", "花瓶"] },
  { id: "草", character: "草", reading: "초", meaning: "풀", difficulty: 1, exampleWords: ["草原", "花草"] },
  { id: "竹", character: "竹", reading: "죽", meaning: "대나무", difficulty: 2, exampleWords: ["竹林", "竹刀"] },
  { id: "石", character: "石", reading: "석", meaning: "돌", difficulty: 1, exampleWords: ["石橋", "石山"] },
  { id: "風", character: "風", reading: "풍", meaning: "바람", difficulty: 2, exampleWords: ["風景", "風速"] },
  { id: "雨", character: "雨", reading: "우", meaning: "비", difficulty: 1, exampleWords: ["雨天", "大雨"] },
  { id: "雪", character: "雪", reading: "설", meaning: "눈", difficulty: 2, exampleWords: ["雪山", "雪花"] },
  { id: "雲", character: "雲", reading: "운", meaning: "구름", difficulty: 2, exampleWords: ["雲海", "白雲"] },

  // ─── 방향/크기 ───
  { id: "大", character: "大", reading: "대", meaning: "크다", difficulty: 1, exampleWords: ["大學", "大人"] },
  { id: "小", character: "小", reading: "소", meaning: "작다", difficulty: 1, exampleWords: ["小學", "小人"] },
  { id: "上", character: "上", reading: "상", meaning: "위", difficulty: 1, exampleWords: ["上下", "上手"] },
  { id: "下", character: "下", reading: "하", meaning: "아래", difficulty: 1, exampleWords: ["下水", "上下"] },
  { id: "中", character: "中", reading: "중", meaning: "가운데", difficulty: 1, exampleWords: ["中學", "中心"] },
  { id: "東", character: "東", reading: "동", meaning: "동쪽", difficulty: 1, exampleWords: ["東方", "東山"] },
  { id: "西", character: "西", reading: "서", meaning: "서쪽", difficulty: 1, exampleWords: ["西方", "東西"] },
  { id: "南", character: "南", reading: "남", meaning: "남쪽", difficulty: 1, exampleWords: ["南北", "南山"] },
  { id: "北", character: "北", reading: "북", meaning: "북쪽", difficulty: 1, exampleWords: ["南北", "北方"] },
  { id: "左", character: "左", reading: "좌", meaning: "왼쪽", difficulty: 2, exampleWords: ["左右", "左手"] },
  { id: "右", character: "右", reading: "우", meaning: "오른쪽", difficulty: 2, exampleWords: ["左右", "右手"] },
  { id: "前", character: "前", reading: "전", meaning: "앞", difficulty: 2, exampleWords: ["前後", "前進"] },
  { id: "後", character: "後", reading: "후", meaning: "뒤", difficulty: 2, exampleWords: ["前後", "後退"] },
  { id: "外", character: "外", reading: "외", meaning: "바깥", difficulty: 2, exampleWords: ["外出", "外國"] },
  { id: "內", character: "內", reading: "내", meaning: "안", difficulty: 2, exampleWords: ["內外", "內心"] },

  // ─── 사람 ───
  { id: "人", character: "人", reading: "인", meaning: "사람", difficulty: 1, exampleWords: ["人間", "人口"] },
  { id: "男", character: "男", reading: "남", meaning: "남자", difficulty: 1, exampleWords: ["男女", "男子"] },
  { id: "女", character: "女", reading: "여", meaning: "여자", difficulty: 1, exampleWords: ["男女", "女子"] },
  { id: "子", character: "子", reading: "자", meaning: "아이", difficulty: 1, exampleWords: ["子女", "男子"] },
  { id: "父", character: "父", reading: "부", meaning: "아버지", difficulty: 1, exampleWords: ["父母", "父子"] },
  { id: "母", character: "母", reading: "모", meaning: "어머니", difficulty: 1, exampleWords: ["父母", "母子"] },
  { id: "兄", character: "兄", reading: "형", meaning: "형, 오빠", difficulty: 1, exampleWords: ["兄弟", "兄妹"] },
  { id: "弟", character: "弟", reading: "제", meaning: "남동생", difficulty: 2, exampleWords: ["兄弟", "弟子"] },
  { id: "友", character: "友", reading: "우", meaning: "친구", difficulty: 2, exampleWords: ["友人", "友好"] },
  { id: "王", character: "王", reading: "왕", meaning: "임금", difficulty: 1, exampleWords: ["王國", "王子"] },

  // ─── 학교/학습 ───
  { id: "學", character: "學", reading: "학", meaning: "배우다", difficulty: 1, exampleWords: ["學校", "學生"] },
  { id: "校", character: "校", reading: "교", meaning: "학교", difficulty: 1, exampleWords: ["學校", "校長"] },
  { id: "生", character: "生", reading: "생", meaning: "살다, 낳다", difficulty: 1, exampleWords: ["學生", "生活"] },
  { id: "先", character: "先", reading: "선", meaning: "먼저", difficulty: 1, exampleWords: ["先生", "先後"] },
  { id: "本", character: "本", reading: "본", meaning: "근본", difficulty: 1, exampleWords: ["日本", "本來"] },
  { id: "文", character: "文", reading: "문", meaning: "글", difficulty: 1, exampleWords: ["文字", "文學"] },
  { id: "字", character: "字", reading: "자", meaning: "글자", difficulty: 1, exampleWords: ["文字", "漢字"] },
  { id: "書", character: "書", reading: "서", meaning: "글씨, 책", difficulty: 2, exampleWords: ["書記", "書道"] },
  { id: "語", character: "語", reading: "어", meaning: "말, 언어", difficulty: 2, exampleWords: ["國語", "語學"] },
  { id: "算", character: "算", reading: "산", meaning: "셈하다", difficulty: 2, exampleWords: ["算數", "計算"] },

  // ─── 시간 ───
  { id: "年", character: "年", reading: "년", meaning: "해, 년", difficulty: 1, exampleWords: ["年度", "年月"] },
  { id: "時", character: "時", reading: "시", meaning: "때, 시각", difficulty: 1, exampleWords: ["時間", "時代"] },
  { id: "間", character: "間", reading: "간", meaning: "사이", difficulty: 1, exampleWords: ["時間", "人間"] },
  { id: "今", character: "今", reading: "금", meaning: "지금, 이제", difficulty: 1, exampleWords: ["今日", "今月"] },
  { id: "古", character: "古", reading: "고", meaning: "옛날", difficulty: 1, exampleWords: ["古今", "古代"] },
  { id: "新", character: "新", reading: "신", meaning: "새롭다", difficulty: 2, exampleWords: ["新年", "新生"] },
  { id: "春", character: "春", reading: "춘", meaning: "봄", difficulty: 1, exampleWords: ["春夏", "春天"] },
  { id: "夏", character: "夏", reading: "하", meaning: "여름", difficulty: 1, exampleWords: ["夏季", "春夏"] },
  { id: "秋", character: "秋", reading: "추", meaning: "가을", difficulty: 1, exampleWords: ["秋分", "春秋"] },
  { id: "冬", character: "冬", reading: "동", meaning: "겨울", difficulty: 1, exampleWords: ["冬季", "冬天"] },

  // ─── 신체 ───
  { id: "手", character: "手", reading: "수", meaning: "손", difficulty: 1, exampleWords: ["手足", "左手"] },
  { id: "足", character: "足", reading: "족", meaning: "발", difficulty: 1, exampleWords: ["手足", "足球"] },
  { id: "耳", character: "耳", reading: "이", meaning: "귀", difficulty: 2, exampleWords: ["耳目", "耳鼻"] },
  { id: "目", character: "目", reading: "목", meaning: "눈", difficulty: 1, exampleWords: ["目的", "耳目"] },
  { id: "口", character: "口", reading: "구", meaning: "입", difficulty: 1, exampleWords: ["人口", "口語"] },
  { id: "心", character: "心", reading: "심", meaning: "마음", difficulty: 1, exampleWords: ["中心", "心理"] },

  // ─── 동/식물 ───
  { id: "犬", character: "犬", reading: "견", meaning: "개", difficulty: 2, exampleWords: ["犬馬", "愛犬"] },
  { id: "牛", character: "牛", reading: "우", meaning: "소", difficulty: 2, exampleWords: ["牛肉", "牛馬"] },
  { id: "馬", character: "馬", reading: "마", meaning: "말", difficulty: 2, exampleWords: ["馬車", "馬力"] },
  { id: "魚", character: "魚", reading: "어", meaning: "물고기", difficulty: 2, exampleWords: ["魚肉", "金魚"] },
  { id: "鳥", character: "鳥", reading: "조", meaning: "새", difficulty: 2, exampleWords: ["鳥類", "白鳥"] },
  { id: "林", character: "林", reading: "림", meaning: "수풀", difficulty: 2, exampleWords: ["林業", "竹林"] },
  { id: "森", character: "森", reading: "삼", meaning: "숲", difficulty: 2, exampleWords: ["森林", "森々"] },

  // ─── 생활 ───
  { id: "家", character: "家", reading: "가", meaning: "집", difficulty: 1, exampleWords: ["家族", "家庭"] },
  { id: "門", character: "門", reading: "문", meaning: "문", difficulty: 1, exampleWords: ["門前", "入門"] },
  { id: "食", character: "食", reading: "식", meaning: "먹다", difficulty: 1, exampleWords: ["食事", "食堂"] },
  { id: "力", character: "力", reading: "력", meaning: "힘", difficulty: 1, exampleWords: ["力量", "水力"] },
  { id: "色", character: "色", reading: "색", meaning: "빛깔", difficulty: 1, exampleWords: ["色彩", "白色"] },
  { id: "白", character: "白", reading: "백", meaning: "희다", difficulty: 1, exampleWords: ["白色", "白雪"] },
  { id: "黑", character: "黑", reading: "흑", meaning: "검다", difficulty: 2, exampleWords: ["黑白", "黑色"] },
  { id: "青", character: "青", reading: "청", meaning: "파랗다", difficulty: 1, exampleWords: ["青年", "青天"] },
  { id: "紅", character: "紅", reading: "홍", meaning: "붉다", difficulty: 2, exampleWords: ["紅色", "紅花"] },
  { id: "長", character: "長", reading: "장", meaning: "길다", difficulty: 1, exampleWords: ["長短", "校長"] },
  { id: "短", character: "短", reading: "단", meaning: "짧다", difficulty: 2, exampleWords: ["長短", "短時"] },
  { id: "國", character: "國", reading: "국", meaning: "나라", difficulty: 1, exampleWords: ["國家", "國語"] },
  { id: "語", character: "語", reading: "어", meaning: "말", difficulty: 1, exampleWords: ["國語", "外國語"] },
  { id: "正", character: "正", reading: "정", meaning: "바르다", difficulty: 1, exampleWords: ["正直", "正答"] },
];

// 중복 제거 (id 기준)
const KANJI_MAP = {};
KANJI_DATA.forEach(k => { KANJI_MAP[k.id] = k; });
const UNIQUE_KANJI = Object.values(KANJI_MAP);

// 오답용 선택지 풀 (읽기/뜻 쌍)
const WRONG_POOL = [
  { reading: "일", meaning: "하나" },
  { reading: "이", meaning: "둘" },
  { reading: "삼", meaning: "셋" },
  { reading: "사", meaning: "넷" },
  { reading: "오", meaning: "다섯" },
  { reading: "화", meaning: "불" },
  { reading: "수", meaning: "물" },
  { reading: "목", meaning: "나무" },
  { reading: "금", meaning: "쇠" },
  { reading: "토", meaning: "흙" },
  { reading: "산", meaning: "산" },
  { reading: "천", meaning: "하늘" },
  { reading: "지", meaning: "땅" },
  { reading: "대", meaning: "크다" },
  { reading: "소", meaning: "작다" },
  { reading: "인", meaning: "사람" },
  { reading: "학", meaning: "배우다" },
  { reading: "생", meaning: "살다" },
  { reading: "년", meaning: "해" },
  { reading: "동", meaning: "동쪽" },
  { reading: "서", meaning: "서쪽" },
  { reading: "남", meaning: "남쪽" },
  { reading: "북", meaning: "북쪽" },
  { reading: "부", meaning: "아버지" },
  { reading: "모", meaning: "어머니" },
  { reading: "형", meaning: "형" },
  { reading: "왕", meaning: "임금" },
  { reading: "시", meaning: "때" },
  { reading: "심", meaning: "마음" },
  { reading: "색", meaning: "빛깔" },
  { reading: "백", meaning: "희다" },
  { reading: "청", meaning: "파랗다" },
  { reading: "춘", meaning: "봄" },
  { reading: "하", meaning: "여름" },
  { reading: "추", meaning: "가을" },
  { reading: "장", meaning: "길다" },
  { reading: "국", meaning: "나라" },
];

/**
 * 4지선다 오답 3개 생성
 * @param {string} correctReading - 정답 읽기
 * @param {string} correctMeaning - 정답 뜻
 * @returns {Array} 오답 3개 배열
 */
function generateWrongOptions(correctReading, correctMeaning) {
  const filtered = WRONG_POOL.filter(
    w => !(w.reading === correctReading && w.meaning === correctMeaning)
  );
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export { UNIQUE_KANJI, KANJI_MAP, generateWrongOptions };
