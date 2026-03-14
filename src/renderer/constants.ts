export const CHARACTER_INFO: Record<number, { name: string; emoji: string; image?: string; description: string }> = {
  1: { name: '멋진 전사', emoji: '🗡️', description: '용감하고 멋진 남성 전사' },
  2: { name: '아름다운 전사', emoji: '⚔️', description: '강하고 아름다운 여성 전사' },
  3: { name: '우스꽝스러운 모험가', emoji: '🤡', description: '엉뚱하지만 매력적인 캐릭터' },
  4: { name: '토끼 전사', emoji: '🐰', description: '귀엽지만 강한 토끼 전사' },
  5: { name: '피크민 용사', emoji: '🌱', image: 'assets/pikmin.jpg', description: '작지만 뭉치면 무적인 피크민 전사' },
  6: { name: '우산 햄스터', emoji: '🐹', description: '우산을 쓴 귀여운 햄스터 모험가' },
};

export const RARITY_COLORS: Record<string, string> = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  mythic: '#ff6f00',
};

export const RARITY_NAMES: Record<string, string> = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  epic: '전설',
  mythic: '신화',
};

export const ITEM_TYPE_NAMES: Record<string, string> = {
  weapon: '무기',
  belt: '허리',
  chest: '가슴',
  shoes: '신발',
  shield: '방패',
  helmet: '투구',
};

export const ITEM_TYPE_EMOJI: Record<string, string> = {
  weapon: '🗡️',
  belt: '🪢',
  chest: '🛡️',
  shoes: '👢',
  shield: '🛡️',
  helmet: '⛑️',
};

export interface Village {
  id: number;
  name: string;
  description: string;
  levelReq: number;
  emoji: string;
  monsters: { name: string; emoji: string }[];
}

export const VILLAGES: Village[] = [
  {
    id: 1, name: '에덴', emoji: '🌳',
    description: '평화로운 모험의 시작점. 순한 동물들이 살고 있다.',
    levelReq: 1,
    monsters: [
      { name: '순한 양', emoji: '🐑' }, { name: '작은 여우', emoji: '🦊' }, { name: '들비둘기', emoji: '🕊️' },
      { name: '아기 사슴', emoji: '🦌' }, { name: '들토끼', emoji: '🐇' }, { name: '꿀벌 무리', emoji: '🐝' },
      { name: '에덴 거북이', emoji: '🐢' }, { name: '무화과 요정', emoji: '🧚' }, { name: '작은 뱀', emoji: '🐍' },
      { name: '에덴의 수호자', emoji: '🦁' },
    ],
  },
  {
    id: 2, name: '기쁨의 동산', emoji: '🌸',
    description: '꽃이 만발한 아름다운 정원. 곤충과 작은 짐승이 출몰한다.',
    levelReq: 10,
    monsters: [
      { name: '독꽃 덩굴', emoji: '🌺' }, { name: '거대 나비', emoji: '🦋' }, { name: '화분 골렘', emoji: '🪴' },
      { name: '꽃가루 정령', emoji: '🌼' }, { name: '장미 가시 마수', emoji: '🌹' }, { name: '꿀벌 여왕', emoji: '👸' },
      { name: '독버섯', emoji: '🍄' }, { name: '풀숲 도마뱀', emoji: '🦎' }, { name: '정원 지킴이', emoji: '🧑‍🌾' },
      { name: '거대 무당벌레', emoji: '🐞' },
    ],
  },
  {
    id: 3, name: '속삭임의 숲', emoji: '🌲',
    description: '어둡고 깊은 숲. 유혹의 속삭임이 들려온다.',
    levelReq: 20,
    monsters: [
      { name: '그림자 늑대', emoji: '🐺' }, { name: '속삭이는 뱀', emoji: '🐍' }, { name: '숲 정령', emoji: '🧚' },
      { name: '이끼 골렘', emoji: '🗿' }, { name: '독거미', emoji: '🕷️' }, { name: '올빼미 현자', emoji: '🦉' },
      { name: '나무 요정', emoji: '🌳' }, { name: '야생 멧돼지', emoji: '🐗' }, { name: '덩굴 포식자', emoji: '🌿' },
      { name: '숲의 지배자', emoji: '🐻' },
    ],
  },
  {
    id: 4, name: '실락원', emoji: '🌫️',
    description: '안개 낀 황량한 대지. 추방된 자들의 흔적이 남아있다.',
    levelReq: 30,
    monsters: [
      { name: '방황하는 영혼', emoji: '👻' }, { name: '안개 골렘', emoji: '🗿' }, { name: '가시 덩굴 괴물', emoji: '🌿' },
      { name: '타락한 천사', emoji: '😈' }, { name: '회색 늑대', emoji: '🐺' }, { name: '폐허의 까마귀', emoji: '🦅' },
      { name: '절망의 그림자', emoji: '🖤' }, { name: '잃어버린 기사', emoji: '⚔️' }, { name: '안개 마녀', emoji: '🧙‍♀️' },
      { name: '실락원의 파수꾼', emoji: '💀' },
    ],
  },
  {
    id: 5, name: '가시의 땅', emoji: '🏜️',
    description: '가시덤불과 험한 바위가 가득한 척박한 땅.',
    levelReq: 40,
    monsters: [
      { name: '가시 전갈', emoji: '🦂' }, { name: '바위 거인', emoji: '🪨' }, { name: '사막 독수리', emoji: '🦅' },
      { name: '모래 지렁이', emoji: '🪱' }, { name: '선인장 마수', emoji: '🌵' }, { name: '사막 도마뱀', emoji: '🦎' },
      { name: '모래폭풍 정령', emoji: '🌪️' }, { name: '가시 하이에나', emoji: '🐕' }, { name: '바위 갑충', emoji: '🪲' },
      { name: '가시 왕전갈', emoji: '🦂' },
    ],
  },
  {
    id: 6, name: '바벨의 파편', emoji: '🏛️',
    description: '무너진 거대한 탑의 잔해. 고대 병기가 배회한다.',
    levelReq: 50,
    monsters: [
      { name: '석상 수호자', emoji: '🗽' }, { name: '파편 마법사', emoji: '🧙' }, { name: '고대 기계병', emoji: '🤖' },
      { name: '부서진 골렘', emoji: '🗿' }, { name: '유적 탐험가', emoji: '🏴‍☠️' }, { name: '바벨 주술사', emoji: '🧛' },
      { name: '돌 독수리', emoji: '🦅' }, { name: '고대 미라', emoji: '🧟' }, { name: '파편 거미', emoji: '🕷️' },
      { name: '바벨의 수호신', emoji: '⚡' },
    ],
  },
  {
    id: 7, name: '소돔의 잿더미', emoji: '🔥',
    description: '유황불로 멸망한 도시의 잔재. 열기가 피어오른다.',
    levelReq: 60,
    monsters: [
      { name: '화염 임프', emoji: '😈' }, { name: '용암 슬라임', emoji: '🟠' }, { name: '불꽃 기사', emoji: '🔥' },
      { name: '유황 박쥐', emoji: '🦇' }, { name: '재의 골렘', emoji: '🗿' }, { name: '화염 도마뱀', emoji: '🦎' },
      { name: '소돔의 망령', emoji: '👻' }, { name: '불새', emoji: '🐦‍🔥' }, { name: '용암 거북', emoji: '🐢' },
      { name: '유황불 악마', emoji: '👿' },
    ],
  },
  {
    id: 8, name: '노아의 심연', emoji: '🌊',
    description: '대홍수의 흔적이 남은 깊은 늪지와 수중 동굴.',
    levelReq: 70,
    monsters: [
      { name: '심해어', emoji: '🐟' }, { name: '늪지 히드라', emoji: '🐉' }, { name: '해초 정령', emoji: '🦑' },
      { name: '거대 악어', emoji: '🐊' }, { name: '물의 정령', emoji: '💧' }, { name: '해파리 마수', emoji: '🪼' },
      { name: '심해 상어', emoji: '🦈' }, { name: '늪지 거머리', emoji: '🪱' }, { name: '산호 골렘', emoji: '🪸' },
      { name: '리바이어던', emoji: '🐋' },
    ],
  },
  {
    id: 9, name: '시험의 광야', emoji: '☀️',
    description: '끝없이 펼쳐진 황야. 시험과 유혹이 기다린다.',
    levelReq: 80,
    monsters: [
      { name: '신기루 악마', emoji: '🃏' }, { name: '모래 폭풍 마수', emoji: '🌪️' }, { name: '광야의 사자', emoji: '🦁' },
      { name: '유혹의 환영', emoji: '🎭' }, { name: '메뚜기 떼', emoji: '🦗' }, { name: '광야 방랑자', emoji: '🧙' },
      { name: '태양 전갈', emoji: '🦂' }, { name: '열사병 정령', emoji: '☀️' }, { name: '광야 독사', emoji: '🐍' },
      { name: '시험의 대악마', emoji: '😈' },
    ],
  },
  {
    id: 10, name: '마라의 쓴 샘', emoji: '☠️',
    description: '쓰디쓴 물이 솟는 저주받은 오아시스.',
    levelReq: 90,
    monsters: [
      { name: '독안개 요정', emoji: '🧝' }, { name: '부식의 슬라임', emoji: '🟤' }, { name: '저주술사', emoji: '🧛' },
      { name: '독수 두꺼비', emoji: '🐸' }, { name: '썩은 나무 정령', emoji: '🪵' }, { name: '독구름 박쥐', emoji: '🦇' },
      { name: '저주받은 기사', emoji: '⚔️' }, { name: '독꽃 여왕', emoji: '🌺' }, { name: '역병 쥐떼', emoji: '🐀' },
      { name: '마라의 저주', emoji: '💀' },
    ],
  },
  {
    id: 11, name: '시내산의 불꽃', emoji: '⛰️',
    description: '거룩한 불이 타오르는 산. 강력한 수호자가 지키고 있다.',
    levelReq: 100,
    monsters: [
      { name: '불의 천사', emoji: '👼' }, { name: '번개 골렘', emoji: '⚡' }, { name: '시내산 수호자', emoji: '🗡️' },
      { name: '화산 정령', emoji: '🌋' }, { name: '불꽃 독수리', emoji: '🦅' }, { name: '용암 거인', emoji: '🗿' },
      { name: '번개 늑대', emoji: '🐺' }, { name: '화염 뱀', emoji: '🐍' }, { name: '천둥 곰', emoji: '🐻' },
      { name: '시내산의 대천사', emoji: '😇' },
    ],
  },
  {
    id: 12, name: '여리고의 성벽', emoji: '🏰',
    description: '난공불락의 거대한 성벽. 성벽 위에서 병사들이 지킨다.',
    levelReq: 110,
    monsters: [
      { name: '성벽 파수꾼', emoji: '💂' }, { name: '공성 골렘', emoji: '🏗️' }, { name: '여리고 장군', emoji: '⚔️' },
      { name: '성벽 궁수', emoji: '🏹' }, { name: '돌격 기사', emoji: '🐎' }, { name: '성문 수호자', emoji: '🛡️' },
      { name: '투석기 병사', emoji: '🪨' }, { name: '성벽 마법사', emoji: '🧙' }, { name: '철갑 전사', emoji: '🦾' },
      { name: '여리고 대장군', emoji: '👑' },
    ],
  },
  {
    id: 13, name: '골짜기의 침묵', emoji: '🕳️',
    description: '소리가 사라지는 어두운 골짜기. 그림자가 움직인다.',
    levelReq: 120,
    monsters: [
      { name: '그림자 암살자', emoji: '🥷' }, { name: '침묵의 거미', emoji: '🕷️' }, { name: '어둠의 기사', emoji: '🖤' },
      { name: '그림자 박쥐', emoji: '🦇' }, { name: '침묵의 사신', emoji: '💀' }, { name: '어둠 늑대', emoji: '🐺' },
      { name: '그림자 마법사', emoji: '🧙' }, { name: '공허의 정령', emoji: '👁️' }, { name: '밤그림자 뱀', emoji: '🐍' },
      { name: '골짜기의 군주', emoji: '😈' },
    ],
  },
  {
    id: 14, name: '게세마네의 밤', emoji: '🌙',
    description: '깊은 밤의 올리브 동산. 고뇌와 인내의 시험장.',
    levelReq: 130,
    monsters: [
      { name: '밤의 감시자', emoji: '🦉' }, { name: '배반의 환영', emoji: '🎭' }, { name: '고뇌의 그림자', emoji: '😱' },
      { name: '올리브 수호자', emoji: '🌿' }, { name: '달빛 늑대', emoji: '🐺' }, { name: '슬픔의 정령', emoji: '💧' },
      { name: '밤의 전사', emoji: '⚔️' }, { name: '배반자의 망령', emoji: '👻' }, { name: '월광 마법사', emoji: '🌙' },
      { name: '게세마네의 시련', emoji: '⚡' },
    ],
  },
  {
    id: 15, name: '대환난의 날', emoji: '💀',
    description: '하늘이 갈라지고 땅이 흔들리는 종말의 전장.',
    levelReq: 140,
    monsters: [
      { name: '재앙의 기수', emoji: '🏇' }, { name: '역병의 왕', emoji: '👑' }, { name: '전쟁 마수', emoji: '🐲' },
      { name: '기근의 악마', emoji: '💀' }, { name: '죽음의 기수', emoji: '🏴' }, { name: '지진 골렘', emoji: '🌍' },
      { name: '화산 악마', emoji: '🌋' }, { name: '혼돈의 기사', emoji: '⚔️' }, { name: '파멸의 마법사', emoji: '🧙' },
      { name: '종말의 용', emoji: '🐉' },
    ],
  },
  {
    id: 16, name: '정화의 용광로', emoji: '🔨',
    description: '뜨거운 용광로에서 모든 불순물이 태워진다.',
    levelReq: 150,
    monsters: [
      { name: '강철 대장장이', emoji: '⚒️' }, { name: '용광로 수호자', emoji: '🔥' }, { name: '정화의 불꽃', emoji: '✨' },
      { name: '용암 대장장이', emoji: '🔨' }, { name: '강철 골렘', emoji: '🤖' }, { name: '불꽃 연금술사', emoji: '⚗️' },
      { name: '정화의 봉황', emoji: '🐦‍🔥' }, { name: '용광로 거인', emoji: '🗿' }, { name: '금속 전갈', emoji: '🦂' },
      { name: '정화의 대장장이', emoji: '👑' },
    ],
  },
  {
    id: 17, name: '휴거의 대기소', emoji: '☁️',
    description: '신비롭고 고요한 공중 지역. 구름 위의 세계.',
    levelReq: 160,
    monsters: [
      { name: '구름 수호자', emoji: '🌤️' }, { name: '천공의 독수리', emoji: '🦅' }, { name: '바람의 정령', emoji: '💨' },
      { name: '하늘 고래', emoji: '🐋' }, { name: '구름 기사', emoji: '⚔️' }, { name: '천공 마법사', emoji: '🧙' },
      { name: '무지개 뱀', emoji: '🌈' }, { name: '폭풍 정령', emoji: '🌩️' }, { name: '별빛 나비', emoji: '🦋' },
      { name: '천공의 대수호자', emoji: '😇' },
    ],
  },
  {
    id: 18, name: '천년의 왕국', emoji: '👑',
    description: '최종 결전을 앞둔 평화로운 왕국. 마지막 전사들이 대기한다.',
    levelReq: 170,
    monsters: [
      { name: '왕국 근위대', emoji: '🛡️' }, { name: '천년의 기사', emoji: '⚔️' }, { name: '왕좌의 수호자', emoji: '👑' },
      { name: '성기사', emoji: '🗡️' }, { name: '왕실 마법사', emoji: '🧙' }, { name: '금빛 사자', emoji: '🦁' },
      { name: '왕국 궁수대', emoji: '🏹' }, { name: '철벽 방패병', emoji: '🛡️' }, { name: '왕의 그림자', emoji: '🥷' },
      { name: '천년왕국의 왕', emoji: '👑' },
    ],
  },
  {
    id: 19, name: '생명수의 강', emoji: '💧',
    description: '생명을 회복시키는 거룩한 강. 마지막 정화가 기다린다.',
    levelReq: 180,
    monsters: [
      { name: '생명수 정령', emoji: '💎' }, { name: '수정 거인', emoji: '🔮' }, { name: '빛의 뱀', emoji: '🌈' },
      { name: '생명수 해파리', emoji: '🪼' }, { name: '수정 나비', emoji: '🦋' }, { name: '빛의 거북', emoji: '🐢' },
      { name: '순수의 정령', emoji: '✨' }, { name: '거룩한 악어', emoji: '🐊' }, { name: '수정 독수리', emoji: '🦅' },
      { name: '생명수의 수호자', emoji: '😇' },
    ],
  },
  {
    id: 20, name: '천국', emoji: '✝️',
    description: '모든 모험의 끝. 최강의 수호자가 기다리는 곳.',
    levelReq: 190,
    monsters: [
      { name: '대천사', emoji: '😇' }, { name: '세라핌', emoji: '🕊️' }, { name: '최후의 심판자', emoji: '⚖️' },
      { name: '케루빔', emoji: '👼' }, { name: '천상의 기사', emoji: '⚔️' }, { name: '빛의 전사', emoji: '✨' },
      { name: '천상의 사자', emoji: '🦁' }, { name: '영광의 독수리', emoji: '🦅' }, { name: '천국의 문지기', emoji: '🗝️' },
      { name: '하나님의 전사', emoji: '🌟' },
    ],
  },
];
