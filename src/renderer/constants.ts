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
  // 1막: 부정 (1~4) — "나는 괜찮아"
  { villageId: 1, name: '타락한 뱀', emoji: '🐍', title: '에덴의 지배자', enterLine: '선악을 네가 판단할 수 있다. 네 눈이 곧 진리다. 말씀 따위 필요 없어.', defeatLine: '으으... 이 말씀의 힘은... 하지만 기억해라, 너도 결국 그 열매를 먹게 될 것이다...', newVerses: [1], quizRange: [1, 1] },
  { villageId: 2, name: '여왕벌레 플로라', emoji: '🦟', title: '동산의 포식자', enterLine: '아름다운 것을 탐하는 게 뭐가 나쁘냐? 네 욕심이 곧 네 본성이다!', defeatLine: '안 돼... 이 아름다운 것들이 내 것이 아니란 말이냐...', newVerses: [2], quizRange: [1, 2] },
  { villageId: 3, name: '그림자 속삭이는 자', emoji: '👤', title: '유혹의 화신', enterLine: '쉿... 한 번쯤은 괜찮아. 누가 보겠어? 네 마음속 진짜 욕망에 솔직해져.', defeatLine: '속삭임이... 통하지 않다니... 하지만 네 안에 내 씨앗은 이미 심어졌다...', newVerses: [3], quizRange: [1, 3] },
  { villageId: 4, name: '타락천사 아자젤', emoji: '😈', title: '실락원의 군주', enterLine: '나도 한때 의로운 존재였다. 너와 나의 차이가 뭔지 아느냐? 없다!', defeatLine: '쓰러지면서도... 말해두마... 네 안에도 교만이 있다. 곧 알게 될 것이다...', newVerses: [4, 5], quizRange: [1, 5] },
  // 2막: 균열 (5~7) — "뭔가 이상하다"
  { villageId: 5, name: '사막의 폭군 스콜피온', emoji: '🦂', title: '가시 사막의 왕', enterLine: '고통이 느껴지지? 네가 진짜 의로운 자라면 왜 고난이 오는 거지?', defeatLine: '고통 속에서도... 말씀을 놓지 않다니... 하지만 이건 시작일 뿐이다...', newVerses: [6, 7], quizRange: [1, 7] },
  { villageId: 6, name: '교만의 거인 니므롯', emoji: '🗿', title: '바벨의 망령', enterLine: '하늘까지 닿는 탑! 내 힘으로 세웠다! 너도 네 힘을 믿잖아, 안 그래?', defeatLine: '내 탑이... 무너진다... 네 안의 교만도... 함께 무너지길...', newVerses: [8], quizRange: [1, 8] },
  { villageId: 7, name: '유황의 화신', emoji: '🌋', title: '소돔의 불꽃', enterLine: '심판이 두렵냐? 하하, 네가 심판받을 일이 없다고 생각하는 거지?', defeatLine: '불이... 꺼져간다... 하지만 심판의 불은... 네 안에서도 타고 있다는 걸 알아라...', newVerses: [9, 10], quizRange: [1, 10] },
  // 3막: 자각 (8~10) — "나도 죄인이었구나"
  { villageId: 8, name: '심연의 리바이어던', emoji: '🐋', title: '대홍수의 괴수', enterLine: '온 세상이 물에 잠겼다. 의로운 자가 없었기 때문이지. 너는 의롭냐?', defeatLine: '방주에... 들어간 자는... 오직 은혜로... 살았을 뿐...', newVerses: [11, 12], quizRange: [1, 12] },
  { villageId: 9, name: '광야의 시험자', emoji: '👁️', title: '유혹의 그림자', enterLine: '네가 지금까지 이긴 건 네 힘이 아니야. 시험해볼까? 진짜 네 힘으로 해봐.', defeatLine: '결국... 말씀에 의지하는구나... 네 힘이 아니란 걸... 알기 시작했어...', newVerses: [13], quizRange: [1, 13] },
  { villageId: 10, name: '독의 어머니 마라', emoji: '🧪', title: '저주의 근원', enterLine: '쓴 물이 싫다고? 불평하는 네 모습, 이스라엘과 똑같구나. 너도 결국 같은 죄인이야.', defeatLine: '인정했구나... 네가 죄인이라는 것을... 그 고백이... 나를 물리치다니...', newVerses: [14, 15], quizRange: [1, 15] },
  // 4막: 구원 (11) — "주님, 저를 구해주세요"
  { villageId: 11, name: '금송아지의 우상', emoji: '🐂', title: '거짓 신', enterLine: '보이지 않는 신이 뭘 해줬냐? 내가 눈에 보이잖아! 네 힘, 네 노력, 네 성공... 그게 네 신이다!', defeatLine: '네가... 우상을 버렸다... 네 자신이라는 우상까지... 이것이 진짜 구원인가...', newVerses: [16, 17], quizRange: [1, 17] },
  // 5막: 순종의 어려움 (12~16) — "구원받았는데 왜 또 넘어지지"
  { villageId: 12, name: '여리고의 철벽장군', emoji: '🛡️', title: '난공불락의 수호자', enterLine: '머리로는 믿는다고? 행동이 안 따라오잖아! 이 성벽은 네 불순종이다!', defeatLine: '순종이... 성벽을 무너뜨리다니... 아는 것과 행하는 것은... 다른 것이었구나...', newVerses: [18], quizRange: [1, 18] },
  { villageId: 13, name: '공포의 군주 골리앗', emoji: '⚔️', title: '어둠의 거인', enterLine: '기도해도 응답이 없지? 하나님이 널 버린 거야. 혼자 싸워봐!', defeatLine: '작은 돌멩이... 하나에... 하나님이 함께하면... 거인도 쓰러지는구나...', newVerses: [19, 20], quizRange: [1, 20] },
  { villageId: 14, name: '배신자의 그림자', emoji: '💰', title: '은 서른 냥의 유혹', enterLine: '네 뜻대로 살면 안 되냐? 왜 네 인생을 남에게 맡기지? 네 인생은 네 거야!', defeatLine: '내 뜻대로 마시고... 아버지의 뜻대로... 그 고백이... 나를 이기는구나...', newVerses: [21, 22], quizRange: [1, 22] },
  { villageId: 15, name: '묵시록의 네 기사', emoji: '🏇', title: '종말의 선봉대', enterLine: '믿음 때문에 더 힘들어졌잖아! 차라리 믿기 전이 나았어! 포기해!', defeatLine: '핍박 속에서도... 놓지 않다니... 끝까지 견디는 자가... 구원을 얻는다는 말이 진짜였어...', newVerses: [23, 24], quizRange: [1, 24] },
  { villageId: 16, name: '용광로의 불꽃 드래곤', emoji: '🐉', title: '혼돈의 용', enterLine: '이 고통에 무슨 의미가 있냐! 하나님이 널 사랑하면 왜 아프게 하지!', defeatLine: '이 불이... 파괴가 아니라 정화였다니... 고난이 연단을... 연단이 소망을 만든다는 것이...', newVerses: [25], quizRange: [1, 25] },
  // 6막: 성숙과 회복 (17~19) — "넘어져도 다시 일어난다"
  { villageId: 17, name: '하늘의 방해자', emoji: '🦅', title: '공중 권세', enterLine: '소망? 이 세상에서 소망을 말하다니 어리석구나! 현실을 봐!', defeatLine: '보이는 것이 아닌... 보이지 않는 것을 바라보는 자... 막을 수 없구나...', newVerses: [26, 27], quizRange: [1, 27] },
  { villageId: 18, name: '거짓 왕', emoji: '🤴', title: '왕좌의 사칭자', enterLine: '네 삶의 주인은 너야! 왜 남의 뜻에 복종하지? 자유롭게 살아!', defeatLine: '진짜 자유가... 순종 안에 있다니... 내가 준 자유는... 거짓이었던가...', newVerses: [28, 29], quizRange: [1, 29] },
  { villageId: 19, name: '오염자 아바돈', emoji: '🦠', title: '멸망의 천사', enterLine: '네 과거의 죄는 지워지지 않아! 네가 한 짓을 기억해봐! 넌 변하지 않았어!', defeatLine: '옛 것이... 지나갔다니... 새 것이 되었다니... 이 정화의 물을... 막을 수 없다...', newVerses: [30], quizRange: [1, 30] },
  // 7막: 완성 (20) — "천국"
  { villageId: 20, name: '어둠의 왕', emoji: '👿', title: '모든 어둠의 근원', enterLine: '마지막이다. 네 안에 아직 남아있는 죄성, 그것이 바로 나다. 너는 영원히 나를 이길 수 없어!', defeatLine: '빛이... 어둠을... 이겼다... 십자가에서... 이미 끝난 싸움이었구나...', newVerses: [31, 32], quizRange: [1, 32] },
];

export function getBossForVillage(villageId: number): BossData | undefined {
  return BOSSES.find(b => b.villageId === villageId);
}

// ===== 스토리 컷신 데이터 =====
export interface CutsceneData {
  villageId: number;
  type: 'enter' | 'clear' | 'village_enter';
  scenes: { speaker: string; speakerEmoji: string; lines: string[] }[];
}

export const PROLOGUE_SCENES = [
  { speaker: '나레이션', speakerEmoji: '📜', lines: ['에덴 마을에는 말씀의 빛이 있었다. 그 빛은 마을을 지키고, 어둠과 짐승들을 물리쳐 주었다.'] },
  { speaker: '나레이션', speakerEmoji: '📜', lines: ['그러나 어느 날, 어둠의 세력이 말씀의 빛을 산산이 부수어 스무 조각으로 흩어버렸다.'] },
  { speaker: '나레이션', speakerEmoji: '📜', lines: ['빛을 잃은 마을에 짐승들이 들끓기 시작했고, 사람들은 두려움에 떨었다.'] },
  { speaker: '장로', speakerEmoji: '👴', lines: ['이 마을을 지키던 빛이 사라졌다. 누군가 빛의 조각을 되찾아야 한다.', '{닉네임}, 네가 그 일을 해줄 수 있겠느냐?'] },
  { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['장로님, 걱정 마세요! 제가 다 해결하겠습니다. 저 정도면 충분히 할 수 있어요!'] },
  { speaker: '장로', speakerEmoji: '👴', lines: ['이 두루마리를 받아라. 말씀을 암송할 때마다 이 안에 힘이 깃들 것이다.'] },
  { speaker: '장로', speakerEmoji: '👴', lines: ['{닉네임}아... 네 자신감은 좋으나, 기억하거라.', '이 여정은 단순히 어둠을 물리치는 것이 아니다. 네가 진정 누구인지... 언젠가 알게 될 것이니라.'] },
  { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['네? 무슨 말씀이세요? 에이, 일단 가보겠습니다!'] },
];

export const VILLAGE_CUTSCENES: CutsceneData[] = [
  // 1막: 부정 — 보스전 진입 & 클리어 컷신
  { villageId: 1, type: 'clear', scenes: [
    { speaker: '장로', speakerEmoji: '👴', lines: ['해냈구나, {닉네임}! 첫 번째 빛의 조각이 돌아왔다.', '그 뱀은 네게 무어라 하더냐? "네가 스스로 판단할 수 있다"고?'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['네, 하지만 제 말씀의 힘으로 물리쳤죠! 이 정도는 쉬운걸요.'] },
    { speaker: '장로', speakerEmoji: '👴', lines: ['...그래, 잘 싸웠다. 하지만 {닉네임}아, 뱀의 말이 전부 거짓은 아니었느니라.', '언젠가 알게 되리라. 자, 다음 마을로 가거라.'] },
  ]},
  { villageId: 2, type: 'enter', scenes: [
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['꽃이 시들고 벌레가 꽃을 갉아먹고 있다고? 흠, 안됐지만 내가 해결해줄게.'] },
    { speaker: '꽃지기', speakerEmoji: '🌸', lines: ['고마워요, {닉네임}. 하지만... 왜 이런 일이 생긴 건지 생각해본 적 있나요?', '아름다운 것을 탐하고, 더 가지려 했던 마음이 이 동산을 병들게 한 거예요.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['그건 여기 사람들 문제잖아요. 저는 그냥 보스만 잡으면 되는 거죠?'] },
  ]},
  { villageId: 3, type: 'enter', scenes: [
    { speaker: '숲의 파수꾼', speakerEmoji: '🌲', lines: ['{닉네임}, 귀를 막아라! 이 숲의 그림자들은 유혹의 속삭임으로 마음을 무너뜨린다.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['속삭임? 저는 안 넘어가요. 절대로. ...왜 이렇게 열심히 부정하고 있지? 아, 아니야, 당연한 건데.'] },
    { speaker: '숲의 파수꾼', speakerEmoji: '🌲', lines: ['여기서 쓰러진 전사들도 모두 그렇게 말했다. "나는 다르다"고.', '가장 위험한 것은 자신이 넘어지지 않을 거라는 확신이니라.'] },
  ]},
  { villageId: 4, type: 'enter', scenes: [
    { speaker: '방랑자', speakerEmoji: '🌫️', lines: ['이곳은 실락원. 추방된 자들의 땅이다.', '여기 사는 자들은 모두 에덴에서 쫓겨난 죄인들이지.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['안됐네요. 하지만 저는 죄를 짓지 않았으니까 쫓겨날 일은... 없겠죠?', '...왜 갑자기 확신이 안 서지. 아니, 당연히 없어.'] },
    { speaker: '방랑자', speakerEmoji: '🌫️', lines: ['잠깐 멈칫했구나. 네 입은 아니라 하지만, 네 발은 멈추었다.', '이 안개가 가리고 있는 건 이 땅만이 아니다. 네 눈도 가려져 있는지 모르겠구나.'] },
  ]},
  { villageId: 4, type: 'clear', scenes: [
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['또 이겼다! 네 마을이나 해치웠는데, 이 정도면 금방 끝나겠...'] },
    { speaker: '장로', speakerEmoji: '👴', lines: ['{닉네임}아, 네가 이긴 것은 잘한 일이다. 하지만... 아자젤이 쓰러지며 한 말이 마음에 걸리는구나.', '"네 안에도 교만이 있다"고 했다지?'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['...별것 아니에요. 그냥 지면서 던진 말이죠.'] },
    { speaker: '장로', speakerEmoji: '👴', lines: ['그래... 지금은 그렇게 느끼겠지. 하지만 이 앞의 길은 지금까지와 다를 것이다.', '네 자신감이 아닌 다른 것이 필요해지는 날이 올 게야.'] },
  ]},
  // 2막: 균열
  { villageId: 5, type: 'enter', scenes: [
    { speaker: '사막의 순례자', speakerEmoji: '🏜️', lines: ['{닉네임}... 여기까지 왔다니. 하지만 여기서부턴 진짜 고난이다.', '가시가 살을 찢고, 뜨거운 태양이 의지를 꺾으려 하지.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['으... 이렇게까지 힘들 줄은 몰랐어. 왜 나한테 이런 시련이 오는 거지?', '나는 잘못한 게 없는데...'] },
    { speaker: '사막의 순례자', speakerEmoji: '🏜️', lines: ['고난이 오는 이유를 물을 때, 비로소 여정이 시작된다.'] },
  ]},
  { villageId: 6, type: 'enter', scenes: [
    { speaker: '석공의 유령', speakerEmoji: '🏛️', lines: ['보아라, {닉네임}. 이것이 하늘에 닿으려 했던 자들의 최후다.', '이 탑을 쌓은 자들은 말씀이 아닌 자신의 힘을 믿었지.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['자신의 힘을 믿었다고...? 잠깐, 나도 지금까지 내 힘으로 해왔다고 생각했는데...'] },
    { speaker: '석공의 유령', speakerEmoji: '🏛️', lines: ['깨닫기 시작했구나. 교만의 탑은 항상 무너진다. 네 안에도 이 탑이 세워져 있지 않느냐?'] },
  ]},
  { villageId: 7, type: 'enter', scenes: [
    { speaker: '재 속의 생존자', speakerEmoji: '🔥', lines: ['유황 냄새가 나지? 이 도시는 심판받았다. 아무도 경고를 듣지 않았거든.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['심판... 이 사람들이 얼마나 나쁜 짓을 했길래... 잠깐, 만약 심판의 기준이 내 생각보다 높다면...', '...나는 괜찮은 건가?'] },
    { speaker: '재 속의 생존자', speakerEmoji: '🔥', lines: ['그 질문을 하기 시작한 게 다행이다. 이곳에서는 절대 뒤돌아보지 마라. 오직 앞만 보거라.'] },
  ]},
  // 3막: 자각
  { villageId: 8, type: 'enter', scenes: [
    { speaker: '방주의 후손', speakerEmoji: '🌊', lines: ['대홍수가 모든 것을 삼켰다. 의로운 자가 없었기 때문이지.', '노아만 살아남았는데... 그것도 그의 의로움이 아니라, 하나님의 은혜였다.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['은혜? 노아가 의로워서 살아남은 게 아니라고요?'] },
    { speaker: '방주의 후손', speakerEmoji: '🌊', lines: ['노아가 하나님 앞에 은혜를 입었느니라. 그것이 성경의 기록이다.', '{닉네임}, 너는 지금 방주 안에 있느냐, 밖에 있느냐?'] },
  ]},
  { villageId: 9, type: 'enter', scenes: [
    { speaker: '광야의 은자', speakerEmoji: '☀️', lines: ['예수님도 이 광야에서 시험받으셨다. 그분이 어떻게 이기셨는지 기억하느냐? 말씀으로 이기셨다.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['말씀으로... 나도 말씀으로 싸워왔지만... 솔직히 유혹에 흔들릴 때가 있었어.', '나는 예수님처럼 이길 수 없어. 나는... 약해.'] },
    { speaker: '광야의 은자', speakerEmoji: '☀️', lines: ['네 약함을 인정하는 것, 그것이 시작이다. 강한 척하는 것을 멈출 때 진짜 힘을 찾게 된다.'] },
  ]},
  { villageId: 10, type: 'enter', scenes: [
    { speaker: '중독된 치료사', speakerEmoji: '☠️', lines: ['이스라엘 백성도 이 앞에서 불평했지. 차라리 이집트에서 죽는 게 나았다고.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['하... 나도 솔직히 불평하고 있었어. 왜 이렇게 힘든 거냐고. 이스라엘 백성을 비웃었는데... 나도 똑같구나.', '나도... 죄인이었어. 처음부터.'] },
    { speaker: '중독된 치료사', speakerEmoji: '☠️', lines: ['그래... 그 고백이 이 쓴 물을 달게 만드는 시작이란다.', '모세가 나무를 물에 던지자 물이 달게 변했다. 그 나무는 말씀이며, 고백이니라.'] },
  ]},
  { villageId: 10, type: 'clear', scenes: [
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['...이겼지만, 기쁘지 않아. 마라가 한 말이 맞았어.', '이스라엘을 비웃었던 내가... 똑같은 죄인이었다니.'] },
    { speaker: '하늘의 소리', speakerEmoji: '✨', lines: ['{닉네임}아... 네 고백이 여기까지 들렸느니라.', '죄를 인정하는 자에게 길이 열리리라. 저 산을 향해 오너라.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['저 불꽃이 보여... 두렵지만, 이제는 나 혼자 힘으로 안 된다는 걸 알아. 가겠습니다.'] },
  ]},
  // 4막: 구원
  { villageId: 11, type: 'enter', scenes: [
    { speaker: '하늘의 소리', speakerEmoji: '⛰️', lines: ['{닉네임}아.', '네가 열 개의 빛을 되찾았으나, 네 안의 어둠은 아직 남아있느니라.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['...알아요. 이제 알겠어요. 제 힘으로는 안 된다는 것을.', '저도 죄인이에요. 교만했고, 탐심이 있었고, 유혹에 흔들렸어요. 저를... 구해주세요.'] },
    { speaker: '하늘의 소리', speakerEmoji: '⛰️', lines: ['네 고백을 들었노라. 이제 너에게 새로운 언약을 세우노라.', '지금까지는 네 힘으로 싸운 줄 알았으나, 이제부터는 내가 너와 함께 싸우리라.', '이 산의 불꽃 속에서 너를 새롭게 하리니, 두려워하지 말고 올라오너라.'] },
  ]},
  { villageId: 11, type: 'clear', scenes: [
    { speaker: '하늘의 소리', speakerEmoji: '✝️', lines: ['네가 네 안의 우상을 깨뜨렸구나. 네 힘, 네 자존심, 네가 쌓아온 모든 것을.', '이제 내가 너와 함께하리라. 다시는 혼자 싸우지 않으리라.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['...눈물이 멈추지 않아요. 이 따뜻함은... 지금까지 느껴본 적 없는...', '감사합니다. 이제부터는 제 힘이 아니라 주님과 함께 걸어가겠습니다.'] },
    { speaker: '하늘의 소리', speakerEmoji: '✝️', lines: ['하지만 기억하여라. 구원은 끝이 아니라 시작이니라.', '앞으로 순종하지 못해 넘어질 때가 있으리라. 그때마다 나에게 돌아오너라.'] },
  ]},
  // 5막: 순종의 어려움
  { villageId: 12, type: 'enter', scenes: [
    { speaker: '정찰병', speakerEmoji: '🏰', lines: ['{닉네임}, 저 성벽을 봐라. 하나님을 믿는다고 했지만, 순종하는 건 다른 문제다.', '머리로 아는 것과 발로 걷는 것은 다르느니라.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['맞아요... 구원받았다고 느꼈는데, 여전히 제 뜻대로 하려는 제가 있어요.'] },
    { speaker: '정찰병', speakerEmoji: '🏰', lines: ['여호수아는 칼이 아니라 순종으로 성벽을 무너뜨렸다. 네 불순종의 성벽도 그렇게 무너뜨려야 한다.'] },
  ]},
  { villageId: 13, type: 'enter', scenes: [
    { speaker: '빛의 잔영', speakerEmoji: '🕳️', lines: ['여기는 사망의 음침한 골짜기다. 아무것도 보이지 않고, 하나님도 느껴지지 않을 것이다.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['하나님이... 안 느껴져요. 기도해도 응답이 없는 것 같고... 정말 구원받은 게 맞는 건가요?'] },
    { speaker: '빛의 잔영', speakerEmoji: '🕳️', lines: ['느낌이 사라져도 진리는 변하지 않는다. 사망의 음침한 골짜기를 다닐지라도, 주께서 함께 하시느니라.', '느낌이 아니라 말씀을 믿어라.'] },
  ]},
  { villageId: 14, type: 'enter', scenes: [
    { speaker: '고독한 기도자', speakerEmoji: '🌙', lines: ['이 밤이 가장 긴 밤이 될 것이다.', '예수님이 이 동산에서 기도하셨다. 이 잔을 내게서 옮겨주소서... 그러나 내 뜻대로 마시고 아버지의 뜻대로 하옵소서.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['내 뜻대로 마시고... 아버지의 뜻대로... 그게 얼마나 어려운 기도인지 이제야 알겠어.', '제 뜻을 내려놓는 게... 이렇게 힘든 거였구나.'] },
  ]},
  { villageId: 15, type: 'enter', scenes: [
    { speaker: '예언자', speakerEmoji: '💀', lines: ['때가 왔다, {닉네임}. 믿음 때문에 오히려 세상이 너를 핍박할 것이다.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['믿기 전이 더 편했을까... 아니, 그건 아니야. 힘들어도 이 길이 맞아.', '놓지 않겠어. 끝까지.'] },
    { speaker: '예언자', speakerEmoji: '💀', lines: ['끝까지 견디는 자에게 생명의 면류관을 주리라. 견뎌라, {닉네임}!'] },
  ]},
  { villageId: 16, type: 'enter', scenes: [
    { speaker: '대장장이', speakerEmoji: '🔨', lines: ['금은 불에 넣어야 순금이 된다. 네 믿음도 마찬가지니라.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['고난에 의미가 있다는 걸 머리로는 알지만... 아플 때는 정말 힘들어요.', '하지만... 이 불이 저를 태우는 게 아니라 정화하고 있다는 거죠?'] },
    { speaker: '대장장이', speakerEmoji: '🔨', lines: ['그렇다. 시련은 벌이 아니라 축복이다. 고난이 인내를, 인내가 연단을, 연단이 소망을 만든다.'] },
  ]},
  { villageId: 16, type: 'clear', scenes: [
    { speaker: '대장장이', speakerEmoji: '🔨', lines: ['해냈구나, {닉네임}. 용광로의 불을 견뎌낸 자는 드물다.', '너는 이제 시련 전의 너와 다른 사람이다.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['맞아요... 에덴에서 출발할 때의 저와 지금의 저는 완전히 달라요.', '고난이 저를 부순 게 아니라, 더 단단하게 만들어줬다는 걸 이제 알아요.'] },
    { speaker: '대장장이', speakerEmoji: '🔨', lines: ['불에서 나온 금은 다시는 녹슬지 않는다. 자, 이제 위를 올려다보아라. 빛이 보이지 않느냐?'] },
  ]},
  // 6막: 성숙과 회복
  { villageId: 17, type: 'enter', scenes: [
    { speaker: '천사', speakerEmoji: '☁️', lines: ['{닉네임}... 드디어 여기까지 왔구나. 느껴지느냐? 어둠의 무게가 사라진 이 가벼움을.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['네... 처음으로 소망이 느껴져요. 이 싸움에 끝이 있다는 것을 이제 알아요.', '넘어져도 다시 일어날 수 있다는 것도요.'] },
    { speaker: '천사', speakerEmoji: '☁️', lines: ['보이지 않는 것을 바라보는 것이 믿음이니라. 거의 다 왔다. 소망을 놓지 말거라.'] },
  ]},
  { villageId: 18, type: 'enter', scenes: [
    { speaker: '왕의 시종', speakerEmoji: '👑', lines: ['말씀의 전사 {닉네임}! 왕께서 기다리고 계십니다.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['제 삶의 왕이 바뀌었어요. 예전에는 제가 왕이었는데... 이제 제 주인은 저가 아니에요.', '그분의 뜻을 따르겠습니다.'] },
    { speaker: '왕의 시종', speakerEmoji: '👑', lines: ['왕께서 전하셨습니다 — {닉네임}에게 나의 검을 주어라. 마지막 싸움을 끝낼 자는 그이니라.'] },
  ]},
  { villageId: 19, type: 'enter', scenes: [
    { speaker: '강의 수호자', speakerEmoji: '💧', lines: ['{닉네임}... 네 얼굴에 그동안의 여정이 새겨져 있구나.', '이 강물에 손을 담가보아라. 모든 상처가 아물고, 모든 피로가 씻겨나간다.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['...따뜻해요. 모든 죄책감, 후회, 아픔이 씻겨나가는 것 같아.', '에덴에서 "나는 괜찮다"고 외치던 제가... 이제는 "주님이 함께하시면 괜찮다"고 말할 수 있어요.'] },
    { speaker: '강의 수호자', speakerEmoji: '💧', lines: ['옛 것이 지나갔으니 새 것이 되었도다. 자, 마지막 문이 저기 보인다.'] },
  ]},
  // 7막: 완성
  { villageId: 20, type: 'enter', scenes: [
    { speaker: '하늘의 소리', speakerEmoji: '✝️', lines: ['{닉네임}아. 여기까지 온 것을 축하하노라.', '에덴에서 교만했던 네가 사막에서 무릎 꿇고, 시내산에서 구원받고, 겟세마네에서 뜻을 내려놓고, 용광로에서 단련되어 여기까지 왔느니라.'] },
    { speaker: '{닉네임}', speakerEmoji: '{아바타}', lines: ['모든 것이 은혜였어요. 제 힘이 아니었어요.'] },
    { speaker: '하늘의 소리', speakerEmoji: '✝️', lines: ['이제 마지막 어둠을 물리쳐라. 네 안에 남은 마지막 죄성... 그것마저 빛으로 바꾸리라.'] },
  ]},
];

// ===== 마을 진입 컷신 (보스 처치 후 새 마을 해금 시) =====
// 역할: 이동/풍경 묘사만 담당 (NPC 대화는 VILLAGE_CUTSCENES 'enter'에서)
export const VILLAGE_ENTER_SCENES: CutsceneData[] = [
  // 1막: 부정
  { villageId: 2, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['에덴의 뱀을 물리친 {닉네임}은 의기양양하게 길을 나선다.'] },
    { speaker: '나레이션', speakerEmoji: '🌸', lines: ['달콤한 꽃향기가 바람에 실려온다. 저 멀리 화려한 동산이 보이지만... 어딘가 병들어가고 있다.'] },
  ]},
  { villageId: 3, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['동산의 빛을 되찾은 {닉네임}. 앞에 펼쳐진 숲은 점점 어두워진다.'] },
    { speaker: '나레이션', speakerEmoji: '🌲', lines: ['나뭇잎 사이로 무언가 속삭이는 소리가 들린다. {닉네임}은 대수롭지 않게 걸음을 옮긴다.'] },
  ]},
  { villageId: 4, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['숲을 빠져나오자 짙은 안개가 세상을 감싼다. 추방된 자들의 땅.'] },
    { speaker: '나레이션', speakerEmoji: '🌫️', lines: ['길이 보이지 않는다. {닉네임}은 처음으로 발걸음이 조금 느려진다.'] },
  ]},
  // 2막: 균열
  { villageId: 5, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['안개를 뚫고 나오자 뜨거운 열기가 온몸을 때린다. 가시덤불이 길을 막는다.'] },
    { speaker: '나레이션', speakerEmoji: '🏜️', lines: ['지금까지의 여정과는 전혀 다른 고통이 {닉네임}을 기다리고 있다.'] },
  ]},
  { villageId: 6, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['사막을 건너자 하늘을 찌르던 탑의 잔해가 눈에 들어온다.'] },
    { speaker: '나레이션', speakerEmoji: '🏛️', lines: ['무너진 돌기둥들이 교만의 무게를 말해준다. {닉네임}의 걸음이 멈춘다.'] },
  ]},
  { villageId: 7, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['파편 사이를 지나자 유황 냄새가 코를 찌른다. 검게 그을린 대지가 끝없이 이어진다.'] },
    { speaker: '나레이션', speakerEmoji: '🔥', lines: ['심판받은 도시의 잿더미. {닉네임}은 처음으로 자신에게 질문을 던진다.'] },
  ]},
  // 3막: 자각
  { villageId: 8, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['잿더미를 지나 내려가자 거대한 물이 세상을 뒤덮고 있다. 대홍수의 흔적.'] },
    { speaker: '나레이션', speakerEmoji: '🌊', lines: ['{닉네임}의 확신이 물 위의 뗏목처럼 흔들리기 시작한다.'] },
  ]},
  { villageId: 9, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['물을 건너자 끝이 보이지 않는 황야가 펼쳐진다. 뜨거운 바람만이 불어온다.'] },
    { speaker: '나레이션', speakerEmoji: '☀️', lines: ['이곳에선 자신의 마음 소리까지 들린다. 더 이상 숨길 수 없다.'] },
  ]},
  { villageId: 10, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['광야 끝에 쓴 물이 솟는 샘이 나타난다. 마라의 쓴 샘.'] },
    { speaker: '나레이션', speakerEmoji: '☠️', lines: ['쓴 냄새가 코를 찌른다. 하지만 {닉네임}이 마주해야 할 쓴 것은 물이 아니다.'] },
  ]},
  // 4막: 구원
  { villageId: 11, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['쓴 샘을 뒤로하고 걸어가자, 저 멀리 산꼭대기에서 거룩한 불꽃이 타오른다.'] },
    { speaker: '나레이션', speakerEmoji: '⛰️', lines: ['두렵지만, 갈 수밖에 없다. 더 이상 도망칠 곳은 없으니까.'] },
  ]},
  // 5막: 순종의 어려움
  { villageId: 12, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['산을 내려오자 거대한 성벽이 길을 가로막는다. 하늘이 보이지 않을 만큼 높다.'] },
    { speaker: '나레이션', speakerEmoji: '🏰', lines: ['구원은 끝이 아니라 시작이었다. 순종의 여정이 지금부터 펼쳐진다.'] },
  ]},
  { villageId: 13, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['성벽 너머로 들어서자 모든 빛과 소리가 사라진다. 사방이 어둠뿐이다.'] },
    { speaker: '나레이션', speakerEmoji: '🕳️', lines: ['아무것도 보이지 않고, 아무 소리도 들리지 않는다. 사망의 음침한 골짜기.'] },
  ]},
  { villageId: 14, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['어둠을 빠져나오자 달빛 아래 올리브 나무들이 고요히 서 있다.'] },
    { speaker: '나레이션', speakerEmoji: '🌙', lines: ['겟세마네. 예수님이 기도하신 곳. 가장 어두운 밤이 시작된다.'] },
  ]},
  { villageId: 15, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['밤이 지나고 하늘이 갈라진다. 천둥이 울리고 땅이 흔들린다.'] },
    { speaker: '나레이션', speakerEmoji: '💀', lines: ['{닉네임}의 믿음이 시험받는다. 핍박의 바람이 거세게 몰아친다.'] },
  ]},
  { villageId: 16, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['환난의 땅을 지나자 용광로의 붉은 빛이 저 멀리 보인다. 열기가 피부를 태운다.'] },
    { speaker: '나레이션', speakerEmoji: '🔨', lines: ['금은 불에 넣어야 순금이 된다. 마지막 시련의 불꽃이 기다리고 있다.'] },
  ]},
  // 6막: 성숙과 회복
  { villageId: 17, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['불꽃을 지나자 발아래 구름이 펼쳐진다. 온몸을 짓누르던 무게가 사라진다.'] },
    { speaker: '나레이션', speakerEmoji: '☁️', lines: ['{닉네임}은 처음으로 가벼운 발걸음을 내딛는다. 소망의 빛이 보이기 시작한다.'] },
  ]},
  { villageId: 18, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['구름을 헤치고 내려서자 금빛으로 빛나는 왕국이 나타난다.'] },
    { speaker: '나레이션', speakerEmoji: '👑', lines: ['교만했던 전사가 겸손한 종이 되어 이곳에 섰다. 왕의 부르심이 들려온다.'] },
  ]},
  { villageId: 19, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['왕국을 지나자 수정처럼 맑은 강이 흐르고 있다. 물이 빛을 머금고 있다.'] },
    { speaker: '나레이션', speakerEmoji: '💧', lines: ['이 강물에 지나온 모든 여정이 비친다. 상처도, 눈물도, 그리고 은혜도.'] },
  ]},
  // 7막: 완성
  { villageId: 20, type: 'village_enter', scenes: [
    { speaker: '나레이션', speakerEmoji: '📜', lines: ['강을 건너자 눈부신 빛이 세상을 감싼다. 천국의 문이 앞에 서 있다.'] },
    { speaker: '나레이션', speakerEmoji: '✝️', lines: ['죄인이었던 전사가 은혜로 이곳까지 왔다. 마지막 어둠이 기다리고 있다.'] },
  ]},
];

export const ENDING_SCENES = [
  { speaker: '나레이션', speakerEmoji: '✨', lines: ['마지막 어둠이 물러간다. 빛의 조각이 하나로 합쳐지며 눈부신 빛이 세상을 감싼다.'] },
  { speaker: '나레이션', speakerEmoji: '✨', lines: ['{닉네임}은 기억한다. 에덴에서 "나는 괜찮다"고 외치며 자신만만하게 출발했던 그 날을.'] },
  { speaker: '나레이션', speakerEmoji: '✨', lines: ['가시의 땅에서 처음 흔들렸고, 바벨에서 교만이 무너졌으며, 소돔에서 심판 앞에 떨었다.', '노아의 심연에서 은혜를 알았고, 광야에서 약함을 인정했으며, 마라의 쓴 샘에서 마침내 고백했다.'] },
  { speaker: '나레이션', speakerEmoji: '✨', lines: ['"나도 죄인입니다."'] },
  { speaker: '나레이션', speakerEmoji: '✨', lines: ['시내산에서 구원을 받았으나, 여정은 끝나지 않았다.', '순종하지 못해 넘어지고, 하나님이 안 느껴져 흔들리며, 내 뜻을 내려놓지 못해 괴로워했다.'] },
  { speaker: '나레이션', speakerEmoji: '✨', lines: ['하지만 {닉네임}은 매번 다시 일어났다. 넘어질 때마다 회개했고, 회개할 때마다 은혜가 더했다.'] },
  { speaker: '나레이션', speakerEmoji: '✨', lines: ['그리고 마침내, 자기 안의 마지막 어둠까지 빛으로 바꾸고 이곳에 섰다.'] },
  { speaker: '하늘의 소리', speakerEmoji: '✝️', lines: ['잘 싸웠다, 착하고 충성된 종아.', '네 여정은 네 힘이 아니라 은혜로 완성되었느니라.', '이제 네 주인의 즐거움에 참여할지어다.'] },
  { speaker: '시스템', speakerEmoji: '🏆', lines: ['축하합니다! {닉네임}의 여정이 완성되었습니다!', '빛의 조각 [20/20] — 완성!', '"이제 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라" — 갈라디아서 2:20'] },
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
