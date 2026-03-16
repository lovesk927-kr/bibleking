import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

let db: Database;
let dbPath: string;

export async function initDatabase() {
  const wasmPath = app.isPackaged
    ? path.join(process.resourcesPath, 'sql-wasm.wasm')
    : path.join(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm');
  const SQL = await initSqlJs({ locateFile: () => wasmPath });
  const isMultiMode = process.argv.includes('--multi');
  const dbName = isMultiMode ? 'bible-game-multi.db' : 'bible-game.db';
  dbPath = path.join(app.getPath('userData'), dbName);

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  createTables();
  saveDb();
}

export function getDb() {
  return db;
}

export function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Helper: run a query and return all results as objects
export function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper: run a query and return first result
export function queryOne(sql: string, params: any[] = []): any | null {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

// Helper: run a statement (INSERT/UPDATE/DELETE)
export function run(sql: string, params: any[] = []) {
  db.run(sql, params);
  saveDb();
}

// Helper: read a game setting
export function getSetting(key: string, defaultValue: string): string {
  const row = queryOne("SELECT value FROM game_settings WHERE key = ?", [key]);
  return row ? row.value : defaultValue;
}

// Helper: write a game setting (upsert)
export function saveSetting(key: string, value: string) {
  const existing = queryOne("SELECT id FROM game_settings WHERE key = ?", [key]);
  if (existing) {
    run("UPDATE game_settings SET value = ? WHERE key = ?", [value, key]);
  } else {
    run("INSERT INTO game_settings (key, value) VALUES (?, ?)", [key, value]);
  }
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book TEXT NOT NULL DEFAULT '시편',
      chapter INTEGER NOT NULL DEFAULT 119,
      verse_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      blank_template TEXT NOT NULL DEFAULT '',
      UNIQUE(book, chapter, verse_number)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      character_type INTEGER NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      exp INTEGER NOT NULL DEFAULT 0,
      max_exp INTEGER NOT NULL DEFAULT 100,
      description TEXT NOT NULL DEFAULT '',
      recite_mode INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 기존 DB 마이그레이션
  try {
    const charCols = queryAll("PRAGMA table_info(characters)");
    if (!charCols.find((c: any) => c.name === 'description')) {
      db.run("ALTER TABLE characters ADD COLUMN description TEXT NOT NULL DEFAULT ''");
    }
    if (!charCols.find((c: any) => c.name === 'recite_mode')) {
      db.run("ALTER TABLE characters ADD COLUMN recite_mode INTEGER NOT NULL DEFAULT 0");
    }
    const ciCols = queryAll("PRAGMA table_info(character_items)");
    if (!ciCols.find((c: any) => c.name === 'enhance_level')) {
      db.run("ALTER TABLE character_items ADD COLUMN enhance_level INTEGER NOT NULL DEFAULT 0");
    }
    const verseCols = queryAll("PRAGMA table_info(verses)");
    if (!verseCols.find((c: any) => c.name === 'blank_template')) {
      db.run("ALTER TABLE verses ADD COLUMN blank_template TEXT NOT NULL DEFAULT ''");
    }
  } catch (e) {
    // ignore
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      stat_type TEXT NOT NULL,
      stat_bonus INTEGER NOT NULL DEFAULT 0,
      rarity TEXT NOT NULL DEFAULT 'common',
      level_req INTEGER NOT NULL DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS character_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      is_equipped INTEGER NOT NULL DEFAULT 0,
      enhance_level INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (character_id) REFERENCES characters(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS consumables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      UNIQUE(character_id, type),
      FOREIGN KEY (character_id) REFERENCES characters(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS game_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pvp_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_name TEXT NOT NULL UNIQUE,
      wins INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS boss_clears (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      village_id INTEGER NOT NULL,
      cleared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(character_id, village_id),
      FOREIGN KEY (character_id) REFERENCES characters(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cutscene_seen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      village_id INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'prologue',
      UNIQUE(character_id, village_id, type),
      FOREIGN KEY (character_id) REFERENCES characters(id)
    )
  `);

  // 첫 실행 시 기본 암송 데이터 삽입 (시편 119편 1~32절)
  seedDefaultVerses();
}

function seedDefaultVerses() {
  const row = queryOne('SELECT COUNT(*) as cnt FROM verses');
  if (row && row.cnt > 0) return;

  const defaultVerses = [
    [1, '행위가 온전하여 여호와의 율법을 따라 행하는 자들은 복이 있음이여', '행위가 xx하여 여호와의 xx을 따라 xx는 자들은 xx 있음이여'],
    [2, '여호와의 증거들을 지키고 전심으로 여호와를 구하는 자는 복이 있도다', '여호와의 xx들을 지키고 xx으로 xxx를 xx는 자는 x이 있도다'],
    [3, '참으로 그들은 불의를 행하지 아니하고 주의 도를 행하는도다', 'xx로 그들은 xx를 행하지 아니하고 x의 x를 xx는도다'],
    [4, '주께서 명령하사 주의 법도를 잘 지키게 하셨나이다', '주께서 xx하사 주의 xx를 x 지키게 하셨나이다'],
    [5, '내 길을 굳게 정하사 주의 율례를 지키게 하소서', 'x 길을 xx 정하사 주의 xx를 지키게 하소서'],
    [6, '내가 주의 모든 계명에 주의할 때에는 부끄럽지 아니하리이다', '내가 주의 xx xx에 xx할 때에는 xxx지 아니하리이다'],
    [7, '내가 주의 의로운 판단을 배울 때에는 정직한 마음으로 주께 감사하리이다', '내가 주의 xx운 xx을 배울 xxx xxx xx으로 주께 xx하리이다'],
    [8, '내가 주의 율례들을 지키오리니 나를 아주 버리지 마옵소서', '내가 주의 xx들을 xx오리x 나를 xx 버리지 xxx서'],
    [9, '청년이 무엇으로 그의 행실을 깨끗하게 하리이까 주의 말씀만 지킬 따름이니이다', 'xx이 xx으로 그의 xxx xx하게 하리이까 주의 xx만 xx xx이니이다'],
    [10, '내가 전심으로 주를 찾았사오니 주의 계명에서 떠나지 말게 하소서', '내가 xx으로 주를 xx사오니 x의 xx에서 xx지 말x 하xx'],
    [11, '내가 주께 범죄하지 아니하려 하여 주의 말씀을 내 마음에 두었나이다', '내가 주께 xx하지 xxx려 하여 주의 xx을 x xx에 xx나이다'],
    [12, '찬송을 받으실 주 여호와여 주의 율례들을 내게 가르치소서', 'xx을 받으실 x xxx여 주의 xx들을 내게 xxx소서'],
    [13, '주의 입의 모든 규례들을 나의 입술로 선포하였으며', 'x의 x의 모든 xx들을 나의 xx로 xx하였xx'],
    [14, '내가 모든 재물을 즐거워함 같이 주의 증거들의 도를 즐거워하였나이다', '내가 모든 xxx xxx함 같이 주의 xxx의 x를 xxx하였나이다'],
    [15, '내가 주의 법도들을 작은 소리로 읊조리며 주의 길들에 주의하며', '내가 xx xx들을 x은 xx로 xx리며 주의 xx에 주의하며'],
    [16, '주의 율례들을 즐거워하며 주의 말씀을 잊지 아니하리이다', '주의 xx들을 xx워하x 주의 xxx xx 아니xx이다'],
    [17, '주의 종을 후대하여 살게 하소서 그리하시면 주의 말씀을 지키리이다', '주의 x을 xx하여 x게 하소서 xxxx면 주의 xx을 지키리이다'],
    [18, '내 눈을 열어서 주의 율법에서 놀라운 것을 보게 하소서', '내 x을 xx서 주의 xx에서 xx운 x을 xx 하소서'],
    [19, '나는 땅에서 나그네가 되었사오니 주의 계명들을 내게 숨기지 마소서', '나는 x에서 xxxx 되x사x니 주의 xx들을 xx 숨기지 xx서'],
    [20, '주의 규례들을 항상 사모함으로 내 마음이 상하나이다', 'x의 xx들을 xx xxx으로 x xx이 x하나이다'],
    [21, '교만하여 저주를 받으며 주의 계명들에서 떠나는 자들을 주께서 꾸짖으셨나이다', '교만하여 xxx 받으며 x의 xxx에서 xx는 자들을 주께서 xxx셨나이다'],
    [22, '내가 주의 교훈들을 지켰사오니 비방과 멸시를 내게서 떠나게 하소서', '내가 주의 xx들을 xx사오니 xx과 xx를 내게서 xx게 하x서'],
    [23, '고관들도 앉아서 나를 비방하였사오나 주의 종은 주의 율례들을 작은 소리로 읊조렸나이다', 'xx들도 xxx 나를 xx하였xxx 주의 xx 주의 xx들을 xx xx로 읊조렸나이다'],
    [24, '주의 증거들은 나의 즐거움이요 나의 충고자니이다', 'x의 xx들은 나의 xxx이요 나의 xxx니이다'],
    [25, '내 영혼이 진토에 붙었사오니 주의 말씀대로 나를 살아나게 하소서', 'x xx이 진x에 붙었사오니 주의 xx대로 x를 xxx게 하소서'],
    [26, '내가 나의 행위를 아뢰매 주께서 내게 응답하셨사오니 주의 율례들을 내게 가르치소서', '내가 xx xx를 xxx 주께서 내게 xx하셨사오니 주의 xx들을 내게 xx치소서'],
    [27, '나에게 주의 법도들의 길을 깨닫게 하여 주소서 그리하시면 내가 주의 기이한 일들을 작은 소리로 읊조리리이다', '나xx 주의 xx들의 x을 깨닫게 xx 주xx 그리하시면 내가 주의 xxx xx을 x은 xxx 읊조리리이다'],
    [28, '나의 영혼이 눌림으로 말미암아 녹사오니 주의 말씀대로 나를 세우소서', '나의 xx이 xx으로 xx암아 xx오x 주의 xx대로 나x xxx서'],
    [29, '거짓 행위를 내게서 떠나게 하시고 주의 법을 내게 은혜로이 베푸소서', 'xx xx를 내게서 xx게 하시고 xx x을 내게 xxx이 베푸소서'],
    [30, '내가 성실한 길을 택하고 주의 규례들을 내 앞에 두었나이다', '내가 xxx 길을 x하고 주의 xx들을 내 xx x었나이다'],
    [31, '내가 주의 증거들에 매달렸사오니 여호와여 내가 수치를 당하지 말게 하소서', '내가 주의 xx들에 xxx사오니 xxxx 내x xx를 당하x 말게 하소서'],
    [32, '주께서 내 마음을 넓히시면 내가 주의 계명들의 길로 달려가리이다', '주께서 내 마음x 넓히시x 내가 주의 xxx의 x로 달려xx이다'],
  ];

  // settings
  db.run("INSERT OR IGNORE INTO game_settings (key, value) VALUES ('book', '시편')");
  db.run("INSERT OR IGNORE INTO game_settings (key, value) VALUES ('chapter', '119')");
  db.run("INSERT OR IGNORE INTO game_settings (key, value) VALUES ('start_verse', '1')");
  db.run("INSERT OR IGNORE INTO game_settings (key, value) VALUES ('verse_count', '32')");

  // verses
  for (const v of defaultVerses) {
    db.run(
      "INSERT OR IGNORE INTO verses (book, chapter, verse_number, content, blank_template) VALUES ('시편', 119, ?, ?, ?)",
      [v[0] as number, v[1] as string, v[2] as string]
    );
  }
}
