/**
 * 게임 데이터 단일 소스
 * handlers.ts와 constants.ts에 중복되던 데이터를 여기서 통합 관리
 */

// ===== 마을 레벨 요구사항 =====
export const VILLAGE_LEVEL_REQS: number[] = [
  1, 10, 20, 30, 40, 50, 60, 70, 80, 90,
  100, 110, 120, 130, 140, 150, 160, 170, 180, 190,
];

// ===== 보스 데이터 =====
export interface BossDataCore {
  villageId: number;
  name: string;
  emoji: string;
  title: string;
  quizRange: [number, number];
}

export const BOSS_LIST: BossDataCore[] = [
  { villageId: 1, name: '타락한 뱀', emoji: '🐍', title: '에덴의 지배자', quizRange: [1, 1] },
  { villageId: 2, name: '여왕벌레 플로라', emoji: '🦟', title: '동산의 포식자', quizRange: [1, 2] },
  { villageId: 3, name: '그림자 속삭이는 자', emoji: '👤', title: '유혹의 화신', quizRange: [1, 3] },
  { villageId: 4, name: '타락천사 아자젤', emoji: '😈', title: '실락원의 군주', quizRange: [1, 5] },
  { villageId: 5, name: '사막의 폭군 스콜피온', emoji: '🦂', title: '가시 사막의 왕', quizRange: [1, 7] },
  { villageId: 6, name: '교만의 거인 니므롯', emoji: '🗿', title: '바벨의 망령', quizRange: [1, 8] },
  { villageId: 7, name: '유황의 화신', emoji: '🌋', title: '소돔의 불꽃', quizRange: [1, 10] },
  { villageId: 8, name: '심연의 리바이어던', emoji: '🐋', title: '대홍수의 괴수', quizRange: [1, 12] },
  { villageId: 9, name: '광야의 시험자', emoji: '👁️', title: '유혹의 그림자', quizRange: [1, 13] },
  { villageId: 10, name: '독의 어머니 마라', emoji: '🧪', title: '저주의 근원', quizRange: [1, 15] },
  { villageId: 11, name: '금송아지의 우상', emoji: '🐂', title: '거짓 신', quizRange: [1, 17] },
  { villageId: 12, name: '여리고의 철벽장군', emoji: '🛡️', title: '난공불락의 수호자', quizRange: [1, 18] },
  { villageId: 13, name: '공포의 군주 골리앗', emoji: '⚔️', title: '어둠의 거인', quizRange: [1, 20] },
  { villageId: 14, name: '배신자의 그림자', emoji: '💰', title: '은 서른 냥의 유혹', quizRange: [1, 22] },
  { villageId: 15, name: '묵시록의 네 기사', emoji: '🏇', title: '종말의 선봉대', quizRange: [1, 24] },
  { villageId: 16, name: '용광로의 불꽃 드래곤', emoji: '🐉', title: '혼돈의 용', quizRange: [1, 25] },
  { villageId: 17, name: '하늘의 방해자', emoji: '🦅', title: '공중 권세', quizRange: [1, 27] },
  { villageId: 18, name: '거짓 왕', emoji: '🤴', title: '왕좌의 사칭자', quizRange: [1, 29] },
  { villageId: 19, name: '오염자 아바돈', emoji: '🦠', title: '멸망의 천사', quizRange: [1, 30] },
  { villageId: 20, name: '어둠의 왕', emoji: '👿', title: '모든 어둠의 근원', quizRange: [1, 32] },
];

export function getBossData(villageId: number): BossDataCore | undefined {
  return BOSS_LIST.find(b => b.villageId === villageId);
}

// ===== 마을별 몬스터 목록 =====
export const VILLAGE_MONSTERS: Record<number, { name: string; emoji: string }[]> = {
  1:  [{ name: '순한 양', emoji: '🐑' }, { name: '작은 여우', emoji: '🦊' }, { name: '들비둘기', emoji: '🕊️' }, { name: '아기 사슴', emoji: '🦌' }, { name: '들토끼', emoji: '🐇' }, { name: '꿀벌 무리', emoji: '🐝' }, { name: '에덴 거북이', emoji: '🐢' }, { name: '무화과 요정', emoji: '🧚' }, { name: '작은 뱀', emoji: '🐍' }, { name: '에덴의 수호자', emoji: '🦁' }],
  2:  [{ name: '독꽃 덩굴', emoji: '🌺' }, { name: '거대 나비', emoji: '🦋' }, { name: '화분 골렘', emoji: '🪴' }, { name: '꽃가루 정령', emoji: '🌼' }, { name: '장미 가시 마수', emoji: '🌹' }, { name: '꿀벌 여왕', emoji: '👸' }, { name: '독버섯', emoji: '🍄' }, { name: '풀숲 도마뱀', emoji: '🦎' }, { name: '정원 지킴이', emoji: '🧑‍🌾' }, { name: '거대 무당벌레', emoji: '🐞' }],
  3:  [{ name: '그림자 늑대', emoji: '🐺' }, { name: '속삭이는 뱀', emoji: '🐍' }, { name: '숲 정령', emoji: '🧚' }, { name: '이끼 골렘', emoji: '🗿' }, { name: '독거미', emoji: '🕷️' }, { name: '올빼미 현자', emoji: '🦉' }, { name: '나무 요정', emoji: '🌳' }, { name: '야생 멧돼지', emoji: '🐗' }, { name: '덩굴 포식자', emoji: '🌿' }, { name: '숲의 지배자', emoji: '🐻' }],
  4:  [{ name: '방황하는 영혼', emoji: '👻' }, { name: '안개 골렘', emoji: '🗿' }, { name: '가시 덩굴 괴물', emoji: '🌿' }, { name: '타락한 천사', emoji: '😈' }, { name: '회색 늑대', emoji: '🐺' }, { name: '폐허의 까마귀', emoji: '🦅' }, { name: '절망의 그림자', emoji: '🖤' }, { name: '잃어버린 기사', emoji: '⚔️' }, { name: '안개 마녀', emoji: '🧙‍♀️' }, { name: '실락원의 파수꾼', emoji: '💀' }],
  5:  [{ name: '가시 전갈', emoji: '🦂' }, { name: '바위 거인', emoji: '🪨' }, { name: '사막 독수리', emoji: '🦅' }, { name: '모래 지렁이', emoji: '🪱' }, { name: '선인장 마수', emoji: '🌵' }, { name: '사막 도마뱀', emoji: '🦎' }, { name: '모래폭풍 정령', emoji: '🌪️' }, { name: '가시 하이에나', emoji: '🐕' }, { name: '바위 갑충', emoji: '🪲' }, { name: '가시 왕전갈', emoji: '🦂' }],
  6:  [{ name: '석상 수호자', emoji: '🗽' }, { name: '파편 마법사', emoji: '🧙' }, { name: '고대 기계병', emoji: '🤖' }, { name: '부서진 골렘', emoji: '🗿' }, { name: '유적 탐험가', emoji: '🏴‍☠️' }, { name: '바벨 주술사', emoji: '🧛' }, { name: '돌 독수리', emoji: '🦅' }, { name: '고대 미라', emoji: '🧟' }, { name: '파편 거미', emoji: '🕷️' }, { name: '바벨의 수호신', emoji: '⚡' }],
  7:  [{ name: '화염 임프', emoji: '😈' }, { name: '용암 슬라임', emoji: '🟠' }, { name: '불꽃 기사', emoji: '🔥' }, { name: '유황 박쥐', emoji: '🦇' }, { name: '재의 골렘', emoji: '🗿' }, { name: '화염 도마뱀', emoji: '🦎' }, { name: '소돔의 망령', emoji: '👻' }, { name: '불새', emoji: '🐦‍🔥' }, { name: '용암 거북', emoji: '🐢' }, { name: '유황불 악마', emoji: '👿' }],
  8:  [{ name: '심해어', emoji: '🐟' }, { name: '늪지 히드라', emoji: '🐉' }, { name: '해초 정령', emoji: '🦑' }, { name: '거대 악어', emoji: '🐊' }, { name: '물의 정령', emoji: '💧' }, { name: '해파리 마수', emoji: '🪼' }, { name: '심해 상어', emoji: '🦈' }, { name: '늪지 거머리', emoji: '🪱' }, { name: '산호 골렘', emoji: '🪸' }, { name: '리바이어던', emoji: '🐋' }],
  9:  [{ name: '신기루 악마', emoji: '🃏' }, { name: '모래 폭풍 마수', emoji: '🌪️' }, { name: '광야의 사자', emoji: '🦁' }, { name: '유혹의 환영', emoji: '🎭' }, { name: '메뚜기 떼', emoji: '🦗' }, { name: '광야 방랑자', emoji: '🧙' }, { name: '태양 전갈', emoji: '🦂' }, { name: '열사병 정령', emoji: '☀️' }, { name: '광야 독사', emoji: '🐍' }, { name: '시험의 대악마', emoji: '😈' }],
  10: [{ name: '독안개 요정', emoji: '🧝' }, { name: '부식의 슬라임', emoji: '🟤' }, { name: '저주술사', emoji: '🧛' }, { name: '독수 두꺼비', emoji: '🐸' }, { name: '썩은 나무 정령', emoji: '🪵' }, { name: '독구름 박쥐', emoji: '🦇' }, { name: '저주받은 기사', emoji: '⚔️' }, { name: '독꽃 여왕', emoji: '🌺' }, { name: '역병 쥐떼', emoji: '🐀' }, { name: '마라의 저주', emoji: '💀' }],
  11: [{ name: '불의 천사', emoji: '👼' }, { name: '번개 골렘', emoji: '⚡' }, { name: '시내산 수호자', emoji: '🗡️' }, { name: '화산 정령', emoji: '🌋' }, { name: '불꽃 독수리', emoji: '🦅' }, { name: '용암 거인', emoji: '🗿' }, { name: '번개 늑대', emoji: '🐺' }, { name: '화염 뱀', emoji: '🐍' }, { name: '천둥 곰', emoji: '🐻' }, { name: '시내산의 대천사', emoji: '😇' }],
  12: [{ name: '성벽 파수꾼', emoji: '💂' }, { name: '공성 골렘', emoji: '🏗️' }, { name: '여리고 장군', emoji: '⚔️' }, { name: '성벽 궁수', emoji: '🏹' }, { name: '돌격 기사', emoji: '🐎' }, { name: '성문 수호자', emoji: '🛡️' }, { name: '투석기 병사', emoji: '🪨' }, { name: '성벽 마법사', emoji: '🧙' }, { name: '철갑 전사', emoji: '🦾' }, { name: '여리고 대장군', emoji: '👑' }],
  13: [{ name: '그림자 암살자', emoji: '🥷' }, { name: '침묵의 거미', emoji: '🕷️' }, { name: '어둠의 기사', emoji: '🖤' }, { name: '그림자 박쥐', emoji: '🦇' }, { name: '침묵의 사신', emoji: '💀' }, { name: '어둠 늑대', emoji: '🐺' }, { name: '그림자 마법사', emoji: '🧙' }, { name: '공허의 정령', emoji: '👁️' }, { name: '밤그림자 뱀', emoji: '🐍' }, { name: '골짜기의 군주', emoji: '😈' }],
  14: [{ name: '밤의 감시자', emoji: '🦉' }, { name: '배반의 환영', emoji: '🎭' }, { name: '고뇌의 그림자', emoji: '😱' }, { name: '올리브 수호자', emoji: '🌿' }, { name: '달빛 늑대', emoji: '🐺' }, { name: '슬픔의 정령', emoji: '💧' }, { name: '밤의 전사', emoji: '⚔️' }, { name: '배반자의 망령', emoji: '👻' }, { name: '월광 마법사', emoji: '🌙' }, { name: '게세마네의 시련', emoji: '⚡' }],
  15: [{ name: '재앙의 기수', emoji: '🏇' }, { name: '역병의 왕', emoji: '👑' }, { name: '전쟁 마수', emoji: '🐲' }, { name: '기근의 악마', emoji: '💀' }, { name: '죽음의 기수', emoji: '🏴' }, { name: '지진 골렘', emoji: '🌍' }, { name: '화산 악마', emoji: '🌋' }, { name: '혼돈의 기사', emoji: '⚔️' }, { name: '파멸의 마법사', emoji: '🧙' }, { name: '종말의 용', emoji: '🐉' }],
  16: [{ name: '강철 대장장이', emoji: '⚒️' }, { name: '용광로 수호자', emoji: '🔥' }, { name: '정화의 불꽃', emoji: '✨' }, { name: '용암 대장장이', emoji: '🔨' }, { name: '강철 골렘', emoji: '🤖' }, { name: '불꽃 연금술사', emoji: '⚗️' }, { name: '정화의 봉황', emoji: '🐦‍🔥' }, { name: '용광로 거인', emoji: '🗿' }, { name: '금속 전갈', emoji: '🦂' }, { name: '정화의 대장장이', emoji: '👑' }],
  17: [{ name: '구름 수호자', emoji: '🌤️' }, { name: '천공의 독수리', emoji: '🦅' }, { name: '바람의 정령', emoji: '💨' }, { name: '하늘 고래', emoji: '🐋' }, { name: '구름 기사', emoji: '⚔️' }, { name: '천공 마법사', emoji: '🧙' }, { name: '무지개 뱀', emoji: '🌈' }, { name: '폭풍 정령', emoji: '🌩️' }, { name: '별빛 나비', emoji: '🦋' }, { name: '천공의 대수호자', emoji: '😇' }],
  18: [{ name: '왕국 근위대', emoji: '🛡️' }, { name: '천년의 기사', emoji: '⚔️' }, { name: '왕좌의 수호자', emoji: '👑' }, { name: '성기사', emoji: '🗡️' }, { name: '왕실 마법사', emoji: '🧙' }, { name: '금빛 사자', emoji: '🦁' }, { name: '왕국 궁수대', emoji: '🏹' }, { name: '철벽 방패병', emoji: '🛡️' }, { name: '왕의 그림자', emoji: '🥷' }, { name: '천년왕국의 왕', emoji: '👑' }],
  19: [{ name: '생명수 정령', emoji: '💎' }, { name: '수정 거인', emoji: '🔮' }, { name: '빛의 뱀', emoji: '🌈' }, { name: '생명수 해파리', emoji: '🪼' }, { name: '수정 나비', emoji: '🦋' }, { name: '빛의 거북', emoji: '🐢' }, { name: '순수의 정령', emoji: '✨' }, { name: '거룩한 악어', emoji: '🐊' }, { name: '수정 독수리', emoji: '🦅' }, { name: '생명수의 수호자', emoji: '😇' }],
  20: [{ name: '대천사', emoji: '😇' }, { name: '세라핌', emoji: '🕊️' }, { name: '최후의 심판자', emoji: '⚖️' }, { name: '케루빔', emoji: '👼' }, { name: '천상의 기사', emoji: '⚔️' }, { name: '빛의 전사', emoji: '✨' }, { name: '천상의 사자', emoji: '🦁' }, { name: '영광의 독수리', emoji: '🦅' }, { name: '천국의 문지기', emoji: '🗝️' }, { name: '하나님의 전사', emoji: '🌟' }],
};
