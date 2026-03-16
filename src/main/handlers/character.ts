import { queryAll, queryOne, run, saveDb } from '../db';
import { calcTotalStats } from '../game-logic';
import { generateRandomItem, addItemToCharacter } from '../item-service';
import { HandlerMap } from './types';

export function getEquippedItems(characterId: number) {
  return queryAll(`
    SELECT i.stat_type, i.stat_bonus, ci.enhance_level FROM character_items ci
    JOIN items i ON ci.item_id = i.id
    WHERE ci.character_id = ? AND ci.is_equipped = 1
  `, [characterId]);
}

export function getCharacterTotalStats(characterId: number) {
  const character = queryOne('SELECT * FROM characters WHERE id = ?', [characterId]);
  if (!character) return null;
  const equippedItems = getEquippedItems(characterId);
  return { ...calcTotalStats(character.level, equippedItems), level: character.level };
}

function generateCharacterDescription(type: number): string {
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const personalities: Record<number, string[]> = {
    1: ['무뚝뚝하지만 속은 따뜻한', '정의감이 불타는', '과묵하지만 눈빛이 강렬한', '의리를 목숨보다 중요하게 여기는', '웃을 때 보조개가 매력적인', '새벽 훈련을 절대 빠지지 않는', '검을 닦는 것이 취미인', '전투 전 항상 기도하는'],
    2: ['우아하지만 전투에선 무자비한', '꽃을 좋아하지만 칼솜씨는 일품인', '동료를 위해서라면 무엇이든 하는', '노래를 부르며 싸우는', '적에게도 예의를 갖추는', '별을 보며 내일을 꿈꾸는', '웃는 얼굴 뒤에 강한 의지를 숨긴', '찬양을 부르며 검을 휘두르는'],
    3: ['엉뚱하지만 의외로 천재적인', '넘어져도 웃으며 일어나는', '적을 웃음으로 무장해제시키는', '간식을 항상 주머니에 넣고 다니는', '실수투성이지만 결정적 순간에 빛나는', '콧노래를 항상 흥얼거리는', '낮잠을 사랑하지만 전투엔 진지한', '아무도 예상 못한 방법으로 적을 이기는'],
    4: ['당근을 먹으면 전투력이 2배가 되는', '귀를 쫑긋 세우면 적의 약점이 보이는', '작은 몸에서 엄청난 힘이 나오는', '점프력이 어마어마한', '귀여운 외모에 속아 방심하면 큰코다치는', '보름달을 보면 더 강해지는', '동료 토끼들 사이에서 전설로 불리는', '발로 땅을 세 번 두드리면 행운이 오는'],
    5: ['머리 위 꽃이 활짝 피면 전투력이 솟구치는', '작은 몸집이지만 의지만큼은 거인인', '뽑히면 뽑힐수록 더 강해지는', '동료와 함께라면 두려울 것이 없는', '땅 속에서 힘을 모으는 신비로운', '항상 무리지어 다니며 용기를 나누는', '꽃잎이 바람에 날릴 때 가장 아름다운', '낮에는 꽃처럼, 전투에선 전사처럼 변하는'],
  };

  const skills: Record<number, string[]> = {
    1: ['한 손으로 바위를 쪼갤 수 있다', '천 번의 검술 수련 끝에 필살기를 깨우쳤다', '어둠 속에서도 적의 움직임을 읽는다', '방패로 아군을 지키는 것이 특기다', '전장에서 아군의 사기를 높이는 함성이 유명하다'],
    2: ['쌍검술의 달인이다', '바람처럼 빠른 검술이 특기다', '치유의 기도로 동료를 회복시킬 수 있다', '적의 공격을 춤추듯 피하는 회피술의 명수다', '한 번의 일격으로 전투를 끝내는 비기를 가졌다'],
    3: ['함정을 설치하는 솜씨가 천재적이다', '적을 혼란에 빠뜨리는 기술을 가졌다', '숨어서 뒤치기를 하는 것이 특기다', '어디서든 식량을 구해오는 생존 전문가다', '모험 중 희귀한 보물을 잘 찾아낸다'],
    4: ['초고속 연속 발차기가 특기다', '땅굴을 파서 적의 뒤를 잡는 전략을 쓴다', '날카로운 이빨로 어떤 갑옷도 뚫는다', '순간 이동처럼 빠른 몸놀림을 자랑한다', '귀를 안테나처럼 써서 멀리서 오는 적도 감지한다'],
    5: ['머리 위 꽃잎을 무기처럼 날려 적을 공격한다', '동료 피크민을 소환하여 집단 공격을 한다', '땅에 뿌리를 내려 방어력을 극대화한다', '꽃가루를 뿌려 적의 시야를 가린다', '작은 몸으로 적의 약점을 정확히 찌르는 기술이 있다'],
  };

  const hobbies = [
    '쉬는 날에는 성경 읽기를 즐긴다.', '모닥불 앞에서 찬양 부르기를 좋아한다.',
    '동료들에게 재밌는 이야기를 해주는 것을 좋아한다.', '전투가 끝나면 별을 세는 것이 습관이다.',
    '모험 일지를 꼼꼼히 기록하는 편이다.', '맛있는 음식을 만들어 동료들과 나누는 것이 낙이다.',
    '새로운 기술을 연구하는 것에 열정적이다.', '아침마다 기도로 하루를 시작한다.',
  ];

  const mottos = [
    '"여호와는 나의 목자시니 내게 부족함이 없으리로다"가 인생 좌우명이다.',
    '"두려워하지 말라, 내가 너와 함께 함이라"를 마음에 새기고 있다.',
    '"강하고 담대하라!"를 외치며 전투에 임한다.',
    '"믿음이 산을 옮긴다"는 말을 진심으로 믿는다.',
    '"사랑은 모든 것을 이긴다"를 삶으로 증명하려 한다.',
    '"감사하라, 항상 감사하라"가 입버릇이다.',
  ];

  const personality = pick(personalities[type] || personalities[1]);
  const skill = pick(skills[type] || skills[1]);
  const hobby = pick(hobbies);
  const motto = pick(mottos);

  return `${personality} 성격의 소유자다. ${skill}. ${hobby} ${motto}`;
}

export function createCharacterHandlers(): HandlerMap {
  const handlers: HandlerMap = {};

  handlers['character:getAll'] = () => {
    const chars = queryAll('SELECT * FROM characters ORDER BY created_at DESC');
    for (const char of chars) {
      if (!char.description) {
        const desc = generateCharacterDescription(char.character_type);
        run('UPDATE characters SET description = ? WHERE id = ?', [desc, char.id]);
        char.description = desc;
      }
    }
    return chars;
  };

  handlers['character:create'] = (data: { name: string; type: number; reciteMode: number }) => {
    const description = generateCharacterDescription(data.type);
    run('INSERT INTO characters (name, character_type, level, exp, max_exp, description, recite_mode) VALUES (?, ?, 1, 0, 30, ?, ?)', [data.name, data.type, description, data.reciteMode]);
    const newChar = queryOne('SELECT * FROM characters ORDER BY id DESC LIMIT 1');

    const welcomeRewards: any[] = [];
    for (let i = 0; i < 10; i++) {
      const item = generateRandomItem(1);
      const added = addItemToCharacter(newChar.id, item);
      welcomeRewards.push(added);
    }
    saveDb();

    return { ...newChar, welcomeRewards };
  };

  handlers['character:get'] = (id: number) => {
    const char = queryOne('SELECT * FROM characters WHERE id = ?', [id]);
    if (char && !char.description) {
      const desc = generateCharacterDescription(char.character_type);
      run('UPDATE characters SET description = ? WHERE id = ?', [desc, id]);
      char.description = desc;
    }
    return char;
  };

  handlers['character:delete'] = (id: number) => {
    run('DELETE FROM character_items WHERE character_id = ?', [id]);
    run('DELETE FROM characters WHERE id = ?', [id]);
    return true;
  };

  handlers['character:updateReciteMode'] = (data: { characterId: number; reciteMode: number }) => {
    run('UPDATE characters SET recite_mode = ? WHERE id = ?', [data.reciteMode, data.characterId]);
    return true;
  };

  handlers['character:getStats'] = (id: number) => {
    return getCharacterTotalStats(id);
  };

  return handlers;
}
