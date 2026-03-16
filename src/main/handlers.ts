import { queryAll, queryOne, run, getDb, saveDb } from './db';
import { calcBaseStats, calcEquipBonuses, calcEnhanceBonus, calcWinRate, calcLevelUp, normalizeAnswer, calcReciteExp, calcItemStatBonus, calcEnhanceSuccessRate, calcSynthStatBonus, calcBossStats } from './game-logic';

// 핸들러 맵: 채널 이름 → 핸들러 함수
export type HandlerMap = Record<string, (data: any) => any>;

export function createHandlers(): HandlerMap {
  const handlers: HandlerMap = {};

  // ===== 관리자 =====
  handlers['admin:login'] = (password: string) => {
    return password === '1234';
  };

  handlers['admin:getVerses'] = () => {
    return queryAll('SELECT * FROM verses ORDER BY verse_number');
  };

  handlers['admin:saveVerses'] = (data: { book: string; chapter: string; verses: { verse_number: number; content: string }[] }) => {
    for (const v of data.verses) {
      const existing = queryOne('SELECT id FROM verses WHERE book = ? AND chapter = ? AND verse_number = ?', [data.book, parseInt(data.chapter), v.verse_number]);
      if (existing) {
        run('UPDATE verses SET content = ? WHERE id = ?', [v.content, existing.id]);
      } else {
        run('INSERT INTO verses (book, chapter, verse_number, content) VALUES (?, ?, ?, ?)', [data.book, parseInt(data.chapter), v.verse_number, v.content]);
      }
    }
    return true;
  };

  handlers['admin:getSettings'] = () => {
    const getSetting = (key: string, def: string) => {
      const row = queryOne("SELECT value FROM game_settings WHERE key = ?", [key]);
      return row ? row.value : def;
    };
    return {
      book: getSetting('book', '시편'),
      chapter: getSetting('chapter', '119'),
      startVerse: parseInt(getSetting('start_verse', '1')),
      verseCount: parseInt(getSetting('verse_count', '10')),
    };
  };

  handlers['admin:saveSettings'] = (settings: { book: string; chapter: string; startVerse: number; verseCount: number }) => {
    const saveSetting = (key: string, value: string) => {
      const existing = queryOne("SELECT id FROM game_settings WHERE key = ?", [key]);
      if (existing) {
        run("UPDATE game_settings SET value = ? WHERE key = ?", [value, key]);
      } else {
        run("INSERT INTO game_settings (key, value) VALUES (?, ?)", [key, value]);
      }
    };
    saveSetting('book', settings.book);
    saveSetting('chapter', settings.chapter);
    saveSetting('start_verse', String(settings.startVerse));
    saveSetting('verse_count', String(settings.verseCount));
    return true;
  };

  handlers['admin:getBlankTemplates'] = () => {
    return queryAll('SELECT verse_number, blank_template FROM verses ORDER BY verse_number');
  };

  handlers['admin:saveBlankTemplates'] = (templates: { verse_number: number; blank_template: string }[]) => {
    for (const t of templates) {
      run('UPDATE verses SET blank_template = ? WHERE verse_number = ?', [t.blank_template, t.verse_number]);
    }
    return true;
  };

  // ===== 캐릭터 =====
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
    run('INSERT INTO characters (name, character_type, level, exp, max_exp, description, recite_mode) VALUES (?, ?, 1, 0, 100, ?, ?)', [data.name, data.type, description, data.reciteMode]);
    const newChar = queryOne('SELECT * FROM characters ORDER BY id DESC LIMIT 1');

    // 생성 기념 아이템 상자 10개
    const welcomeRewards: any[] = [];
    for (let i = 0; i < 10; i++) {
      const item = generateRandomItem(1);
      run('INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [item.name, item.description, item.type, item.stat_type, item.stat_bonus, item.rarity, item.level_req]);
      const newItem = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
      run('INSERT INTO character_items (character_id, item_id, is_equipped) VALUES (?, ?, 0)', [newChar.id, newItem.id]);
      welcomeRewards.push({ ...item, id: newItem.id });
    }
    saveDb();

    return { ...newChar, welcomeRewards };
  };

  // 디버그: 캐릭터 레벨/경험치 직접 설정
  handlers['debug:addItem'] = (data: { characterId: number; item: { name: string; description: string; type: string; stat_type: string; stat_bonus: number; rarity: string; level_req: number }; count: number }) => {
    const results = [];
    for (let i = 0; i < (data.count || 1); i++) {
      run('INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [data.item.name, data.item.description, data.item.type, data.item.stat_type, data.item.stat_bonus, data.item.rarity, data.item.level_req]);
      const newItem = queryOne('SELECT last_insert_rowid() as id');
      run('INSERT INTO character_items (character_id, item_id, is_equipped, enhance_level) VALUES (?, ?, 0, 0)',
        [data.characterId, newItem.id]);
      results.push(newItem.id);
    }
    return { success: true, itemIds: results };
  };

  handlers['debug:addConsumable'] = (data: { characterId: number; type: string; quantity: number }) => {
    const existing = queryOne('SELECT id FROM consumables WHERE character_id = ? AND type = ?', [data.characterId, data.type]);
    if (existing) {
      run('UPDATE consumables SET quantity = quantity + ? WHERE character_id = ? AND type = ?', [data.quantity, data.characterId, data.type]);
    } else {
      run('INSERT INTO consumables (character_id, type, quantity) VALUES (?, ?, ?)', [data.characterId, data.type, data.quantity]);
    }
    return { success: true };
  };

  handlers['debug:setLevel'] = (data: { characterId: number; level: number; expPercent: number }) => {
    const maxExp = data.level * 100;
    const exp = Math.floor(maxExp * data.expPercent / 100);
    run('UPDATE characters SET level = ?, exp = ?, max_exp = ? WHERE id = ?', [data.level, exp, maxExp, data.characterId]);
    return queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
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
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [id]);
    if (!character) return null;

    const equippedItems = queryAll(`
      SELECT i.stat_type, i.stat_bonus, ci.enhance_level FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.character_id = ? AND ci.is_equipped = 1
    `, [id]);

    let bonusAttack = 0;
    let bonusDefense = 0;
    let bonusHp = 0;
    let bonusEvasion = 0;
    for (const item of equippedItems) {
      // 회피는 % 수치이므로 강화 보너스도 축소 (강화당 +0.5%)
      const enhanceBonus = item.stat_type === 'evasion' ? Math.floor(item.enhance_level * 0.5) : item.enhance_level * 3;
      const totalBonus = item.stat_bonus + enhanceBonus;
      if (item.stat_type === 'attack') bonusAttack += totalBonus;
      if (item.stat_type === 'defense') bonusDefense += totalBonus;
      if (item.stat_type === 'hp') bonusHp += totalBonus;
      if (item.stat_type === 'evasion') bonusEvasion += totalBonus;
    }

    const baseAttack = 50 + character.level * 30;
    const baseDefense = 30 + character.level * 20;
    const baseHp = 500 + character.level * 100;
    const baseEvasion = 5;

    return {
      level: character.level,
      baseAttack, baseDefense, baseHp, baseEvasion,
      bonusAttack, bonusDefense, bonusHp, bonusEvasion,
      totalAttack: baseAttack + bonusAttack,
      totalDefense: baseDefense + bonusDefense,
      totalHp: baseHp + bonusHp,
      totalEvasion: Math.min(50, baseEvasion + bonusEvasion),
    };
  };

  // ===== 암송 =====
  handlers['recite:getQuiz'] = () => {
    const getSetting = (key: string, def: string) => {
      const row = queryOne("SELECT value FROM game_settings WHERE key = ?", [key]);
      return row ? row.value : def;
    };
    const book = getSetting('book', '시편');
    const chapter = parseInt(getSetting('chapter', '119'));
    const startVerse = parseInt(getSetting('start_verse', '1'));
    const count = parseInt(getSetting('verse_count', '10'));

    return queryAll(
      'SELECT * FROM verses WHERE book = ? AND chapter = ? AND verse_number >= ? ORDER BY verse_number LIMIT ?',
      [book, chapter, startVerse, count]
    );
  };

  // PvP용: 범위 지정 퀴즈
  handlers['recite:getQuizRange'] = (data: { startVerse: number; endVerse: number }) => {
    const getSetting = (key: string, def: string) => {
      const row = queryOne("SELECT value FROM game_settings WHERE key = ?", [key]);
      return row ? row.value : def;
    };
    const book = getSetting('book', '시편');
    const chapter = parseInt(getSetting('chapter', '119'));

    return queryAll(
      'SELECT * FROM verses WHERE book = ? AND chapter = ? AND verse_number >= ? AND verse_number <= ? ORDER BY verse_number',
      [book, chapter, data.startVerse, data.endVerse]
    );
  };

  // 사용 가능한 절 목록 조회
  handlers['recite:getVerseNumbers'] = () => {
    const getSetting = (key: string, def: string) => {
      const row = queryOne("SELECT value FROM game_settings WHERE key = ?", [key]);
      return row ? row.value : def;
    };
    const book = getSetting('book', '시편');
    const chapter = parseInt(getSetting('chapter', '119'));

    return queryAll(
      'SELECT verse_number FROM verses WHERE book = ? AND chapter = ? ORDER BY verse_number',
      [book, chapter]
    ).map((r: any) => r.verse_number);
  };

  handlers['recite:submit'] = (data: { characterId: number; answers: { verse_number: number; answer: string }[] }) => {
    const results: { verse_number: number; correct: boolean; correctAnswer: string; userAnswer: string }[] = [];
    let score = 0;

    for (const a of data.answers) {
      const verse = queryOne('SELECT content FROM verses WHERE verse_number = ?', [a.verse_number]);
      if (!verse) continue;

      const normalize = (s: string) => s.replace(/[\s,.!?;:'"''""·\u3000]/g, '');
      const correct = normalize(verse.content) === normalize(a.answer);
      if (correct) score++;

      results.push({ verse_number: a.verse_number, correct, correctAnswer: verse.content, userAnswer: a.answer });
    }

    const totalQuestions = data.answers.length;
    // 맞은 절 하나당 10exp
    let earnedExp = score * 10;

    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    if (character && character.recite_mode === 0 && earnedExp > 0) {
      earnedExp = Math.round(earnedExp * 1.2);
    }

    if (character) {
      let newExp = character.exp + earnedExp;
      let newLevel = character.level;
      let maxExp = character.max_exp;
      let leveledUp = false;
      const rewards: any[] = [];

      while (newExp >= maxExp) {
        newExp -= maxExp;
        newLevel++;
        maxExp = newLevel * 100;
        leveledUp = true;

        const item = generateRandomItem(newLevel);
        run('INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [item.name, item.description, item.type, item.stat_type, item.stat_bonus, item.rarity, item.level_req]);
        const newItem = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
        run('INSERT INTO character_items (character_id, item_id, is_equipped) VALUES (?, ?, 0)', [data.characterId, newItem.id]);
        rewards.push({ ...item, id: newItem.id });
      }

      run('UPDATE characters SET exp = ?, level = ?, max_exp = ? WHERE id = ?', [newExp, newLevel, maxExp, data.characterId]);
      return { results, score, totalQuestions, earnedExp, leveledUp, newLevel, newExp, maxExp, rewards };
    }

    return { results, score, totalQuestions, earnedExp, leveledUp: false, rewards: [] };
  };

  // ===== 몬스터 =====
  handlers['monster:random'] = (data: { characterLevel: number; villageId: number }) => {
    const { characterLevel, villageId } = typeof data === 'number'
      ? { characterLevel: data, villageId: 1 } // 하위 호환
      : data;

    // 마을별 몬스터 목록
    const villageMonsters: Record<number, { name: string; emoji: string }[]> = {
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

    const monsters = villageMonsters[villageId] || villageMonsters[1];
    const type = monsters[Math.floor(Math.random() * monsters.length)];

    // 마을별 최소/최대 레벨 제한 + 캐릭터 ±5 범위
    const villageLevelReqs = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190];
    const villageMinLevel = Math.max(1, (villageLevelReqs[villageId - 1] || 1) - 1);
    const villageMaxLevel = (villageLevelReqs[villageId - 1] || 1) + 10 + 2;
    const minLv = Math.min(Math.max(villageMinLevel, characterLevel - 5), villageMaxLevel);
    const maxLv = Math.min(characterLevel + 5, villageMaxLevel);
    const level = minLv + Math.floor(Math.random() * (Math.max(0, maxLv - minLv) + 1));

    // 몬스터 전투력 (레벨별)
    const hp = 400 + level * 150;
    const attack = 50 + level * 30;
    const defense = 20 + level * 20;
    const exp_reward = 10 + level * 8;

    // 몬스터 종합 전투력 = attack + defense + hp/10
    const power = attack + defense + Math.floor(hp / 10);

    return { id: 0, name: type.name, emoji: type.emoji, level, hp, attack, defense, exp_reward, power };
  };

  handlers['battle:fight'] = (data: { characterId: number; monsterId: number; monster: any; scorePercent: number; noDrop?: boolean }) => {
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    const monster = data.monster;
    if (!character || !monster) return { victory: false, log: ['오류 발생'], battleExp: 0, battleRewards: [], monsterName: '', monsterEmoji: '', battleLeveledUp: false };

    const equippedItems = queryAll(`
      SELECT i.stat_type, i.stat_bonus, ci.enhance_level FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.character_id = ? AND ci.is_equipped = 1
    `, [data.characterId]);

    let bonusAttack = 0, bonusDefense = 0, bonusHp = 0, bonusEvasion = 0;
    for (const item of equippedItems) {
      const enhanceBonus = item.stat_type === 'evasion' ? Math.floor(item.enhance_level * 0.5) : item.enhance_level * 3;
      const totalBonus = item.stat_bonus + enhanceBonus;
      if (item.stat_type === 'attack') bonusAttack += totalBonus;
      if (item.stat_type === 'defense') bonusDefense += totalBonus;
      if (item.stat_type === 'hp') bonusHp += totalBonus;
      if (item.stat_type === 'evasion') bonusEvasion += totalBonus;
    }

    const baseAttack = 50 + character.level * 30;
    const baseDefense = 30 + character.level * 20;
    const baseHp = 500 + character.level * 100;
    const playerEvasion = Math.min(30, 5 + bonusEvasion);

    const playerAttack = baseAttack + bonusAttack;
    const playerDefense = baseDefense + bonusDefense;
    const playerMaxHp = baseHp + bonusHp;

    // 종합 전투력 계산
    const playerPower = playerAttack + playerDefense + Math.floor(playerMaxHp / 10) + playerEvasion;
    const monsterPower = monster.attack + monster.defense + Math.floor(monster.hp / 10);

    // 전투력 비율로 승률 계산 (50%를 기준으로 전투력 차이에 따라 변동)
    const powerRatio = playerPower / Math.max(1, monsterPower);
    // ratio 1.0 = 50%, ratio 2.0 = 85%, ratio 0.5 = 15%
    let baseWinRate = Math.round(50 + (powerRatio - 1) * 50);
    baseWinRate = Math.min(95, Math.max(5, baseWinRate));

    // 암송 점수 보너스 (최대 +20%)
    const scoreBonus = Math.round(data.scorePercent * 0.2);
    const finalWinRate = Math.min(99, Math.max(1, baseWinRate + scoreBonus));

    const log: string[] = [];
    log.push(`⚔️ ${character.name} (Lv.${character.level}) vs ${monster.emoji} ${monster.name} (Lv.${monster.level})`);
    log.push(`내 스탯 - 공격력: ${playerAttack} | 방어력: ${playerDefense} | HP: ${playerMaxHp} | 회피: ${playerEvasion}%`);
    log.push(`내 전투력: ${playerPower}`);
    log.push(`몬스터 - 공격력: ${monster.attack} | 방어력: ${monster.defense} | HP: ${monster.hp}`);
    log.push(`몬스터 전투력: ${monsterPower}`);
    log.push(`📖 암송 점수: ${data.scorePercent}% → 승률 +${scoreBonus}%`);
    log.push(`🎯 최종 승률: ${finalWinRate}%`);
    log.push('---');

    const roll = Math.random() * 100;
    const victory = finalWinRate >= 80 ? true : roll < finalWinRate;

    let playerHp = playerMaxHp;
    let monsterHp = monster.hp;
    const totalTurns = 4 + Math.floor(Math.random() * 3); // 4~6턴

    // 승패에 따라 데미지 분배를 미리 계산
    // 승리: 플레이어가 몬스터 HP를 턴에 걸쳐 자연스럽게 깎음
    // 패배: 몬스터가 플레이어 HP를 턴에 걸쳐 자연스럽게 깎음
    const playerDmgPerTurn = Math.max(1, playerAttack - monster.defense);
    const monsterDmgPerTurn = Math.max(1, monster.attack - playerDefense);

    for (let turn = 1; turn <= totalTurns; turn++) {
      const isLastTurn = turn === totalTurns;
      const progress = turn / totalTurns; // 0~1 진행도

      // ===== 플레이어 공격 =====
      // 승리 시: 크리 확률 높고 미스 적음 / 패배 시: 크리 적고 미스 많음
      const critChance = victory ? 0.2 + progress * 0.1 : 0.05;
      const missChance = victory ? 0.05 : 0.1 + progress * 0.1;
      const isCrit = Math.random() < critChance;
      const playerMiss = Math.random() < missChance;

      // 데미지 변동 (±30%)
      let playerDmg = Math.max(1, Math.floor(playerDmgPerTurn * (0.7 + Math.random() * 0.6)));
      if (isCrit) playerDmg = Math.floor(playerDmg * 1.5);

      if (playerMiss) {
        log.push(`${turn}턴: ${character.name}의 공격이 빗나갔다!`);
      } else if (victory && isLastTurn && monsterHp > 0) {
        // 승리 마지막 턴: 남은 HP만큼 마무리 (자연스러운 피니시)
        playerDmg = Math.max(playerDmg, monsterHp);
        monsterHp = 0;
        if (playerDmg > playerDmgPerTurn * 1.3) {
          log.push(`${turn}턴: ${character.name}의 강력한 일격! ${playerDmg} 데미지! 💥 (몬스터 HP: 0)`);
        } else {
          log.push(`${turn}턴: ${character.name}이(가) ${playerDmg} 데미지!${isCrit ? ' 💥크리티컬!' : ''} (몬스터 HP: 0)`);
        }
      } else {
        monsterHp -= playerDmg;
        if (monsterHp < 0) monsterHp = 0;
        log.push(`${turn}턴: ${character.name}이(가) ${playerDmg} 데미지!${isCrit ? ' 💥크리티컬!' : ''} (몬스터 HP: ${monsterHp})`);
      }

      if (monsterHp <= 0) break;

      // ===== 몬스터 공격 =====
      // 패배 시: 회피 확률 낮추고 후반부 강타 / 승리 시: 회피 잘 되고 데미지 약함
      const evasionChance = victory
        ? Math.min(playerEvasion + 10, 40)  // 승리 시 회피 보너스
        : Math.max(0, playerEvasion - progress * 15); // 패배 시 점점 회피 어려움
      const monsterMiss = Math.random() * 100 < evasionChance;

      // 데미지 변동
      let monsterDmg = Math.max(1, Math.floor(monsterDmgPerTurn * (0.7 + Math.random() * 0.6)));
      // 패배 시 후반부에 몬스터 데미지 강화
      if (!victory && progress > 0.5) {
        monsterDmg = Math.floor(monsterDmg * (1 + progress * 0.5));
      }
      // 승리 시 몬스터 데미지 약화
      if (victory) {
        monsterDmg = Math.floor(monsterDmg * 0.7);
      }

      if (monsterMiss) {
        log.push(`${turn}턴: ${character.name}이(가) ${monster.name}의 공격을 회피했다! 💨`);
      } else if (!victory && isLastTurn && playerHp > 0) {
        // 패배 마지막 턴: 남은 HP만큼 마무리
        monsterDmg = Math.max(monsterDmg, playerHp);
        playerHp = 0;
        if (monsterDmg > monsterDmgPerTurn * 1.3) {
          log.push(`${turn}턴: ${monster.name}의 강력한 일격! ${monsterDmg} 데미지! (내 HP: 0)`);
        } else {
          log.push(`${turn}턴: ${monster.name}이(가) ${monsterDmg} 데미지! (내 HP: 0)`);
        }
      } else {
        playerHp -= monsterDmg;
        if (playerHp < 0) playerHp = 0;
        log.push(`${turn}턴: ${monster.name}이(가) ${monsterDmg} 데미지! (내 HP: ${playerHp})`);
      }

      if (playerHp <= 0) break;
    }

    let battleExp = 0;
    const battleRewards: any[] = [];

    if (victory) {
      battleExp = monster.exp_reward;
      log.push('---');
      log.push(`🎉 승리! 전투 경험치 +${battleExp}`);

      // 상자 드랍 (55% 확률) → 장비 55% / 소모품 45% (100점권 사용 시 드랍 없음)
      if (!data.noDrop && Math.random() < 0.55) {
        log.push(`🎁 아이템 상자를 획득했다!`);
        if (Math.random() < 0.55) {
          // 장비 드랍
          const droppedItem = generateRandomItem(monster.level);
          run('INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [droppedItem.name, droppedItem.description, droppedItem.type, droppedItem.stat_type, droppedItem.stat_bonus, droppedItem.rarity, droppedItem.level_req]);
          const newItem = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
          run('INSERT INTO character_items (character_id, item_id, is_equipped) VALUES (?, ?, 0)', [data.characterId, newItem.id]);
          battleRewards.push({ ...droppedItem, id: newItem.id });
        } else {
          // 소모품 드랍
          const consumableType = Math.random() < 0.5 ? 'perfect_score' : 'hint';
          const existing = queryOne('SELECT id FROM consumables WHERE character_id = ? AND type = ?', [data.characterId, consumableType]);
          if (existing) {
            run('UPDATE consumables SET quantity = quantity + 1 WHERE character_id = ? AND type = ?', [data.characterId, consumableType]);
          } else {
            run('INSERT INTO consumables (character_id, type, quantity) VALUES (?, ?, 1)', [data.characterId, consumableType]);
          }
          const cName = consumableType === 'perfect_score' ? '암송 100점권' : '힌트권';
          const cEmoji = consumableType === 'perfect_score' ? '📜' : '💡';
          battleRewards.push({
            id: 0, name: cName, description: consumableType === 'perfect_score' ? '암송 점수가 자동으로 100점 처리됩니다.' : '20초간 정답이 표시됩니다.',
            type: 'consumable', stat_type: 'none', stat_bonus: 0, rarity: 'uncommon', level_req: 1,
            _consumable: true, _emoji: cEmoji,
          });
        }
      }
    } else {
      log.push('---');
      log.push('💀 패배... 다음엔 더 강해져서 도전하자!');
    }

    let battleLeveledUp = false;
    let battleLevelRewards: any[] = [];
    if (victory && battleExp > 0) {
      const charNow = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
      if (charNow) {
        let newExp = charNow.exp + battleExp;
        let newLevel = charNow.level;
        let maxExp = charNow.max_exp;

        while (newExp >= maxExp) {
          newExp -= maxExp;
          newLevel++;
          maxExp = newLevel * 100;
          battleLeveledUp = true;

          const item = generateRandomItem(newLevel);
          run('INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [item.name, item.description, item.type, item.stat_type, item.stat_bonus, item.rarity, item.level_req]);
          const newItem = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
          run('INSERT INTO character_items (character_id, item_id, is_equipped) VALUES (?, ?, 0)', [data.characterId, newItem.id]);
          battleLevelRewards.push({ ...item, id: newItem.id });
        }

        run('UPDATE characters SET exp = ?, level = ?, max_exp = ? WHERE id = ?', [newExp, newLevel, maxExp, data.characterId]);
      }
    }

    return {
      victory, log, battleExp, battleRewards: [...battleRewards, ...battleLevelRewards],
      monsterName: monster.name, monsterEmoji: monster.emoji, battleLeveledUp,
    };
  };

  // ===== 아이템 =====
  handlers['inventory:getItems'] = (characterId: number) => {
    return queryAll(`
      SELECT i.*, ci.is_equipped, ci.enhance_level, ci.id as ci_id
      FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.character_id = ?
      ORDER BY ci.is_equipped DESC, i.rarity DESC
    `, [characterId]);
  };

  handlers['inventory:equipItem'] = (data: { characterId: number; ciId: number; itemType: string }) => {
    const equipped = queryAll(`
      SELECT ci.id FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.character_id = ? AND i.type = ? AND ci.is_equipped = 1
    `, [data.characterId, data.itemType]);
    for (const eq of equipped) {
      run('UPDATE character_items SET is_equipped = 0 WHERE id = ?', [eq.id]);
    }
    run('UPDATE character_items SET is_equipped = 1 WHERE id = ? AND character_id = ?', [data.ciId, data.characterId]);
    return true;
  };

  handlers['inventory:unequipItem'] = (data: { ciId: number; characterId: number }) => {
    run('UPDATE character_items SET is_equipped = 0 WHERE id = ? AND character_id = ?', [data.ciId, data.characterId]);
    return true;
  };

  handlers['inventory:discardItem'] = (data: { ciId: number; characterId: number }) => {
    run('DELETE FROM character_items WHERE id = ? AND character_id = ? AND is_equipped = 0', [data.ciId, data.characterId]);
    return true;
  };

  handlers['inventory:synthesize'] = (data: { characterId: number; ciIds: number[] }) => {
    if (data.ciIds.length !== 3) return { success: false, message: '아이템 3개가 필요합니다.' };

    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'mythic'];
    const itemInfos = data.ciIds.map(ciId => {
      return queryOne(`
        SELECT i.*, ci.id as ci_id, ci.is_equipped, ci.enhance_level FROM character_items ci
        JOIN items i ON ci.item_id = i.id
        WHERE ci.id = ? AND ci.character_id = ?
      `, [ciId, data.characterId]);
    });

    if (itemInfos.some((i: any) => !i)) return { success: false, message: '아이템을 찾을 수 없습니다.' };
    if (itemInfos.some((i: any) => i.is_equipped)) return { success: false, message: '장착 중인 아이템은 합성할 수 없습니다.' };

    const firstName = itemInfos[0].name;
    const firstRarity = itemInfos[0].rarity;
    if (!itemInfos.every((i: any) => i.name === firstName && i.rarity === firstRarity)) {
      return { success: false, message: '같은 이름, 같은 등급 아이템 3개가 필요합니다.' };
    }

    const rarityIdx = rarityOrder.indexOf(firstRarity);
    if (rarityIdx >= rarityOrder.length - 1) return { success: false, message: '신화 등급은 더 이상 합성할 수 없습니다.' };

    const newRarity = rarityOrder[rarityIdx + 1];
    const rarityKor: Record<string, string> = { common: '일반', uncommon: '고급', rare: '희귀', epic: '전설', mythic: '신화' };

    // 재료 중 최고 레벨 적용, 능력치는 해당 레벨 + 새 등급 기준 재계산
    const maxLevel = Math.max(...itemInfos.map((i: any) => i.level_req || 1));
    const newRarityMultiplier = [1.0, 1.5, 2.0, 3.0, 5.0][rarityIdx + 1];
    const statType = itemInfos[0].stat_type;
    const newStatBonus = statType === 'evasion'
      ? Math.floor((1 + Math.floor(maxLevel / 15)) * newRarityMultiplier)
      : Math.floor((10 + maxLevel * 5) * newRarityMultiplier);

    for (const ciId of data.ciIds) {
      run('DELETE FROM character_items WHERE id = ? AND character_id = ?', [ciId, data.characterId]);
    }

    const statName = statType === 'attack' ? '공격력' : statType === 'defense' ? '방어력' : statType === 'evasion' ? '회피율' : '체력';
    const desc = `${rarityKor[newRarity]} 등급 장비. ${statName} +${newStatBonus}`;
    run('INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [firstName, desc, itemInfos[0].type, statType, newStatBonus, newRarity, maxLevel]);
    const newItem = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
    run('INSERT INTO character_items (character_id, item_id, is_equipped, enhance_level) VALUES (?, ?, 0, 0)', [data.characterId, newItem.id]);

    return { success: true, message: `합성 성공! ${firstName} [${rarityKor[newRarity]}]` };
  };

  handlers['inventory:enhance'] = (data: { characterId: number; targetCiId: number; materialCiId: number }) => {
    const target = queryOne(`
      SELECT i.*, ci.id as ci_id, ci.enhance_level FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.id = ? AND ci.character_id = ?
    `, [data.targetCiId, data.characterId]);

    const material = queryOne(`
      SELECT i.*, ci.id as ci_id, ci.is_equipped FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.id = ? AND ci.character_id = ?
    `, [data.materialCiId, data.characterId]);

    if (!target || !material) return { success: false, message: '아이템을 찾을 수 없습니다.' };
    if (material.is_equipped) return { success: false, message: '장착 중인 아이템은 재료로 사용할 수 없습니다.' };
    if (target.name !== material.name) return { success: false, message: '같은 이름의 아이템만 재료로 사용할 수 있습니다.' };

    // 강화 확률: 1~5강 100%, 6강 80%, 7강 60%, 8강 40%, 9강 20%, 10강 10%, 11+ 5%
    const nextLevel = target.enhance_level + 1;
    const successRates: Record<number, number> = { 6: 80, 7: 60, 8: 40, 9: 20, 10: 10 };
    const rate = nextLevel <= 5 ? 100 : (successRates[nextLevel] ?? 5);
    const success = Math.random() * 100 < rate;

    // 재료는 무조건 소모
    run('DELETE FROM character_items WHERE id = ? AND character_id = ?', [data.materialCiId, data.characterId]);

    // 재료 레벨이 더 높으면 타겟 레벨을 올리고 능력치 재계산
    const materialLevel = material.level_req || 1;
    const targetLevel = target.level_req || 1;
    if (materialLevel > targetLevel) {
      const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'mythic'];
      const rarityMultiplier = [1.0, 1.5, 2.0, 3.0, 5.0][rarityOrder.indexOf(target.rarity)];
      const newStatBonus = target.stat_type === 'evasion'
        ? Math.floor((1 + Math.floor(materialLevel / 15)) * rarityMultiplier)
        : Math.floor((10 + materialLevel * 5) * rarityMultiplier);
      run('UPDATE items SET level_req = ?, stat_bonus = ? WHERE id = ?', [materialLevel, newStatBonus, target.item_id]);
    }

    if (success) {
      run('UPDATE character_items SET enhance_level = ? WHERE id = ? AND character_id = ?', [nextLevel, data.targetCiId, data.characterId]);
      return { success: true, message: `강화 성공! ${target.name} +${nextLevel} (성공률 ${rate}%)` };
    } else {
      return { success: false, message: `강화 실패... ${target.name} +${target.enhance_level} 유지 (성공률 ${rate}%)` };
    }
  };

  handlers['inventory:transfer'] = (data: { ciId: number; fromCharacterId: number; toCharacterId: number }) => {
    const ci = queryOne(`
      SELECT ci.*, i.name FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.id = ? AND ci.character_id = ? AND ci.is_equipped = 0
    `, [data.ciId, data.fromCharacterId]);
    if (!ci) return { success: false, message: '아이템을 찾을 수 없거나 장착 중입니다.' };

    const toChar = queryOne('SELECT id, name FROM characters WHERE id = ?', [data.toCharacterId]);
    if (!toChar) return { success: false, message: '대상 캐릭터를 찾을 수 없습니다.' };

    run('UPDATE character_items SET character_id = ? WHERE id = ?', [data.toCharacterId, data.ciId]);
    saveDb();
    return { success: true, message: `${ci.name}을(를) ${toChar.name}에게 전달했습니다!` };
  };

  // 네트워크 선물: 아이템 데이터를 받아서 캐릭터에 추가
  handlers['gift:receiveItem'] = (data: { characterId: number; item: { name: string; description: string; type: string; stat_type: string; stat_bonus: number; rarity: string; level_req: number; enhance_level: number } }) => {
    const database = getDb();
    database.run('INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.item.name, data.item.description || '', data.item.type, data.item.stat_type, data.item.stat_bonus, data.item.rarity, data.item.level_req]);
    const stmt = database.prepare('SELECT last_insert_rowid() as id');
    stmt.step();
    const newItemId = stmt.getAsObject().id;
    stmt.free();
    database.run('INSERT INTO character_items (character_id, item_id, is_equipped, enhance_level) VALUES (?, ?, 0, ?)',
      [data.characterId, newItemId, data.item.enhance_level || 0]);
    saveDb();
    return { success: true };
  };

  // ===== 소모품 =====
  handlers['consumable:getAll'] = (characterId: number) => {
    return queryAll('SELECT type, quantity FROM consumables WHERE character_id = ? AND quantity > 0', [characterId]);
  };

  handlers['consumable:use'] = (data: { characterId: number; type: string }) => {
    const row = queryOne('SELECT quantity FROM consumables WHERE character_id = ? AND type = ?', [data.characterId, data.type]);
    if (!row || row.quantity <= 0) return { success: false, message: '소모품이 부족합니다.' };
    run('UPDATE consumables SET quantity = quantity - 1 WHERE character_id = ? AND type = ?', [data.characterId, data.type]);
    return { success: true };
  };

  // 소모품 전송 (네트워크 아이템 주기)
  handlers['consumable:transfer'] = (data: { fromCharacterId: number; toCharacterId: number; type: string; quantity: number }) => {
    const row = queryOne('SELECT quantity FROM consumables WHERE character_id = ? AND type = ?', [data.fromCharacterId, data.type]);
    if (!row || row.quantity < data.quantity) return { success: false, message: '소모품이 부족합니다.' };

    // 보내는 쪽 차감
    run('UPDATE consumables SET quantity = quantity - ? WHERE character_id = ? AND type = ?', [data.quantity, data.fromCharacterId, data.type]);

    // 받는 쪽 추가
    const toRow = queryOne('SELECT id FROM consumables WHERE character_id = ? AND type = ?', [data.toCharacterId, data.type]);
    if (toRow) {
      run('UPDATE consumables SET quantity = quantity + ? WHERE character_id = ? AND type = ?', [data.quantity, data.toCharacterId, data.type]);
    } else {
      run('INSERT INTO consumables (character_id, type, quantity) VALUES (?, ?, ?)', [data.toCharacterId, data.type, data.quantity]);
    }
    saveDb();
    return { success: true };
  };

  handlers['consumable:add'] = (data: { characterId: number; type: string; quantity: number }) => {
    const row = queryOne('SELECT id FROM consumables WHERE character_id = ? AND type = ?', [data.characterId, data.type]);
    if (row) {
      run('UPDATE consumables SET quantity = quantity + ? WHERE character_id = ? AND type = ?', [data.quantity, data.characterId, data.type]);
    } else {
      run('INSERT INTO consumables (character_id, type, quantity) VALUES (?, ?, ?)', [data.characterId, data.type, data.quantity]);
    }
    saveDb();
    return { success: true };
  };

  // ===== 파일 내보내기/가져오기 =====
  handlers['file:getExportData'] = () => {
    const getSetting = (key: string, def: string) => {
      const row = queryOne("SELECT value FROM game_settings WHERE key = ?", [key]);
      return row ? row.value : def;
    };
    const settings = {
      book: getSetting('book', '시편'),
      chapter: getSetting('chapter', '119'),
      startVerse: parseInt(getSetting('start_verse', '1')),
      verseCount: parseInt(getSetting('verse_count', '10')),
    };
    const verses = queryAll(
      'SELECT verse_number, content, blank_template FROM verses WHERE book = ? AND chapter = ? AND verse_number >= ? ORDER BY verse_number LIMIT ?',
      [settings.book, parseInt(settings.chapter), settings.startVerse, settings.verseCount]
    );
    return { settings, verses };
  };

  handlers['file:importData'] = (data: { settings: any; verses: any[] }) => {
    const saveSetting = (key: string, value: string) => {
      const existing = queryOne("SELECT id FROM game_settings WHERE key = ?", [key]);
      if (existing) {
        run("UPDATE game_settings SET value = ? WHERE key = ?", [value, key]);
      } else {
        run("INSERT INTO game_settings (key, value) VALUES (?, ?)", [key, value]);
      }
    };
    saveSetting('book', data.settings.book);
    saveSetting('chapter', data.settings.chapter);
    saveSetting('start_verse', String(data.settings.startVerse));
    saveSetting('verse_count', String(data.settings.verseCount));

    for (const v of data.verses) {
      const existing = queryOne('SELECT id FROM verses WHERE book = ? AND chapter = ? AND verse_number = ?',
        [data.settings.book, parseInt(data.settings.chapter), v.verse_number]);
      if (existing) {
        run('UPDATE verses SET content = ?, blank_template = ? WHERE id = ?', [v.content, v.blank_template || '', existing.id]);
      } else {
        run('INSERT INTO verses (book, chapter, verse_number, content, blank_template) VALUES (?, ?, ?, ?, ?)',
          [data.settings.book, parseInt(data.settings.chapter), v.verse_number, v.content, v.blank_template || '']);
      }
    }
    return true;
  };

  handlers['file:getCharacterExportData'] = (characterId: number) => {
    const character = queryOne('SELECT name, character_type, level, exp, max_exp, description, recite_mode FROM characters WHERE id = ?', [characterId]);
    if (!character) return null;

    const items = queryAll(`
      SELECT i.name, i.description, i.type, i.stat_type, i.stat_bonus, i.rarity, i.level_req, ci.is_equipped, ci.enhance_level
      FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.character_id = ?
    `, [characterId]);

    return { character, items };
  };

  handlers['file:importCharacterData'] = (data: { character: any; items: any[] }) => {
    const c = data.character;
    run('INSERT INTO characters (name, character_type, level, exp, max_exp, description, recite_mode) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [c.name, c.character_type, c.level, c.exp, c.max_exp, c.description, c.recite_mode]);
    const newChar = queryOne('SELECT id FROM characters ORDER BY id DESC LIMIT 1');
    if (!newChar) return { success: false };

    for (const item of data.items) {
      run('INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [item.name, item.description, item.type, item.stat_type, item.stat_bonus, item.rarity, item.level_req]);
      const newItem = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
      run('INSERT INTO character_items (character_id, item_id, is_equipped, enhance_level) VALUES (?, ?, ?, ?)',
        [newChar.id, newItem.id, item.is_equipped, item.enhance_level || 0]);
    }

    return { success: true, characterId: newChar.id };
  };

  // ===== DB 초기화 =====
  handlers['admin:clearDb'] = () => {
    const db = getDb();
    db.run('DELETE FROM character_items');
    db.run('DELETE FROM items');
    db.run('DELETE FROM consumables');
    db.run('DELETE FROM characters');
    db.run('DELETE FROM verses');
    db.run('DELETE FROM game_settings');
    db.run('DELETE FROM pvp_records');
    saveDb();
    return true;
  };

  // ===== PvP 전적 =====
  handlers['pvp:getRecord'] = (characterName: string) => {
    const record = queryOne('SELECT wins, losses FROM pvp_records WHERE character_name = ?', [characterName]);
    return record || { wins: 0, losses: 0 };
  };

  // PvP 경험치 지급
  handlers['pvp:grantExp'] = (data: { characterId: number; exp: number }) => {
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    if (!character || data.exp <= 0) return { earnedExp: 0, leveledUp: false };

    let newExp = character.exp + data.exp;
    let newLevel = character.level;
    let maxExp = character.max_exp;
    let leveledUp = false;

    while (newExp >= maxExp) {
      newExp -= maxExp;
      newLevel++;
      maxExp = newLevel * 100;
      leveledUp = true;
    }

    run('UPDATE characters SET exp = ?, level = ?, max_exp = ? WHERE id = ?', [newExp, newLevel, maxExp, data.characterId]);
    saveDb();
    return { earnedExp: data.exp, leveledUp, newLevel, newExp, maxExp };
  };

  handlers['pvp:updateRecord'] = (data: { characterName: string; win: boolean }) => {
    const existing = queryOne('SELECT id FROM pvp_records WHERE character_name = ?', [data.characterName]);
    if (existing) {
      if (data.win) {
        run('UPDATE pvp_records SET wins = wins + 1 WHERE character_name = ?', [data.characterName]);
      } else {
        run('UPDATE pvp_records SET losses = losses + 1 WHERE character_name = ?', [data.characterName]);
      }
    } else {
      run('INSERT INTO pvp_records (character_name, wins, losses) VALUES (?, ?, ?)',
        [data.characterName, data.win ? 1 : 0, data.win ? 0 : 1]);
    }
    return true;
  };

  // ===== 보스 시스템 =====

  // 보스 데이터 (constants.ts와 동일 구조)
  const BOSS_DATA: Record<number, { name: string; emoji: string; title: string; quizRange: [number, number] }> = {
    1: { name: '타락한 뱀', emoji: '🐍', title: '에덴의 지배자', quizRange: [1, 1] },
    2: { name: '여왕벌레 플로라', emoji: '🦟', title: '동산의 포식자', quizRange: [1, 2] },
    3: { name: '그림자 속삭이는 자', emoji: '👤', title: '유혹의 화신', quizRange: [1, 3] },
    4: { name: '타락천사 아자젤', emoji: '😈', title: '실락원의 군주', quizRange: [1, 5] },
    5: { name: '사막의 폭군 스콜피온', emoji: '🦂', title: '가시 사막의 왕', quizRange: [1, 7] },
    6: { name: '교만의 거인 니므롯', emoji: '🗿', title: '바벨의 망령', quizRange: [1, 8] },
    7: { name: '유황의 화신', emoji: '🌋', title: '소돔의 불꽃', quizRange: [1, 10] },
    8: { name: '심연의 리바이어던', emoji: '🐋', title: '대홍수의 괴수', quizRange: [1, 12] },
    9: { name: '광야의 시험자', emoji: '👁️', title: '유혹의 그림자', quizRange: [1, 13] },
    10: { name: '독의 어머니 마라', emoji: '🧪', title: '저주의 근원', quizRange: [1, 15] },
    11: { name: '금송아지의 우상', emoji: '🐂', title: '거짓 신', quizRange: [1, 17] },
    12: { name: '여리고의 철벽장군', emoji: '🛡️', title: '난공불락의 수호자', quizRange: [1, 18] },
    13: { name: '공포의 군주 골리앗', emoji: '⚔️', title: '어둠의 거인', quizRange: [1, 20] },
    14: { name: '배신자의 그림자', emoji: '💰', title: '은 서른 냥의 유혹', quizRange: [1, 22] },
    15: { name: '묵시록의 네 기사', emoji: '🏇', title: '종말의 선봉대', quizRange: [1, 24] },
    16: { name: '용광로의 불꽃 드래곤', emoji: '🐉', title: '혼돈의 용', quizRange: [1, 25] },
    17: { name: '하늘의 방해자', emoji: '🦅', title: '공중 권세', quizRange: [1, 27] },
    18: { name: '거짓 왕', emoji: '🤴', title: '왕좌의 사칭자', quizRange: [1, 29] },
    19: { name: '오염자 아바돈', emoji: '🦠', title: '멸망의 천사', quizRange: [1, 30] },
    20: { name: '어둠의 왕', emoji: '👿', title: '모든 어둠의 근원', quizRange: [1, 32] },
  };

  // 마을별 해금 레벨 (constants.ts VILLAGES와 동일)
  const VILLAGE_LEVEL_REQ: Record<number, number> = {
    1: 1, 2: 10, 3: 20, 4: 30, 5: 40, 6: 50, 7: 60, 8: 70, 9: 80, 10: 90,
    11: 100, 12: 110, 13: 120, 14: 130, 15: 140, 16: 150, 17: 160, 18: 170, 19: 180, 20: 190,
  };

  // 보스전 상태를 메모리에 보관 (캐릭터당 1개)
  const bossBattleStates: Record<number, {
    villageId: number; bossHp: number; bossMaxHp: number; bossAttack: number;
    playerHp: number; playerMaxHp: number; playerAttack: number; playerDefense: number; playerEvasion: number;
    round: number;
  }> = {};

  handlers['boss:getClears'] = (characterId: number) => {
    const rows = queryAll('SELECT village_id FROM boss_clears WHERE character_id = ?', [characterId]);
    return rows.map((r: any) => r.village_id);
  };

  handlers['boss:checkReady'] = (villageId: number) => {
    const boss = BOSS_DATA[villageId];
    if (!boss) return { ready: false, message: '보스 데이터가 없습니다.' };
    const [startVerse, endVerse] = boss.quizRange;
    // 출제에 필요한 구절이 DB에 있는지 확인
    const verses = queryAll(
      'SELECT verse_number FROM verses WHERE verse_number >= ? AND verse_number <= ? AND blank_template != ""',
      [startVerse, endVerse]
    );
    if (verses.length === 0) {
      return { ready: false, message: '아직 준비되지 않은 전투입니다.' };
    }
    return { ready: true };
  };

  handlers['boss:startBattle'] = (data: { characterId: number; villageId: number }) => {
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    if (!character) return null;

    const boss = BOSS_DATA[data.villageId];
    if (!boss) return null;

    // 플레이어 스탯 계산 (장비 반영)
    const stats = handlers['character:getStats'](data.characterId);
    const playerAttack = stats.totalAttack;
    const playerDefense = stats.totalDefense;
    const playerHp = stats.totalHp;
    const playerEvasion = stats.totalEvasion;

    // 보스 HP = 플레이어 공격력 × 10 (최소 10라운드 보장)
    const bossMaxHp = Math.max(100, playerAttack * 10);
    // 보스 공격력: 플레이어 HP의 약 1/5 ~ 1/3 (장비에 따라 5~7번 정도 버틸 수 있도록)
    const bossAttack = Math.max(10, Math.floor(playerHp / 4));

    const state = {
      villageId: data.villageId,
      bossHp: bossMaxHp,
      bossMaxHp,
      bossAttack,
      playerHp,
      playerMaxHp: playerHp,
      playerAttack,
      playerDefense,
      playerEvasion,
      round: 0,
    };
    bossBattleStates[data.characterId] = state;

    return {
      bossVillageId: data.villageId,
      bossName: boss.name,
      bossEmoji: boss.emoji,
      bossTitle: boss.title,
      bossHp: state.bossHp,
      bossMaxHp: state.bossMaxHp,
      bossAttack: state.bossAttack,
      playerHp: state.playerHp,
      playerMaxHp: state.playerMaxHp,
      playerAttack: state.playerAttack,
      playerDefense: state.playerDefense,
      playerEvasion: state.playerEvasion,
      round: 0,
      phase: 'intro',
      log: [],
      currentQuestion: null,
      timeLimit: 40,
    };
  };

  handlers['boss:getQuestion'] = (data: { villageId: number; reciteMode: number }) => {
    const boss = BOSS_DATA[data.villageId];
    if (!boss) return null;

    const [startVerse, endVerse] = boss.quizRange;
    const verses = queryAll(
      'SELECT * FROM verses WHERE verse_number >= ? AND verse_number <= ? AND blank_template != ""',
      [startVerse, endVerse]
    );
    if (verses.length === 0) return null;

    // 랜덤 구절 선택
    const verse = verses[Math.floor(Math.random() * verses.length)];

    // 보스전은 항상 빈칸 1개 모드 (PvP와 동일 - 띄어쓰기 기준 한 단어를 비움)
    const content = verse.content as string;
    const words = content.replace(/\s+/g, ' ').split(' ');
    const blankIdx = Math.floor(Math.random() * words.length);

    return {
      verseNumber: verse.verse_number,
      verseContent: content,
      words,
      blankIndices: [blankIdx],
      answers: [words[blankIdx]],
    };
  };

  handlers['boss:attack'] = (data: { characterId: number; villageId: number; correct: boolean }) => {
    const state = bossBattleStates[data.characterId];
    if (!state) return { bossHp: 0, playerHp: 0, damage: 0, dodged: false, log: '전투 상태가 없습니다.' };

    state.round++;
    let log = '';

    if (data.correct) {
      // 정답: 플레이어가 보스 공격
      const damage = state.playerAttack;
      state.bossHp = Math.max(0, state.bossHp - damage);
      log = `⚔️ ${state.round}턴: 정답! 보스에게 ${damage} 데미지!`;
    } else {
      // 오답: 보스가 플레이어 공격 (회피 판정)
      const evasionRate = Math.min(30, state.playerEvasion);
      const dodged = Math.random() * 100 < evasionRate;
      if (dodged) {
        log = `🛡️ ${state.round}턴: 오답... 하지만 공격을 회피했다!`;
      } else {
        const rawDamage = state.bossAttack - state.playerDefense;
        const damage = Math.max(1, rawDamage);
        state.playerHp = Math.max(0, state.playerHp - damage);
        log = `💥 ${state.round}턴: 오답! 보스의 공격! ${damage} 데미지를 받았다!`;
      }
    }

    return {
      bossHp: state.bossHp,
      playerHp: state.playerHp,
      damage: data.correct ? state.playerAttack : 0,
      dodged: false,
      log,
    };
  };

  handlers['boss:complete'] = (data: { characterId: number; villageId: number }) => {
    // 보스 클리어 기록
    const db = getDb();
    db.run(
      'INSERT OR IGNORE INTO boss_clears (character_id, village_id) VALUES (?, ?)',
      [data.characterId, data.villageId]
    );
    saveDb();

    // 보스 전투 상태 제거
    delete bossBattleStates[data.characterId];

    // 신화 등급 아이템 보상 생성
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    const level = character ? character.level : 1;
    const reward = generateMythicItem(level);

    // 아이템 DB 저장
    db.run(
      'INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [reward.name, reward.description, reward.type, reward.stat_type, reward.stat_bonus, 'mythic', level]
    );
    saveDb();
    const itemRow = queryOne('SELECT last_insert_rowid() as id');
    const itemId = itemRow.id;
    db.run(
      'INSERT INTO character_items (character_id, item_id, is_equipped, enhance_level) VALUES (?, ?, 0, 0)',
      [data.characterId, itemId]
    );
    saveDb();

    // 현재 빛의 조각 수
    const clears = queryAll('SELECT village_id FROM boss_clears WHERE character_id = ?', [data.characterId]);
    const lightFragment = clears.length;

    const savedItem = queryOne(`
      SELECT i.*, ci.id as ci_id, ci.is_equipped, ci.enhance_level
      FROM items i JOIN character_items ci ON i.id = ci.item_id
      WHERE i.id = ?`, [itemId]);

    return {
      victory: true,
      villageId: data.villageId,
      bossName: BOSS_DATA[data.villageId]?.name || '보스',
      bossEmoji: BOSS_DATA[data.villageId]?.emoji || '👿',
      reward: savedItem,
      lightFragment,
    };
  };

  // 컷신 관련
  handlers['cutscene:getPrologueSeen'] = (characterId: number) => {
    const row = queryOne(
      "SELECT id FROM cutscene_seen WHERE character_id = ? AND village_id = 0 AND type = 'prologue'",
      [characterId]
    );
    return !!row;
  };

  handlers['cutscene:setPrologueSeen'] = (characterId: number) => {
    const db = getDb();
    db.run(
      "INSERT OR IGNORE INTO cutscene_seen (character_id, village_id, type) VALUES (?, 0, 'prologue')",
      [characterId]
    );
    saveDb();
    return true;
  };

  handlers['cutscene:getSeen'] = (data: { characterId: number; villageId: number; type: string }) => {
    const row = queryOne(
      'SELECT id FROM cutscene_seen WHERE character_id = ? AND village_id = ? AND type = ?',
      [data.characterId, data.villageId, data.type]
    );
    return !!row;
  };

  handlers['cutscene:setSeen'] = (data: { characterId: number; villageId: number; type: string }) => {
    const db = getDb();
    db.run(
      'INSERT OR IGNORE INTO cutscene_seen (character_id, village_id, type) VALUES (?, ?, ?)',
      [data.characterId, data.villageId, data.type]
    );
    saveDb();
    return true;
  };

  return handlers;
}

// 신화 등급 아이템 생성 (보스 보상용)
function generateMythicItem(level: number) {
  const types = ['weapon', 'belt', 'chest', 'shoes', 'shield', 'helmet'];
  const type = types[Math.floor(Math.random() * types.length)];

  const mythicNames: Record<string, string> = {
    weapon: '성령의 검',
    belt: '진리의 허리띠',
    chest: '의의 호심경',
    shoes: '복음의 신',
    shield: '믿음의 방패',
    helmet: '구원의 투구',
  };

  const name = mythicNames[type];
  const statType = type === 'weapon' ? 'attack' : type === 'shield' ? 'defense' : type === 'shoes' ? 'evasion' : type === 'belt' ? 'hp' : ['attack', 'defense', 'hp'][Math.floor(Math.random() * 3)];
  const rarityMultiplier = 5.0;
  const statBonus = statType === 'evasion'
    ? Math.floor((1 + Math.floor(level / 15)) * rarityMultiplier)
    : Math.floor((10 + level * 5) * rarityMultiplier);

  return {
    name,
    description: `신화 등급 장비. ${statType === 'attack' ? '공격력' : statType === 'defense' ? '방어력' : statType === 'evasion' ? '회피율' : '체력'} +${statBonus}`,
    type, stat_type: statType, stat_bonus: statBonus, rarity: 'mythic', level_req: level,
  };
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

function generateRandomItem(level: number) {
  const types = ['weapon', 'belt', 'chest', 'shoes', 'shield', 'helmet'];
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'mythic'];
  const rarityWeights = [50, 30, 15, 1, 0.1];

  // 등급별 아이템 이름: [일반, 고급, 희귀, 전설, 신화]
  const typeNames: Record<string, string[][]> = {
    weapon: [
      ['나무 검', '철 검'],
      ['강철 검', '빛나는 검'],
      ['축복의 검', '심판의 검'],
      ['믿음의 검', '축복의 지팡이'],
      ['성령의 검'],             // 엡 6:17 "성령의 검 곧 하나님의 말씀을 가지라"
    ],
    belt: [
      ['천 허리띠', '가죽 허리띠'],
      ['철 벨트', '강화 벨트'],
      ['빛의 허리띠', '축복의 벨트'],
      ['영광의 허리띠', '은혜의 벨트'],
      ['진리의 허리띠'],         // 엡 6:14 "진리로 너희 허리띠를 띠고"
    ],
    chest: [
      ['천 갑옷', '가죽 갑옷'],
      ['철 갑옷', '강화 갑옷'],
      ['빛의 갑옷', '축복의 갑옷'],
      ['성별의 갑옷', '영광의 갑옷'],
      ['의의 호심경'],           // 엡 6:14 "의의 호심경을 붙이고"
    ],
    shoes: [
      ['천 신발', '가죽 신발'],
      ['철 신발', '강화 신발'],
      ['빛의 신발', '축복의 신발'],
      ['영광의 신발', '은혜의 신발'],
      ['복음의 신'],             // 엡 6:15 "평안의 복음이 준비한 것으로 신을 신고"
    ],
    shield: [
      ['나무 방패', '철 방패'],
      ['강철 방패', '빛의 방패'],
      ['축복의 방패', '수호의 방패'],
      ['영광의 방패', '은혜의 방패'],
      ['믿음의 방패'],           // 엡 6:16 "믿음의 방패를 가지고"
    ],
    helmet: [
      ['천 모자', '가죽 투구'],
      ['철 투구', '강화 투구'],
      ['빛의 투구', '축복의 투구'],
      ['영광의 투구', '은혜의 왕관'],
      ['구원의 투구'],           // 엡 6:17 "구원의 투구를 쓰고"
    ],
  };

  const type = types[Math.floor(Math.random() * types.length)];

  let roll = Math.random() * 100;
  let rarityIndex = 0;
  for (let i = 0; i < rarityWeights.length; i++) {
    roll -= rarityWeights[i];
    if (roll <= 0) { rarityIndex = i; break; }
  }
  const rarity = rarities[rarityIndex];

  const names = typeNames[type][rarityIndex];
  const name = names[Math.floor(Math.random() * names.length)];

  const statType = type === 'weapon' ? 'attack' : type === 'shield' ? 'defense' : type === 'shoes' ? 'evasion' : type === 'belt' ? 'hp' : ['attack', 'defense', 'hp'][Math.floor(Math.random() * 3)];
  // 등급 배율: common 1.0, uncommon 1.5, rare 2.0, epic 3.0, mythic 5.0
  const rarityMultiplier = [1.0, 1.5, 2.0, 3.0, 5.0][rarityIndex];
  // 회피는 % 수치이므로 별도 공식
  const statBonus = statType === 'evasion'
    ? Math.floor((1 + Math.floor(level / 15)) * rarityMultiplier)
    : Math.floor((10 + level * 5) * rarityMultiplier);

  const rarityKor: Record<string, string> = { common: '일반', uncommon: '고급', rare: '희귀', epic: '전설', mythic: '신화' };

  return {
    name,
    description: `${rarityKor[rarity]} 등급 장비. ${statType === 'attack' ? '공격력' : statType === 'defense' ? '방어력' : statType === 'evasion' ? '회피율' : '체력'} +${statBonus}`,
    type, stat_type: statType, stat_bonus: statBonus, rarity, level_req: level,
  };
}
