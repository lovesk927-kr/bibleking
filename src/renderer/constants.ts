// ===== 보스 데이터 =====
export interface BossData {
  villageId: number;
  name: string;
  emoji: string;
  title: string;
  enterLine: string;
  defeatLine: string;
  newVerses: number[];     // 이 마을에서 새로 배정되는 절
  quizRange: [number, number]; // 보스전 출제 범위 [시작절, 끝절]
}

export const BOSSES: BossData[] = [
  { villageId: 1, name: '타락한 뱀', emoji: '🐍', title: '에덴의 지배자', enterLine: '네가 그 말씀의 전사? 하하... 에덴에서 말씀을 지킨 자는 아무도 없었다.', defeatLine: '으으... 이 말씀의 힘은... 에덴에서 처음 느껴보는...', newVerses: [1], quizRange: [1, 1] },
  { villageId: 2, name: '여왕벌레 플로라', emoji: '🦟', title: '동산의 포식자', enterLine: '이 동산의 꽃은 모두 내 것이다. 네 말씀 따위로 나를 막을 수 있을까?', defeatLine: '안 돼... 꽃들이... 다시 피어나고 있어...!', newVerses: [2], quizRange: [1, 2] },
  { villageId: 3, name: '그림자 속삭이는 자', emoji: '👤', title: '유혹의 화신', enterLine: '쉿... 조용히 해. 말씀을 잊으면 편안해질 수 있어...', defeatLine: '말씀을... 잊지 않다니... 내 속삭임이... 통하지 않는다...', newVerses: [3], quizRange: [1, 3] },
  { villageId: 4, name: '타락천사 아자젤', emoji: '😈', title: '실락원의 군주', enterLine: '한때 나도 빛의 존재였다. 너도 곧 나처럼 될 것이다.', defeatLine: '빛을... 다시 보게 되다니... 이것이... 말씀의 힘인가...', newVerses: [4, 5], quizRange: [1, 5] },
  { villageId: 5, name: '사막의 폭군 스콜피온', emoji: '🦂', title: '가시 사막의 왕', enterLine: '이 사막에서 살아 나간 자는 없다. 너도 모래 속에 묻혀라!', defeatLine: '사막을... 걸어서... 통과하다니... 불가능한 일이...', newVerses: [6, 7], quizRange: [1, 7] },
  { villageId: 6, name: '교만의 거인 니므롯', emoji: '🗿', title: '바벨의 망령', enterLine: '내가 하늘에 닿는 탑을 세웠다! 네 따위 말씀이 나를 이길 수 있겠느냐!', defeatLine: '내 탑이... 무너진다... 겸손한 자의 말씀 앞에...', newVerses: [8], quizRange: [1, 8] },
  { villageId: 7, name: '유황의 화신', emoji: '🌋', title: '소돔의 불꽃', enterLine: '이 도시를 태운 불은 꺼지지 않는다. 너도 재가 되어라!', defeatLine: '이 불이... 꺼져간다... 말씀의 빛에... 삼켜진다...', newVerses: [9, 10], quizRange: [1, 10] },
  { villageId: 8, name: '심연의 리바이어던', emoji: '🐋', title: '대홍수의 괴수', enterLine: '깊은 물속에서 올라왔다... 네 말씀의 방주, 내가 부숴주마.', defeatLine: '물이... 물러간다... 방주가... 진짜였다니...', newVerses: [11, 12], quizRange: [1, 12] },
  { villageId: 9, name: '광야의 시험자', emoji: '👁️', title: '유혹의 그림자', enterLine: '배고프지 않느냐? 목마르지 않느냐? 말씀을 버리면 모든 것을 주겠다.', defeatLine: '말씀으로... 이기다니... 그분처럼...', newVerses: [13], quizRange: [1, 13] },
  { villageId: 10, name: '독의 어머니 마라', emoji: '🧪', title: '저주의 근원', enterLine: '달콤한 물을 원하느냐? 내 독을 마셔라... 고통이 사라질 것이다...', defeatLine: '물이... 달게 변하고 있어... 내 독이... 정화되다니...', newVerses: [14, 15], quizRange: [1, 15] },
  { villageId: 11, name: '금송아지의 우상', emoji: '🐂', title: '거짓 신', enterLine: '사람들은 보이지 않는 신보다 나를 선택했다! 너도 내 앞에 무릎 꿇어라!', defeatLine: '보이지 않는 분이... 이렇게 강하다니... 나는... 그저 금덩이에 불과했다...', newVerses: [16, 17], quizRange: [1, 17] },
  { villageId: 12, name: '여리고의 철벽장군', emoji: '🛡️', title: '난공불락의 수호자', enterLine: '이 성벽은 절대 무너지지 않는다. 네 함성 따위로는!', defeatLine: '성벽이... 무너진다...! 믿음의 함성에...!', newVerses: [18], quizRange: [1, 18] },
  { villageId: 13, name: '공포의 군주 골리앗', emoji: '⚔️', title: '어둠의 거인', enterLine: '꼬마 전사가 나에게 도전한다고? 다윗처럼 운이 좋길 바라라!', defeatLine: '또... 작은 자에게... 지다니... 말씀의 돌멩이 하나에...', newVerses: [19, 20], quizRange: [1, 20] },
  { villageId: 14, name: '배신자의 그림자', emoji: '💰', title: '은 서른 냥의 유혹', enterLine: '은 서른 냥이면 충분하지 않느냐? 말씀을 팔아라...', defeatLine: '은 서른 냥보다... 말씀이... 더 가치 있다는 것이냐...', newVerses: [21, 22], quizRange: [1, 22] },
  { villageId: 15, name: '묵시록의 네 기사', emoji: '🏇', title: '종말의 선봉대', enterLine: '일곱 인이 풀렸다. 이제 세상의 끝이다. 네 말씀으로 이것을 막을 수 있겠느냐!', defeatLine: '어린 양이... 이긴다는 예언이... 진짜였다니...!', newVerses: [23, 24], quizRange: [1, 24] },
  { villageId: 16, name: '용광로의 불꽃 드래곤', emoji: '🐉', title: '혼돈의 용', enterLine: '정화라고? 나는 파괴할 뿐이다! 너를 태워 재로 만들어주마!', defeatLine: '이 불 속에서... 순금이 되어 나오다니... 파괴할 수 없는 자...', newVerses: [25], quizRange: [1, 25] },
  { villageId: 17, name: '하늘의 방해자', emoji: '🦅', title: '공중 권세', enterLine: '하늘은 네가 올 곳이 아니다. 다시 땅으로 떨어져라!', defeatLine: '하늘의 문이... 열린다... 막을 수... 없다...', newVerses: [26, 27], quizRange: [1, 27] },
  { villageId: 18, name: '거짓 왕', emoji: '🤴', title: '왕좌의 사칭자', enterLine: '내가 진짜 왕이다! 네가 섬기는 왕은 가짜다!', defeatLine: '진짜 왕이... 누구인지... 이제야... 알겠다...', newVerses: [28, 29], quizRange: [1, 29] },
  { villageId: 19, name: '오염자 아바돈', emoji: '🦠', title: '멸망의 천사', enterLine: '이 맑은 물을 더럽히면 세상은 영원히 치유되지 못한다. 막아볼 테냐?', defeatLine: '생명수가... 정화되었다... 내 오염이... 씻겨나간다...', newVerses: [30], quizRange: [1, 30] },
  { villageId: 20, name: '어둠의 왕', emoji: '👿', title: '모든 어둠의 근원', enterLine: '나는 태초부터 있었다. 빛의 조각을 모았다고? 내 앞에서는 아무 의미 없다!', defeatLine: '빛이... 어둠을... 이겼다... 태초부터... 정해진 결말이었던가...', newVerses: [31, 32], quizRange: [1, 32] },
];

export function getBossForVillage(villageId: number): BossData | undefined {
  return BOSSES.find(b => b.villageId === villageId);
}

// ===== 스토리 컷신 데이터 =====
export interface CutsceneData {
  villageId: number;
  type: 'enter' | 'clear';
  scenes: { speaker: string; speakerEmoji: string; lines: string[] }[];
}

export const PROLOGUE_SCENES = [
  { speaker: '나레이션', speakerEmoji: '📜', lines: ['태초에 말씀이 계시니라. 말씀의 빛이 온 세상을 비추어 어둠이 감히 범접하지 못하였더라.'] },
  { speaker: '나레이션', speakerEmoji: '📜', lines: ['그러나 어둠의 세력이 말씀의 빛을 산산이 부수어 스무 조각으로 흩어버리니, 세상은 어둠에 잠식되고 짐승들이 들끓기 시작하였더라.'] },
  { speaker: '나레이션', speakerEmoji: '📜', lines: ['사람들은 마을에 갇혀 두려움 속에 살아갔다. 그때, 에덴의 장로가 예언하였으니—'] },
  { speaker: '장로', speakerEmoji: '👴', lines: ['말씀을 마음에 새기는 자가 나타나리라. 그가 어둠을 물리치고 빛의 조각을 되찾으리니...'] },
  { speaker: '장로', speakerEmoji: '👴', lines: ['오... 네가 바로 {닉네임}이로구나. 내가 오래 기다렸다.', '너는 여느 전사와 다르다. 칼과 방패가 아닌, 말씀의 힘으로 싸우는 자이니라.'] },
  { speaker: '장로', speakerEmoji: '👴', lines: ['이 두루마리를 받아라. 네가 말씀을 암송할 때마다 이 안에 힘이 깃들 것이다.', '에덴 바깥은 이미 어둠에 물들었다. 하지만 두려워 말라. 말씀을 네 마음에 새기면 어떤 어둠도 너를 이기지 못하리라.'] },
  { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['제가 할 수 있을까요?'] },
  { speaker: '장로', speakerEmoji: '👴', lines: ['할 수 있느냐고? 하하... {닉네임}, 네가 하는 것이 아니다. 말씀이 하는 것이니라. 네가 말씀을 외우면, 말씀이 너를 통해 싸울 것이다.', '자, 먼저 이 에덴의 들짐승들부터 상대해보거라. 그것이 네 첫 번째 시험이니라.'] },
];

export const VILLAGE_CUTSCENES: CutsceneData[] = [
  { villageId: 1, type: 'clear', scenes: [
    { speaker: '장로', speakerEmoji: '👴', lines: ['해냈구나, {닉네임}! 첫 번째 빛의 조각이 돌아왔다.', '하지만 이것은 시작일 뿐이다. 아직 열아홉 조각이 남아있느니라.', '에덴 너머 기쁨의 동산으로 가거라. 그곳은 아직 아름다움이 남아있지만... 어둠이 스며들고 있다.'] },
  ]},
  { villageId: 2, type: 'enter', scenes: [
    { speaker: '꽃지기', speakerEmoji: '🌸', lines: ['어머, 여행자! 아니... 혹시 당신이 그 말씀의 전사 {닉네임}?', '이 동산을 좀 봐요. 예전엔 온통 꽃이었는데, 어둠이 스며든 뒤로 벌레들이 꽃을 갉아먹기 시작했어요.', '빛의 조각이 사라지자 곤충들이 거대해지고 흉폭해졌죠. 부탁이에요, 이곳의 빛을 되찾아주세요.'] },
  ]},
  { villageId: 3, type: 'enter', scenes: [
    { speaker: '숲의 파수꾼', speakerEmoji: '🌲', lines: ['{닉네임}, 귀를 막아라! 이 숲의 그림자들은 유혹의 속삭임으로 전사들의 마음을 무너뜨린다.', '여기서 쓰러진 전사가 한둘이 아니다. 모두 조금만 쉬자는 속삭임에 넘어가 다시는 일어나지 못했지.', '하지만 네가 말씀을 입에 담고 있는 한, 그 속삭임은 너를 이기지 못한다. 기억하거라 — 말씀이 곧 방패다.'] },
  ]},
  { villageId: 4, type: 'enter', scenes: [
    { speaker: '방랑자', speakerEmoji: '🌫️', lines: ['이곳이 한때 낙원이었다는 걸 믿겠나, {닉네임}?', '빛의 조각이 사라지고... 타락한 천사들이 이곳을 지배하기 시작했지. 사람들은 모두 떠났어. 나만 빼고.', '누군가 와서 이곳을 되살려줄 거라 믿었거든. 그리고... 네가 왔구나.'] },
  ]},
  { villageId: 5, type: 'enter', scenes: [
    { speaker: '사막의 순례자', speakerEmoji: '🏜️', lines: ['{닉네임}... 여기까지 왔다니. 대단한 전사로구나.', '하지만 여기서부턴 진짜 고난이다. 이 사막은 끝이 없어 보이고, 가시가 살을 찢고, 뜨거운 태양이 의지를 꺾으려 하지.', '기억하거라. 가시밭을 지나지 않으면 꽃밭에 도달할 수 없느니라. 고난이 인내를, 인내가 연단을 만든다.'] },
  ]},
  { villageId: 6, type: 'enter', scenes: [
    { speaker: '석공의 유령', speakerEmoji: '🏛️', lines: ['보아라, {닉네임}. 이것이 하늘에 닿으려 했던 자들의 최후다.', '이 탑을 쌓은 자들은 말씀이 아닌 자신의 힘을 믿었지. 우리가 곧 신이 되리라! 하늘을 향해 외쳤으나...', '결국 탑은 무너지고, 서로의 말을 알아듣지 못하게 되었다. 오직 겸손한 자의 말씀만이 이들을 물리칠 수 있느니라.'] },
  ]},
  { villageId: 7, type: 'enter', scenes: [
    { speaker: '재 속의 생존자', speakerEmoji: '🔥', lines: ['냄새가 나지, {닉네임}? 유황 냄새... 수백 년이 지났는데도 사라지지 않아.', '이 도시는 심판받았다. 빛의 조각이 경고했건만 아무도 듣지 않았지.', '이곳에서는 절대 뒤돌아보지 마라. 오직 앞만 보고, 말씀만 붙잡아라.'] },
  ]},
  { villageId: 8, type: 'enter', scenes: [
    { speaker: '방주의 후손', speakerEmoji: '🌊', lines: ['{닉네임}, 이 뗏목 위로 올라와라. 물에 빠지면 끝이다.', '대홍수가 모든 것을 삼켰다. 하지만 말씀에 순종한 한 사람, 노아는 살아남았지.', '네 방주는 바로 네가 외운 말씀이다. 말씀 위에 서 있는 한, 아무리 깊은 물도 너를 삼키지 못하리라.'] },
  ]},
  { villageId: 9, type: 'enter', scenes: [
    { speaker: '광야의 은자', speakerEmoji: '☀️', lines: ['40일... 40년... 이 광야에선 시간도 의미를 잃는다.', '{닉네임}, 여기까지 온 것만으로 대단하다. 하지만 이곳은 지금까지와 다르다.', '예수님도 이 광야에서 시험받으셨다. 그분이 어떻게 이기셨는지 기억하느냐? 말씀으로 이기셨다. 네게도 같은 무기가 있지 않느냐.'] },
  ]},
  { villageId: 10, type: 'enter', scenes: [
    { speaker: '중독된 치료사', speakerEmoji: '☠️', lines: ['{닉네임}이냐... 이 샘물을 마시면... 안 된다...', '이스라엘 백성도 이 앞에서 불평했지. 차라리 이집트에서 죽는 게 나았다고.', '모세가 나무를 물에 던지자 물이 달게 변했다. 그 나무가 바로 말씀이었느니라. 네 말씀으로 이 샘을 정화해다오...'] },
  ]},
  { villageId: 11, type: 'enter', scenes: [
    { speaker: '하늘의 소리', speakerEmoji: '⛰️', lines: ['{닉네임}아.', '네가 열 개의 빛을 되찾았으니, 이제 너에게 새로운 언약을 세우노라.', '지금까지는 어둠을 물리치는 것이었다. 이제부터는 어둠을 정복하는 것이니라.', '이 산의 불꽃 속에서 네 무기가 단련될 것이다. 두려워하지 말고 올라오너라.'] },
  ]},
  { villageId: 12, type: 'enter', scenes: [
    { speaker: '정찰병', speakerEmoji: '🏰', lines: ['{닉네임}, 저 성벽을 봐라. 높이가 하늘을 찌르고, 두께가 수레 네 대가 나란히 달릴 만큼이다.', '물리적인 힘으로는 절대 무너지지 않는다. 수많은 전사들이 이 성벽 앞에서 되돌아갔지.', '여호수아가 어떻게 했는지 기억하느냐? 칼이 아니라 믿음의 외침으로 성벽을 무너뜨렸다. 네 말씀이 곧 함성이다!'] },
  ]},
  { villageId: 13, type: 'enter', scenes: [
    { speaker: '빛의 잔영', speakerEmoji: '🕳️', lines: ['{닉네임}... 여기는 사망의 음침한 골짜기다.', '아무것도 보이지 않을 것이다. 이곳의 어둠은 네 눈이 아닌 마음을 가리느니라.', '기억하거라. 내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라. 말씀이 네 빛이 되어줄 것이다.'] },
  ]},
  { villageId: 14, type: 'enter', scenes: [
    { speaker: '고독한 기도자', speakerEmoji: '🌙', lines: ['{닉네임}... 이 밤이 가장 긴 밤이 될 것이다.', '예수님이 이 동산에서 피땀을 흘리며 기도하셨다. 이 잔을 내게서 옮겨주소서... 그러나 내 뜻대로 마시고 아버지의 뜻대로 하옵소서.', '하지만 이 밤을 견디면... 부활의 아침이 온다. 가장 어두운 밤이 지나야 새벽이 오느니라.'] },
  ]},
  { villageId: 15, type: 'enter', scenes: [
    { speaker: '예언자', speakerEmoji: '💀', lines: ['때가 왔다, {닉네임}.', '일곱 봉인이 풀리고, 일곱 나팔이 울린다. 네 기사가 세상을 짓밟으니 — 전쟁, 기근, 역병, 죽음.', '하지만 기억하거라. 요한계시록의 마지막은 멸망이 아니라 승리다. 끝까지 견디는 자에게 생명의 면류관을 주리라. 견뎌라, {닉네임}!'] },
  ]},
  { villageId: 16, type: 'enter', scenes: [
    { speaker: '대장장이', speakerEmoji: '🔨', lines: ['어서 와라, {닉네임}. 여기까지 온 것은 네가 진짜이기 때문이다.', '금은 불에 넣어야 순금이 된다. 네 말씀도 마찬가지니라.', '시련은 벌이 아니라 축복이다. 자, 불 속으로 들어가거라.'] },
  ]},
  { villageId: 17, type: 'enter', scenes: [
    { speaker: '천사', speakerEmoji: '☁️', lines: ['{닉네임}... 드디어 여기까지 왔구나.', '여기는 하늘과 땅 사이, 구름 위의 세계다. 느껴지느냐? 어둠의 무게가 사라진 이 가벼움을.', '하지만 아직 끝이 아니다. 거의 다 왔다. 소망을 놓지 말거라.'] },
  ]},
  { villageId: 18, type: 'enter', scenes: [
    { speaker: '왕의 시종', speakerEmoji: '👑', lines: ['말씀의 전사 {닉네임}! 왕께서 기다리고 계십니다.', '이곳은 천년의 왕국. 왕의 통치 아래 평화가 임한 곳이지요.', '하지만 평화에 속지 마십시오. 왕께서 전하셨습니다 — {닉네임}에게 나의 검을 주어라. 마지막 싸움을 끝낼 자는 그이니라.'] },
  ]},
  { villageId: 19, type: 'enter', scenes: [
    { speaker: '강의 수호자', speakerEmoji: '💧', lines: ['{닉네임}... 네 얼굴에 그동안의 여정이 새겨져 있구나.', '이 강물에 손을 담가보아라. 모든 상처가 아물고, 모든 피로가 씻겨나간다.', '에덴에서 시작한 그 어린 전사가... 이렇게 성장했구나. 자, 마지막 문이 저기 보인다.'] },
  ]},
  { villageId: 20, type: 'enter', scenes: [
    { speaker: '하늘의 소리', speakerEmoji: '✝️', lines: ['{닉네임}아. 여기까지 온 것을 축하하노라.', '에덴의 작은 전사였던 네가 속삭임의 유혹을 이기고, 사막의 고난을 견디며, 겟세마네의 밤을 지나, 대환난을 통과하여 여기까지 왔느니라.', '이제 마지막 어둠을 물리쳐라. 빛의 완성이 기다리고 있다.'] },
  ]},
];

export const ENDING_SCENES = [
  { speaker: '나레이션', speakerEmoji: '✨', lines: ['말씀의 빛이... 완성되었다!'] },
  { speaker: '나레이션', speakerEmoji: '✨', lines: ['말씀의 빛이 세상에 돌아왔다. 어둠은 물러가고, 몬스터들은 사라지며, 마을 사람들이 다시 자유롭게 걸어 다니기 시작했다.', '이 모든 것은 말씀을 마음에 새긴 한 전사, {닉네임} 덕분이었다.'] },
  { speaker: '시스템', speakerEmoji: '🏆', lines: ['축하합니다! 말씀의 전사 {닉네임}의 여정이 완성되었습니다!', '빛의 조각 [20/20] — 완성!'] },
];

// ===== 캐릭터 데이터 =====
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
