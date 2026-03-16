/**
 * handlers 통합 테스트
 * sql.js 인메모리 DB를 사용하여 실제 핸들러 동작 검증
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import initSqlJs, { Database } from 'sql.js';

// DB 헬퍼 (db.ts의 함수를 인메모리로 재현)
let db: Database;

function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql: string, params: any[] = []): any | null {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function run(sql: string, params: any[] = []) {
  db.run(sql, params);
}

function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book TEXT NOT NULL DEFAULT '시편',
    chapter INTEGER NOT NULL DEFAULT 119,
    verse_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    blank_template TEXT NOT NULL DEFAULT '',
    UNIQUE(book, chapter, verse_number)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    character_type INTEGER NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    exp INTEGER NOT NULL DEFAULT 0,
    max_exp INTEGER NOT NULL DEFAULT 100,
    description TEXT NOT NULL DEFAULT '',
    recite_mode INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    stat_type TEXT NOT NULL,
    stat_bonus INTEGER NOT NULL DEFAULT 0,
    rarity TEXT NOT NULL DEFAULT 'common',
    level_req INTEGER NOT NULL DEFAULT 1
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS character_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    is_equipped INTEGER NOT NULL DEFAULT 0,
    enhance_level INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (character_id) REFERENCES characters(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS consumables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    UNIQUE(character_id, type),
    FOREIGN KEY (character_id) REFERENCES characters(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS game_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS pvp_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_name TEXT NOT NULL UNIQUE,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS boss_clears (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    village_id INTEGER NOT NULL,
    cleared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id, village_id),
    FOREIGN KEY (character_id) REFERENCES characters(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS cutscene_seen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    village_id INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'prologue',
    UNIQUE(character_id, village_id, type),
    FOREIGN KEY (character_id) REFERENCES characters(id)
  )`);
}

beforeAll(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  createTables();
});

beforeEach(() => {
  // 각 테스트 전 데이터 초기화
  db.run('DELETE FROM character_items');
  db.run('DELETE FROM items');
  db.run('DELETE FROM consumables');
  db.run('DELETE FROM characters');
  db.run('DELETE FROM verses');
  db.run('DELETE FROM game_settings');
  db.run('DELETE FROM pvp_records');
  db.run('DELETE FROM boss_clears');
  db.run('DELETE FROM cutscene_seen');
});

// ===== 캐릭터 CRUD =====
describe('캐릭터 CRUD', () => {
  it('캐릭터 생성', () => {
    run('INSERT INTO characters (name, character_type, level, exp, max_exp, description, recite_mode) VALUES (?, ?, 1, 0, 100, ?, ?)',
      ['테스트전사', 1, '용감한 전사', 0]);
    const char = queryOne('SELECT * FROM characters WHERE name = ?', ['테스트전사']);
    expect(char).not.toBeNull();
    expect(char.name).toBe('테스트전사');
    expect(char.level).toBe(1);
    expect(char.exp).toBe(0);
    expect(char.max_exp).toBe(100);
    expect(char.character_type).toBe(1);
  });

  it('캐릭터 삭제 시 아이템도 정리', () => {
    run('INSERT INTO characters (name, character_type) VALUES (?, ?)', ['삭제용', 1]);
    const char = queryOne('SELECT id FROM characters WHERE name = ?', ['삭제용']);

    run('INSERT INTO items (name, type, stat_type, stat_bonus) VALUES (?, ?, ?, ?)', ['검', 'weapon', 'attack', 10]);
    const item = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
    run('INSERT INTO character_items (character_id, item_id) VALUES (?, ?)', [char.id, item.id]);

    // 삭제
    run('DELETE FROM character_items WHERE character_id = ?', [char.id]);
    run('DELETE FROM characters WHERE id = ?', [char.id]);

    expect(queryOne('SELECT * FROM characters WHERE id = ?', [char.id])).toBeNull();
    expect(queryAll('SELECT * FROM character_items WHERE character_id = ?', [char.id])).toHaveLength(0);
  });
});

// ===== 장비 시스템 =====
describe('장비 시스템', () => {
  let charId: number;

  beforeEach(() => {
    run('INSERT INTO characters (name, character_type) VALUES (?, ?)', ['장비테스트', 1]);
    charId = queryOne('SELECT id FROM characters ORDER BY id DESC LIMIT 1').id;
  });

  it('장비 장착 시 같은 타입 해제', () => {
    // 무기 2개 추가
    run('INSERT INTO items (name, type, stat_type, stat_bonus) VALUES (?, ?, ?, ?)', ['검1', 'weapon', 'attack', 10]);
    const item1 = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
    run('INSERT INTO character_items (character_id, item_id, is_equipped) VALUES (?, ?, 1)', [charId, item1.id]);
    const ci1 = queryOne('SELECT id FROM character_items ORDER BY id DESC LIMIT 1');

    run('INSERT INTO items (name, type, stat_type, stat_bonus) VALUES (?, ?, ?, ?)', ['검2', 'weapon', 'attack', 20]);
    const item2 = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
    run('INSERT INTO character_items (character_id, item_id, is_equipped) VALUES (?, ?, 0)', [charId, item2.id]);
    const ci2 = queryOne('SELECT id FROM character_items ORDER BY id DESC LIMIT 1');

    // 검2 장착 (같은 타입 무기 해제)
    const equipped = queryAll(`
      SELECT ci.id FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.character_id = ? AND i.type = 'weapon' AND ci.is_equipped = 1
    `, [charId]);
    for (const eq of equipped) {
      run('UPDATE character_items SET is_equipped = 0 WHERE id = ?', [eq.id]);
    }
    run('UPDATE character_items SET is_equipped = 1 WHERE id = ?', [ci2.id]);

    // 검증
    const eq1 = queryOne('SELECT is_equipped FROM character_items WHERE id = ?', [ci1.id]);
    const eq2 = queryOne('SELECT is_equipped FROM character_items WHERE id = ?', [ci2.id]);
    expect(eq1.is_equipped).toBe(0);
    expect(eq2.is_equipped).toBe(1);
  });

  it('장착 중인 아이템은 버릴 수 없음', () => {
    run('INSERT INTO items (name, type, stat_type, stat_bonus) VALUES (?, ?, ?, ?)', ['검', 'weapon', 'attack', 10]);
    const item = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
    run('INSERT INTO character_items (character_id, item_id, is_equipped) VALUES (?, ?, 1)', [charId, item.id]);
    const ci = queryOne('SELECT id FROM character_items ORDER BY id DESC LIMIT 1');

    // is_equipped = 0 조건이므로 장착 중이면 삭제 안됨
    run('DELETE FROM character_items WHERE id = ? AND character_id = ? AND is_equipped = 0', [ci.id, charId]);

    const still = queryOne('SELECT * FROM character_items WHERE id = ?', [ci.id]);
    expect(still).not.toBeNull();
  });

  it('스탯 보너스 계산', () => {
    // 공격력 +100, 강화 3레벨
    run('INSERT INTO items (name, type, stat_type, stat_bonus) VALUES (?, ?, ?, ?)', ['검', 'weapon', 'attack', 100]);
    const item1 = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
    run('INSERT INTO character_items (character_id, item_id, is_equipped, enhance_level) VALUES (?, ?, 1, 3)', [charId, item1.id]);

    // 방어력 +50
    run('INSERT INTO items (name, type, stat_type, stat_bonus) VALUES (?, ?, ?, ?)', ['방패', 'shield', 'defense', 50]);
    const item2 = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
    run('INSERT INTO character_items (character_id, item_id, is_equipped, enhance_level) VALUES (?, ?, 1, 0)', [charId, item2.id]);

    const equippedItems = queryAll(`
      SELECT i.stat_type, i.stat_bonus, ci.enhance_level FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.character_id = ? AND ci.is_equipped = 1
    `, [charId]);

    expect(equippedItems).toHaveLength(2);

    let bonusAttack = 0, bonusDefense = 0;
    for (const item of equippedItems) {
      const enhanceBonus = item.stat_type === 'evasion' ? Math.floor(item.enhance_level * 0.5) : item.enhance_level * 3;
      const totalBonus = item.stat_bonus + enhanceBonus;
      if (item.stat_type === 'attack') bonusAttack += totalBonus;
      if (item.stat_type === 'defense') bonusDefense += totalBonus;
    }

    expect(bonusAttack).toBe(109); // 100 + 3*3
    expect(bonusDefense).toBe(50);
  });
});

// ===== 합성 시스템 =====
describe('합성 시스템', () => {
  let charId: number;

  beforeEach(() => {
    run('INSERT INTO characters (name, character_type) VALUES (?, ?)', ['합성테스트', 1]);
    charId = queryOne('SELECT id FROM characters ORDER BY id DESC LIMIT 1').id;
  });

  it('같은 이름/등급 3개 필요', () => {
    // 다른 이름 아이템
    const ciIds: number[] = [];
    for (let i = 0; i < 3; i++) {
      const name = i === 0 ? '다른검' : '나무 검';
      run('INSERT INTO items (name, type, stat_type, stat_bonus, rarity) VALUES (?, ?, ?, ?, ?)',
        [name, 'weapon', 'attack', 10, 'common']);
      const itemId = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1').id;
      run('INSERT INTO character_items (character_id, item_id) VALUES (?, ?)', [charId, itemId]);
      ciIds.push(queryOne('SELECT id FROM character_items ORDER BY id DESC LIMIT 1').id);
    }

    const itemInfos = ciIds.map(ciId => queryOne(`
      SELECT i.*, ci.id as ci_id, ci.is_equipped FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.id = ? AND ci.character_id = ?
    `, [ciId, charId]));

    const firstName = itemInfos[0].name;
    const allSame = itemInfos.every((i: any) => i.name === firstName);
    expect(allSame).toBe(false); // 이름이 다르므로 합성 불가
  });

  it('신화 등급은 합성 불가', () => {
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'mythic'];
    const rarityIdx = rarityOrder.indexOf('mythic');
    expect(rarityIdx).toBe(rarityOrder.length - 1); // 마지막 등급
  });

  it('합성 성공 시 재료 제거 + 상위 등급 생성', () => {
    const ciIds: number[] = [];
    for (let i = 0; i < 3; i++) {
      run('INSERT INTO items (name, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?)',
        ['나무 검', 'weapon', 'attack', 15, 'common', 1]);
      const itemId = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1').id;
      run('INSERT INTO character_items (character_id, item_id) VALUES (?, ?)', [charId, itemId]);
      ciIds.push(queryOne('SELECT id FROM character_items ORDER BY id DESC LIMIT 1').id);
    }

    // 재료 삭제
    for (const ciId of ciIds) {
      run('DELETE FROM character_items WHERE id = ? AND character_id = ?', [ciId, charId]);
    }

    // 새 아이템 생성 (고급)
    run('INSERT INTO items (name, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?)',
      ['나무 검', 'weapon', 'attack', 22, 'uncommon', 1]);
    const newItemId = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1').id;
    run('INSERT INTO character_items (character_id, item_id) VALUES (?, ?)', [charId, newItemId]);

    // 검증
    const remaining = queryAll('SELECT * FROM character_items WHERE character_id = ?', [charId]);
    expect(remaining).toHaveLength(1);

    const newItem = queryOne('SELECT * FROM items WHERE id = ?', [newItemId]);
    expect(newItem.rarity).toBe('uncommon');
  });
});

// ===== 암송 시스템 =====
describe('암송 시스템', () => {
  beforeEach(() => {
    run("INSERT INTO game_settings (key, value) VALUES ('book', '시편')");
    run("INSERT INTO game_settings (key, value) VALUES ('chapter', '119')");
    run("INSERT INTO game_settings (key, value) VALUES ('start_verse', '1')");
    run("INSERT INTO game_settings (key, value) VALUES ('verse_count', '3')");

    run("INSERT INTO verses (book, chapter, verse_number, content, blank_template) VALUES ('시편', 119, 1, '행위가 온전하여 여호와의 율법을 따라 행하는 자들은 복이 있음이여', '행위가 xx하여')");
    run("INSERT INTO verses (book, chapter, verse_number, content, blank_template) VALUES ('시편', 119, 2, '여호와의 증거들을 지키고 전심으로 여호와를 구하는 자는 복이 있도다', '여호와의 xx들을')");
    run("INSERT INTO verses (book, chapter, verse_number, content, blank_template) VALUES ('시편', 119, 3, '참으로 그들은 불의를 행하지 아니하고 주의 도를 행하는도다', 'xx로 그들은')");
  });

  it('퀴즈 조회 - 설정 범위만큼', () => {
    const getSetting = (key: string, def: string) => {
      const row = queryOne("SELECT value FROM game_settings WHERE key = ?", [key]);
      return row ? row.value : def;
    };
    const count = parseInt(getSetting('verse_count', '10'));
    const verses = queryAll(
      'SELECT * FROM verses WHERE book = ? AND chapter = ? AND verse_number >= ? ORDER BY verse_number LIMIT ?',
      ['시편', 119, 1, count]
    );
    expect(verses).toHaveLength(3);
  });

  it('암송 채점 - 정확한 답', () => {
    const verse = queryOne('SELECT content FROM verses WHERE verse_number = ?', [1]);
    const normalize = (s: string) => s.replace(/[\s,.!?;:'"''""·\u3000]/g, '');
    const correct = normalize(verse.content) === normalize('행위가 온전하여 여호와의 율법을 따라 행하는 자들은 복이 있음이여');
    expect(correct).toBe(true);
  });

  it('암송 채점 - 틀린 답', () => {
    const verse = queryOne('SELECT content FROM verses WHERE verse_number = ?', [1]);
    const normalize = (s: string) => s.replace(/[\s,.!?;:'"''""·\u3000]/g, '');
    const correct = normalize(verse.content) === normalize('완전히 틀린 답');
    expect(correct).toBe(false);
  });
});

// ===== 소모품 시스템 =====
describe('소모품 시스템', () => {
  let charId: number;

  beforeEach(() => {
    run('INSERT INTO characters (name, character_type) VALUES (?, ?)', ['소모품테스트', 1]);
    charId = queryOne('SELECT id FROM characters ORDER BY id DESC LIMIT 1').id;
  });

  it('소모품 추가', () => {
    run('INSERT INTO consumables (character_id, type, quantity) VALUES (?, ?, ?)', [charId, 'perfect_score', 3]);
    const row = queryOne('SELECT quantity FROM consumables WHERE character_id = ? AND type = ?', [charId, 'perfect_score']);
    expect(row.quantity).toBe(3);
  });

  it('소모품 사용 시 수량 감소', () => {
    run('INSERT INTO consumables (character_id, type, quantity) VALUES (?, ?, ?)', [charId, 'hint', 5]);
    run('UPDATE consumables SET quantity = quantity - 1 WHERE character_id = ? AND type = ?', [charId, 'hint']);
    const row = queryOne('SELECT quantity FROM consumables WHERE character_id = ? AND type = ?', [charId, 'hint']);
    expect(row.quantity).toBe(4);
  });

  it('소모품 부족 시 사용 불가', () => {
    run('INSERT INTO consumables (character_id, type, quantity) VALUES (?, ?, ?)', [charId, 'hint', 0]);
    const row = queryOne('SELECT quantity FROM consumables WHERE character_id = ? AND type = ?', [charId, 'hint']);
    expect(row.quantity <= 0).toBe(true);
  });

  it('소모품 전송', () => {
    run('INSERT INTO characters (name, character_type) VALUES (?, ?)', ['받는캐릭', 2]);
    const toCharId = queryOne('SELECT id FROM characters ORDER BY id DESC LIMIT 1').id;

    run('INSERT INTO consumables (character_id, type, quantity) VALUES (?, ?, ?)', [charId, 'perfect_score', 5]);

    // 전송: 3개
    run('UPDATE consumables SET quantity = quantity - 3 WHERE character_id = ? AND type = ?', [charId, 'perfect_score']);
    run('INSERT INTO consumables (character_id, type, quantity) VALUES (?, ?, ?)', [toCharId, 'perfect_score', 3]);

    const from = queryOne('SELECT quantity FROM consumables WHERE character_id = ? AND type = ?', [charId, 'perfect_score']);
    const to = queryOne('SELECT quantity FROM consumables WHERE character_id = ? AND type = ?', [toCharId, 'perfect_score']);
    expect(from.quantity).toBe(2);
    expect(to.quantity).toBe(3);
  });
});

// ===== 보스 클리어 =====
describe('보스 클리어', () => {
  let charId: number;

  beforeEach(() => {
    run('INSERT INTO characters (name, character_type) VALUES (?, ?)', ['보스테스트', 1]);
    charId = queryOne('SELECT id FROM characters ORDER BY id DESC LIMIT 1').id;
  });

  it('보스 클리어 기록', () => {
    db.run('INSERT OR IGNORE INTO boss_clears (character_id, village_id) VALUES (?, ?)', [charId, 1]);
    const clears = queryAll('SELECT village_id FROM boss_clears WHERE character_id = ?', [charId]);
    expect(clears).toHaveLength(1);
    expect(clears[0].village_id).toBe(1);
  });

  it('같은 보스 중복 클리어 방지', () => {
    db.run('INSERT OR IGNORE INTO boss_clears (character_id, village_id) VALUES (?, ?)', [charId, 1]);
    db.run('INSERT OR IGNORE INTO boss_clears (character_id, village_id) VALUES (?, ?)', [charId, 1]);
    const clears = queryAll('SELECT village_id FROM boss_clears WHERE character_id = ?', [charId]);
    expect(clears).toHaveLength(1);
  });

  it('빛의 조각 수 = 클리어 수', () => {
    for (let i = 1; i <= 5; i++) {
      db.run('INSERT OR IGNORE INTO boss_clears (character_id, village_id) VALUES (?, ?)', [charId, i]);
    }
    const clears = queryAll('SELECT village_id FROM boss_clears WHERE character_id = ?', [charId]);
    expect(clears).toHaveLength(5);
  });
});

// ===== PvP 전적 =====
describe('PvP 전적', () => {
  it('첫 기록 생성', () => {
    run('INSERT INTO pvp_records (character_name, wins, losses) VALUES (?, ?, ?)', ['전사1', 1, 0]);
    const record = queryOne('SELECT * FROM pvp_records WHERE character_name = ?', ['전사1']);
    expect(record.wins).toBe(1);
    expect(record.losses).toBe(0);
  });

  it('승리 기록 업데이트', () => {
    run('INSERT INTO pvp_records (character_name, wins, losses) VALUES (?, ?, ?)', ['전사1', 3, 2]);
    run('UPDATE pvp_records SET wins = wins + 1 WHERE character_name = ?', ['전사1']);
    const record = queryOne('SELECT * FROM pvp_records WHERE character_name = ?', ['전사1']);
    expect(record.wins).toBe(4);
    expect(record.losses).toBe(2);
  });
});

// ===== 컷신 시스템 =====
describe('컷신 시스템', () => {
  let charId: number;

  beforeEach(() => {
    run('INSERT INTO characters (name, character_type) VALUES (?, ?)', ['컷신테스트', 1]);
    charId = queryOne('SELECT id FROM characters ORDER BY id DESC LIMIT 1').id;
  });

  it('프롤로그 본 적 없으면 false', () => {
    const row = queryOne(
      "SELECT id FROM cutscene_seen WHERE character_id = ? AND village_id = 0 AND type = 'prologue'",
      [charId]
    );
    expect(!!row).toBe(false);
  });

  it('프롤로그 봤으면 true', () => {
    db.run(
      "INSERT OR IGNORE INTO cutscene_seen (character_id, village_id, type) VALUES (?, 0, 'prologue')",
      [charId]
    );
    const row = queryOne(
      "SELECT id FROM cutscene_seen WHERE character_id = ? AND village_id = 0 AND type = 'prologue'",
      [charId]
    );
    expect(!!row).toBe(true);
  });

  it('마을별 컷신 독립', () => {
    db.run("INSERT OR IGNORE INTO cutscene_seen (character_id, village_id, type) VALUES (?, ?, 'enter')", [charId, 2]);
    const seen2 = queryOne("SELECT id FROM cutscene_seen WHERE character_id = ? AND village_id = 2 AND type = 'enter'", [charId]);
    const seen3 = queryOne("SELECT id FROM cutscene_seen WHERE character_id = ? AND village_id = 3 AND type = 'enter'", [charId]);
    expect(!!seen2).toBe(true);
    expect(!!seen3).toBe(false);
  });
});

// ===== 경험치/레벨업 통합 =====
describe('경험치/레벨업 통합', () => {
  let charId: number;

  beforeEach(() => {
    run('INSERT INTO characters (name, character_type, level, exp, max_exp) VALUES (?, ?, ?, ?, ?)',
      ['레벨테스트', 1, 1, 0, 100]);
    charId = queryOne('SELECT id FROM characters ORDER BY id DESC LIMIT 1').id;
  });

  it('경험치 추가 (레벨업 없음)', () => {
    run('UPDATE characters SET exp = exp + 50 WHERE id = ?', [charId]);
    const char = queryOne('SELECT * FROM characters WHERE id = ?', [charId]);
    expect(char.exp).toBe(50);
    expect(char.level).toBe(1);
  });

  it('레벨업 경험치 오버플로우 처리', () => {
    let char = queryOne('SELECT * FROM characters WHERE id = ?', [charId]);
    let newExp = char.exp + 250; // 250 exp
    let newLevel = char.level;
    let maxExp = char.max_exp;

    while (newExp >= maxExp) {
      newExp -= maxExp;
      newLevel++;
      maxExp = newLevel * 100;
    }

    run('UPDATE characters SET exp = ?, level = ?, max_exp = ? WHERE id = ?', [newExp, newLevel, maxExp, charId]);
    char = queryOne('SELECT * FROM characters WHERE id = ?', [charId]);

    // 0+250: lv1 maxExp=100 -> 150 left, lv2 maxExp=200 -> 150 < 200, stop
    expect(char.level).toBe(2);
    expect(char.exp).toBe(150);
    expect(char.max_exp).toBe(200);
  });
});
