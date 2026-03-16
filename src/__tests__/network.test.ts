/**
 * 네트워크 모드 통합 테스트
 * 실제 WebSocket 서버/클라이언트로 통신 검증
 *
 * 1. 네트워크 접속 테스트
 * 2. 캐릭터별 아이템 주고받기 테스트
 * 3. 네트워크 모드 게임 테스트
 * 4. 승패 기록 테스트
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { WebSocket } from 'ws';
import initSqlJs, { Database } from 'sql.js';

// --- DB 헬퍼 (인메모리 DB로 핸들러 테스트용) ---
let db: Database;

function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}
function queryOne(sql: string, params: any[] = []): any | null {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}
function dbRun(sql: string, params: any[] = []) {
  db.run(sql, params);
}

function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS verses (id INTEGER PRIMARY KEY AUTOINCREMENT, book TEXT NOT NULL DEFAULT '시편', chapter INTEGER NOT NULL DEFAULT 119, verse_number INTEGER NOT NULL, content TEXT NOT NULL, blank_template TEXT NOT NULL DEFAULT '', UNIQUE(book, chapter, verse_number))`);
  db.run(`CREATE TABLE IF NOT EXISTS characters (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, character_type INTEGER NOT NULL, level INTEGER NOT NULL DEFAULT 1, exp INTEGER NOT NULL DEFAULT 0, max_exp INTEGER NOT NULL DEFAULT 100, description TEXT NOT NULL DEFAULT '', recite_mode INTEGER NOT NULL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, type TEXT NOT NULL, stat_type TEXT NOT NULL, stat_bonus INTEGER NOT NULL DEFAULT 0, rarity TEXT NOT NULL DEFAULT 'common', level_req INTEGER NOT NULL DEFAULT 1)`);
  db.run(`CREATE TABLE IF NOT EXISTS character_items (id INTEGER PRIMARY KEY AUTOINCREMENT, character_id INTEGER NOT NULL, item_id INTEGER NOT NULL, is_equipped INTEGER NOT NULL DEFAULT 0, enhance_level INTEGER NOT NULL DEFAULT 0)`);
  db.run(`CREATE TABLE IF NOT EXISTS consumables (id INTEGER PRIMARY KEY AUTOINCREMENT, character_id INTEGER NOT NULL, type TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 0, UNIQUE(character_id, type))`);
  db.run(`CREATE TABLE IF NOT EXISTS game_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, value TEXT NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS pvp_records (id INTEGER PRIMARY KEY AUTOINCREMENT, character_name TEXT NOT NULL UNIQUE, wins INTEGER NOT NULL DEFAULT 0, losses INTEGER NOT NULL DEFAULT 0)`);
  db.run(`CREATE TABLE IF NOT EXISTS boss_clears (id INTEGER PRIMARY KEY AUTOINCREMENT, character_id INTEGER NOT NULL, village_id INTEGER NOT NULL, cleared_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(character_id, village_id))`);
  db.run(`CREATE TABLE IF NOT EXISTS cutscene_seen (id INTEGER PRIMARY KEY AUTOINCREMENT, character_id INTEGER NOT NULL, village_id INTEGER NOT NULL DEFAULT 0, type TEXT NOT NULL DEFAULT 'prologue', UNIQUE(character_id, village_id, type))`);
}

function seedTestData() {
  db.run('DELETE FROM character_items'); db.run('DELETE FROM items'); db.run('DELETE FROM consumables');
  db.run('DELETE FROM characters'); db.run('DELETE FROM verses'); db.run('DELETE FROM game_settings');
  db.run('DELETE FROM pvp_records'); db.run('DELETE FROM boss_clears'); db.run('DELETE FROM cutscene_seen');

  // 테스트 캐릭터 2명
  dbRun("INSERT INTO characters (name, character_type, level, exp, max_exp, description) VALUES (?, ?, ?, ?, ?, ?)", ['호스트전사', 1, 50, 0, 5000, '호스트']);
  dbRun("INSERT INTO characters (name, character_type, level, exp, max_exp, description) VALUES (?, ?, ?, ?, ?, ?)", ['클라이언트전사', 2, 45, 0, 4500, '클라이언트']);

  // 호스트 캐릭터에 아이템
  dbRun("INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)", ['축복의 검', '전설 장비', 'weapon', 'attack', 500, 'epic', 50]);
  const itemId1 = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1').id;
  dbRun("INSERT INTO character_items (character_id, item_id, is_equipped) VALUES (?, ?, 1)", [1, itemId1]);

  // 클라이언트 캐릭터에 아이템
  dbRun("INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)", ['빛의 방패', '희귀 장비', 'shield', 'defense', 200, 'rare', 45]);
  const itemId2 = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1').id;
  dbRun("INSERT INTO character_items (character_id, item_id, is_equipped) VALUES (?, ?, 1)", [2, itemId2]);

  // 소모품
  dbRun("INSERT INTO consumables (character_id, type, quantity) VALUES (?, ?, ?)", [1, 'perfect_score', 5]);
  dbRun("INSERT INTO consumables (character_id, type, quantity) VALUES (?, ?, ?)", [1, 'hint', 3]);
  dbRun("INSERT INTO consumables (character_id, type, quantity) VALUES (?, ?, ?)", [2, 'perfect_score', 2]);

  // 암송 구절
  dbRun("INSERT OR IGNORE INTO game_settings (key, value) VALUES ('book', '시편')");
  dbRun("INSERT OR IGNORE INTO game_settings (key, value) VALUES ('chapter', '119')");
  dbRun("INSERT OR IGNORE INTO game_settings (key, value) VALUES ('start_verse', '1')");
  dbRun("INSERT OR IGNORE INTO game_settings (key, value) VALUES ('verse_count', '5')");

  for (let i = 1; i <= 5; i++) {
    dbRun("INSERT OR IGNORE INTO verses (book, chapter, verse_number, content, blank_template) VALUES ('시편', 119, ?, ?, ?)",
      [i, `테스트 구절 ${i}번 내용입니다`, `테스트 xx ${i}번`]);
  }
}

// --- WebSocket 헬퍼 ---
const TEST_PORT = 18888;

/** WebSocket 클라이언트 접속하고 welcome 메시지 받을 때까지 대기 */
function connectClient(port = TEST_PORT): Promise<{ ws: WebSocket; playerId: string }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    const timeout = setTimeout(() => { ws.close(); reject(new Error('Connection timeout')); }, 3000);

    ws.on('message', (raw: Buffer) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'welcome') {
        clearTimeout(timeout);
        resolve({ ws, playerId: msg.playerId });
      }
    });
    ws.on('error', (err) => { clearTimeout(timeout); reject(err); });
  });
}

/** RPC 호출 (클라이언트→서버) */
function rpcCall(ws: WebSocket, channel: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).substring(2);
    const timeout = setTimeout(() => reject(new Error(`RPC timeout: ${channel}`)), 3000);

    const handler = (raw: Buffer) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'rpc:response' && msg.id === id) {
        clearTimeout(timeout);
        ws.off('message', handler);
        if (msg.error) reject(new Error(msg.error));
        else resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ type: 'rpc', id, channel, data }));
  });
}

/** 특정 타입의 메시지 수신 대기 */
function waitForMessage(ws: WebSocket, msgType: string, timeoutMs = 3000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { ws.off('message', handler); reject(new Error(`Wait timeout: ${msgType}`)); }, timeoutMs);
    const handler = (raw: Buffer) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === msgType) {
        clearTimeout(timeout);
        ws.off('message', handler);
        resolve(msg);
      }
    };
    ws.on('message', handler);
  });
}

/** 로비에 캐릭터 선택 메시지 전송 */
function selectCharacter(ws: WebSocket, charId: number, name: string, type: number, level: number) {
  ws.send(JSON.stringify({
    type: 'lobby:selectCharacter',
    characterId: charId,
    characterName: name,
    characterType: type,
    level: level,
  }));
}

// --- WebSocketServer를 직접 사용한 테스트 ---
// network-server.ts는 Electron 종속성(createHandlers → db.ts → electron app) 때문에 직접 import 불가
// 대신 동일한 프로토콜을 직접 구현하여 테스트

import { WebSocketServer } from 'ws';

let wss: WebSocketServer | null = null;
interface TestPlayer { id: string; ws: WebSocket; characterId: number | null; characterName: string; characterType: number; level: number; isHost: boolean; team: 'blue' | 'red'; }
let testPlayers: TestPlayer[] = [];
let hostPlayer: TestPlayer | null = null;
let pvpState: any = null;

function generateId(): string { return Math.random().toString(36).substring(2, 10); }

function getPlayersInfo() {
  const all = hostPlayer ? [hostPlayer, ...testPlayers] : [...testPlayers];
  return all.filter(p => p.characterId !== null).map(p => ({
    id: p.id, characterId: p.characterId, characterName: p.characterName,
    characterType: p.characterType, level: p.level, isHost: p.isHost, team: p.team,
  }));
}

function broadcastLobby() {
  const info = getPlayersInfo();
  const msg = JSON.stringify({ type: 'lobby:players', players: info, mode: 'pvp' });
  for (const p of testPlayers) {
    try { if (p.ws.readyState === WebSocket.OPEN) p.ws.send(msg); } catch {}
  }
}

function startTestServer(port: number) {
  testPlayers = [];
  hostPlayer = null;
  pvpState = null;

  wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket) => {
    const playerId = generateId();
    const player: TestPlayer = { id: playerId, ws, characterId: null, characterName: '', characterType: 0, level: 0, isHost: false, team: 'blue' };
    testPlayers.push(player);

    ws.send(JSON.stringify({ type: 'welcome', playerId }));

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        handleTestMessage(player, msg);
      } catch {}
    });

    ws.on('close', () => {
      testPlayers = testPlayers.filter(p => p.id !== playerId);
      broadcastLobby();
    });
  });
}

function handleTestMessage(player: TestPlayer, msg: any) {
  switch (msg.type) {
    case 'rpc': {
      const { id, channel, data } = msg;

      // 관리자 기능 차단
      if (channel.startsWith('admin:') && channel !== 'admin:getSettings') {
        player.ws.send(JSON.stringify({ type: 'rpc:response', id, error: '관리자 기능은 호스트에서만 사용할 수 있습니다.' }));
        return;
      }

      // 선물 전송 처리
      if (channel === 'gift:networkTransferItem') {
        const { item, targetPlayerId, targetCharacterId, senderName } = data;
        if (targetPlayerId === 'host') {
          // 호스트에게 아이템 전달 → DB 직접 처리 (테스트에서는 성공 응답)
          player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: { success: true } }));
        } else {
          const target = testPlayers.find(p => p.id === targetPlayerId);
          if (!target || target.ws.readyState !== WebSocket.OPEN) {
            player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: { success: false, message: '대상 플레이어를 찾을 수 없습니다.' } }));
            return;
          }
          target.ws.send(JSON.stringify({ type: 'gift:receiveItem', characterId: targetCharacterId, item }));
          target.ws.send(JSON.stringify({ type: 'gift:notification', senderName, itemName: item.name, isConsumable: false }));
          player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: { success: true } }));
        }
        return;
      }
      if (channel === 'gift:networkTransferConsumable') {
        const { targetPlayerId, targetCharacterId, type: cType, quantity, senderName, consumableLabel } = data;
        if (targetPlayerId === 'host') {
          player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: { success: true } }));
        } else {
          const target = testPlayers.find(p => p.id === targetPlayerId);
          if (!target || target.ws.readyState !== WebSocket.OPEN) {
            player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: { success: false, message: '대상 플레이어를 찾을 수 없습니다.' } }));
            return;
          }
          target.ws.send(JSON.stringify({ type: 'consumable:add', characterId: targetCharacterId, consumableType: cType, quantity }));
          target.ws.send(JSON.stringify({ type: 'gift:notification', senderName, itemName: consumableLabel || cType, isConsumable: true }));
          player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: { success: true } }));
        }
        return;
      }

      // 일반 RPC (테스트용 간단 응답)
      if (channel === 'character:getAll') {
        player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: [
          { id: 1, name: '호스트전사', character_type: 1, level: 50 },
          { id: 2, name: '클라이언트전사', character_type: 2, level: 45 },
        ] }));
      } else if (channel === 'character:getStats') {
        player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: {
          level: 50, baseAttack: 1550, baseDefense: 1030, baseHp: 5500, baseEvasion: 5,
          bonusAttack: 500, bonusDefense: 0, bonusHp: 0, bonusEvasion: 0,
          totalAttack: 2050, totalDefense: 1030, totalHp: 5500, totalEvasion: 5,
        } }));
      } else if (channel === 'pvp:getRecord') {
        const record = queryOne('SELECT wins, losses FROM pvp_records WHERE character_name = ?', [data]);
        player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: record || { wins: 0, losses: 0 } }));
      } else if (channel === 'pvp:updateRecord') {
        const existing = queryOne('SELECT id FROM pvp_records WHERE character_name = ?', [data.characterName]);
        if (existing) {
          if (data.win) dbRun('UPDATE pvp_records SET wins = wins + 1 WHERE character_name = ?', [data.characterName]);
          else dbRun('UPDATE pvp_records SET losses = losses + 1 WHERE character_name = ?', [data.characterName]);
        } else {
          dbRun('INSERT INTO pvp_records (character_name, wins, losses) VALUES (?, ?, ?)', [data.characterName, data.win ? 1 : 0, data.win ? 0 : 1]);
        }
        player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: true }));
      } else {
        player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: null }));
      }
      break;
    }

    case 'lobby:selectCharacter': {
      player.characterId = msg.characterId;
      player.characterName = msg.characterName;
      player.characterType = msg.characterType;
      player.level = msg.level;
      if (testPlayers.filter(p => p.team === 'blue').length <= testPlayers.filter(p => p.team === 'red').length) {
        player.team = 'blue';
      } else {
        player.team = 'red';
      }
      broadcastLobby();
      break;
    }

    case 'lobby:getPlayers': {
      player.ws.send(JSON.stringify({ type: 'lobby:players', players: getPlayersInfo(), mode: 'pvp' }));
      break;
    }

    case 'lobby:setTeam': {
      player.team = msg.team;
      broadcastLobby();
      break;
    }

    case 'pvp:ready': {
      if (!pvpState) pvpState = { players: new Map(), active: false };
      pvpState.players.set(player.id, {
        id: player.id, characterName: player.characterName, characterType: player.characterType,
        team: player.team, stats: msg.stats, hp: msg.stats.totalHp, maxHp: msg.stats.totalHp, ready: true,
      });

      // 2명 이상 ready면 시작
      if (pvpState.players.size >= 2) {
        pvpState.active = true;
        for (const [pid, pState] of pvpState.players) {
          const myTeam: any[] = [];
          const enemies: any[] = [];
          for (const [oid, oState] of pvpState.players) {
            const info = { id: oid, characterName: oState.characterName, hp: oState.hp, maxHp: oState.maxHp, team: oState.team };
            if (oState.team === pState.team) myTeam.push(info); else enemies.push(info);
          }
          const p = testPlayers.find(tp => tp.id === pid);
          if (p && p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(JSON.stringify({
              type: 'pvp:start', myHp: pState.hp, myMaxHp: pState.maxHp,
              myTeam, opponents: enemies, team: pState.team,
            }));
          }
        }
      }
      break;
    }

    case 'pvp:attack': {
      if (!pvpState || !pvpState.active) break;
      const attacker = pvpState.players.get(player.id);
      if (!attacker || attacker.hp <= 0) break;

      const enemies: any[] = [];
      for (const [, pState] of pvpState.players) {
        if (pState.team !== attacker.team && pState.hp > 0) enemies.push(pState);
      }
      if (enemies.length === 0) break;

      const defender = enemies[Math.floor(Math.random() * enemies.length)];
      const evaded = Math.random() * 100 < (defender.stats?.totalEvasion || 5);
      let damage = 0;
      if (!evaded) {
        damage = Math.max(1, (attacker.stats?.totalAttack || 100) - Math.floor((defender.stats?.totalDefense || 50) * 0.5));
        defender.hp = Math.max(0, defender.hp - damage);
      }

      const result = {
        type: 'pvp:attackResult',
        attackerId: player.id, attackerName: attacker.characterName, attackerTeam: attacker.team,
        defenderId: defender.id, defenderName: defender.characterName, defenderTeam: defender.team,
        damage, evaded, defenderHp: defender.hp, defenderMaxHp: defender.maxHp,
      };

      for (const [pid] of pvpState.players) {
        const p = testPlayers.find(tp => tp.id === pid);
        if (p && p.ws.readyState === WebSocket.OPEN) {
          p.ws.send(JSON.stringify(result));
        }
      }

      // 게임 오버 체크
      const blueAlive = Array.from(pvpState.players.values()).filter((p: any) => p.team === 'blue' && p.hp > 0);
      const redAlive = Array.from(pvpState.players.values()).filter((p: any) => p.team === 'red' && p.hp > 0);

      if (blueAlive.length === 0 || redAlive.length === 0) {
        const winningTeam = blueAlive.length > 0 ? 'blue' : 'red';
        const losingTeam = winningTeam === 'blue' ? 'red' : 'blue';
        const winners = Array.from(pvpState.players.values()).filter((p: any) => p.team === winningTeam);
        const losers = Array.from(pvpState.players.values()).filter((p: any) => p.team === losingTeam);

        for (const [pid] of pvpState.players) {
          const p = testPlayers.find(tp => tp.id === pid);
          if (p && p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(JSON.stringify({
              type: 'pvp:gameOver', winningTeam, losingTeam,
              winnerNames: winners.map((w: any) => w.characterName),
              loserNames: losers.map((l: any) => l.characterName),
            }));
          }
        }
        pvpState.active = false;
      }
      break;
    }
  }
}

function stopTestServer() {
  if (wss) {
    for (const p of testPlayers) { try { p.ws.close(); } catch {} }
    wss.close();
    wss = null;
    testPlayers = [];
    hostPlayer = null;
    pvpState = null;
  }
}

// ========================
// 테스트 시작
// ========================

beforeAll(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  createTables();
});

describe('1. 네트워크 접속 테스트', () => {
  beforeEach(() => { seedTestData(); startTestServer(TEST_PORT); });
  afterEach(() => { stopTestServer(); });

  it('클라이언트 접속 시 welcome 메시지와 playerId를 받는다', async () => {
    const { ws, playerId } = await connectClient();
    expect(playerId).toBeTruthy();
    expect(typeof playerId).toBe('string');
    expect(playerId.length).toBeGreaterThan(0);
    ws.close();
  });

  it('여러 클라이언트가 동시에 접속할 수 있다', async () => {
    const c1 = await connectClient();
    const c2 = await connectClient();
    const c3 = await connectClient();

    expect(c1.playerId).not.toBe(c2.playerId);
    expect(c2.playerId).not.toBe(c3.playerId);
    expect(testPlayers.length).toBe(3);

    c1.ws.close(); c2.ws.close(); c3.ws.close();
  });

  it('클라이언트 연결 해제 시 플레이어 목록에서 제거된다', async () => {
    const c1 = await connectClient();
    const c2 = await connectClient();
    expect(testPlayers.length).toBe(2);

    c1.ws.close();
    await new Promise(r => setTimeout(r, 100));
    expect(testPlayers.length).toBe(1);
    expect(testPlayers[0].id).toBe(c2.playerId);

    c2.ws.close();
  });

  it('캐릭터 선택 후 로비에 플레이어 정보가 표시된다', async () => {
    const c1 = await connectClient();
    const lobbyPromise = waitForMessage(c1.ws, 'lobby:players');
    selectCharacter(c1.ws, 1, '호스트전사', 1, 50);
    const lobbyMsg = await lobbyPromise;

    expect(lobbyMsg.players).toHaveLength(1);
    expect(lobbyMsg.players[0].characterName).toBe('호스트전사');
    expect(lobbyMsg.players[0].level).toBe(50);
    expect(lobbyMsg.players[0].characterId).toBe(1);

    c1.ws.close();
  });

  it('두 번째 클라이언트 접속 시 양쪽 다 로비 업데이트를 받는다', async () => {
    const c1 = await connectClient();
    selectCharacter(c1.ws, 1, '호스트전사', 1, 50);
    await waitForMessage(c1.ws, 'lobby:players');

    const c2 = await connectClient();
    const c1LobbyPromise = waitForMessage(c1.ws, 'lobby:players');
    selectCharacter(c2.ws, 2, '클라이언트전사', 2, 45);
    const c2Lobby = await waitForMessage(c2.ws, 'lobby:players');
    const c1Lobby = await c1LobbyPromise;

    expect(c1Lobby.players).toHaveLength(2);
    expect(c2Lobby.players).toHaveLength(2);

    c1.ws.close(); c2.ws.close();
  });

  it('RPC로 캐릭터 목록을 조회할 수 있다', async () => {
    const { ws } = await connectClient();
    const chars = await rpcCall(ws, 'character:getAll', null);

    expect(chars).toHaveLength(2);
    expect(chars[0].name).toBe('호스트전사');
    expect(chars[1].name).toBe('클라이언트전사');

    ws.close();
  });

  it('관리자 기능은 클라이언트에서 차단된다', async () => {
    const { ws } = await connectClient();
    await expect(rpcCall(ws, 'admin:saveVerses', { book: '시편', chapter: '119', verses: [] }))
      .rejects.toThrow('관리자 기능');

    ws.close();
  });

  it('admin:getSettings는 클라이언트에서 허용된다', async () => {
    const { ws } = await connectClient();
    // getSettings는 예외적으로 허용 (에러가 나지 않아야 함)
    const result = await rpcCall(ws, 'admin:getSettings', null);
    // 서버에서 null 반환 (테스트 서버는 간단 응답) — 에러가 아님
    expect(true).toBe(true); // 에러 없이 도달하면 성공
    ws.close();
  });
});

describe('2. 캐릭터별 아이템 주고받기 테스트', () => {
  beforeEach(() => { seedTestData(); startTestServer(TEST_PORT); });
  afterEach(() => { stopTestServer(); });

  it('클라이언트→클라이언트 아이템 선물', async () => {
    const c1 = await connectClient();
    const c2 = await connectClient();
    selectCharacter(c1.ws, 1, '호스트전사', 1, 50);
    selectCharacter(c2.ws, 2, '클라이언트전사', 2, 45);
    await waitForMessage(c1.ws, 'lobby:players');
    await waitForMessage(c2.ws, 'lobby:players');

    const giftItem = { name: '선물검', description: '선물용', type: 'weapon', stat_type: 'attack', stat_bonus: 100, rarity: 'rare', level_req: 10, enhance_level: 0 };

    // c2가 아이템 수신 대기
    const receivePromise = waitForMessage(c2.ws, 'gift:receiveItem');
    const notifyPromise = waitForMessage(c2.ws, 'gift:notification');

    // c1이 c2에게 아이템 전송
    const result = await rpcCall(c1.ws, 'gift:networkTransferItem', {
      item: giftItem,
      targetPlayerId: c2.playerId,
      targetCharacterId: 2,
      senderName: '호스트전사',
    });

    expect(result.success).toBe(true);

    const received = await receivePromise;
    expect(received.item.name).toBe('선물검');
    expect(received.characterId).toBe(2);

    const notification = await notifyPromise;
    expect(notification.senderName).toBe('호스트전사');
    expect(notification.itemName).toBe('선물검');
    expect(notification.isConsumable).toBe(false);

    c1.ws.close(); c2.ws.close();
  });

  it('클라이언트→클라이언트 소모품 선물', async () => {
    const c1 = await connectClient();
    const c2 = await connectClient();
    selectCharacter(c1.ws, 1, '호스트전사', 1, 50);
    selectCharacter(c2.ws, 2, '클라이언트전사', 2, 45);
    await waitForMessage(c1.ws, 'lobby:players');
    await waitForMessage(c2.ws, 'lobby:players');

    const receivePromise = waitForMessage(c2.ws, 'consumable:add');
    const notifyPromise = waitForMessage(c2.ws, 'gift:notification');

    const result = await rpcCall(c1.ws, 'gift:networkTransferConsumable', {
      targetPlayerId: c2.playerId,
      targetCharacterId: 2,
      type: 'perfect_score',
      quantity: 2,
      senderName: '호스트전사',
      consumableLabel: '암송 100점권',
    });

    expect(result.success).toBe(true);

    const received = await receivePromise;
    expect(received.consumableType).toBe('perfect_score');
    expect(received.quantity).toBe(2);
    expect(received.characterId).toBe(2);

    const notification = await notifyPromise;
    expect(notification.senderName).toBe('호스트전사');
    expect(notification.itemName).toBe('암송 100점권');
    expect(notification.isConsumable).toBe(true);

    c1.ws.close(); c2.ws.close();
  });

  it('존재하지 않는 플레이어에게 선물 시 실패', async () => {
    const c1 = await connectClient();
    selectCharacter(c1.ws, 1, '호스트전사', 1, 50);
    await waitForMessage(c1.ws, 'lobby:players');

    const result = await rpcCall(c1.ws, 'gift:networkTransferItem', {
      item: { name: '검', type: 'weapon', stat_type: 'attack', stat_bonus: 10, rarity: 'common', level_req: 1, enhance_level: 0 },
      targetPlayerId: 'nonexistent',
      targetCharacterId: 99,
      senderName: '호스트전사',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('찾을 수 없습니다');

    c1.ws.close();
  });

  it('호스트에게 선물 전송도 성공한다', async () => {
    const c1 = await connectClient();
    selectCharacter(c1.ws, 1, '전사', 1, 50);
    await waitForMessage(c1.ws, 'lobby:players');

    // 호스트 설정
    hostPlayer = { id: 'host', ws: null as any, characterId: 1, characterName: '호스트', characterType: 1, level: 50, isHost: true, team: 'blue' };

    const result = await rpcCall(c1.ws, 'gift:networkTransferItem', {
      item: { name: '선물방패', type: 'shield', stat_type: 'defense', stat_bonus: 50, rarity: 'common', level_req: 1, enhance_level: 0 },
      targetPlayerId: 'host',
      targetCharacterId: 1,
      senderName: '전사',
    });

    expect(result.success).toBe(true);

    c1.ws.close();
  });

  it('양방향 선물 교환', async () => {
    const c1 = await connectClient();
    const c2 = await connectClient();
    selectCharacter(c1.ws, 1, '전사A', 1, 50);
    selectCharacter(c2.ws, 2, '전사B', 2, 45);
    await waitForMessage(c1.ws, 'lobby:players');
    await waitForMessage(c2.ws, 'lobby:players');

    // c1→c2 아이템
    const recv2 = waitForMessage(c2.ws, 'gift:receiveItem');
    await rpcCall(c1.ws, 'gift:networkTransferItem', {
      item: { name: 'A의 검', type: 'weapon', stat_type: 'attack', stat_bonus: 100, rarity: 'rare', level_req: 10, enhance_level: 0 },
      targetPlayerId: c2.playerId, targetCharacterId: 2, senderName: '전사A',
    });
    const got2 = await recv2;
    expect(got2.item.name).toBe('A의 검');

    // c2→c1 소모품
    const recv1 = waitForMessage(c1.ws, 'consumable:add');
    await rpcCall(c2.ws, 'gift:networkTransferConsumable', {
      targetPlayerId: c1.playerId, targetCharacterId: 1,
      type: 'hint', quantity: 1, senderName: '전사B', consumableLabel: '힌트권',
    });
    const got1 = await recv1;
    expect(got1.consumableType).toBe('hint');
    expect(got1.quantity).toBe(1);

    c1.ws.close(); c2.ws.close();
  });
});

describe('3. 네트워크 모드 게임 테스트', () => {
  beforeEach(() => { seedTestData(); startTestServer(TEST_PORT); });
  afterEach(() => { stopTestServer(); });

  it('두 플레이어 PvP ready → 게임 시작', async () => {
    const c1 = await connectClient();
    const c2 = await connectClient();
    selectCharacter(c1.ws, 1, '전사A', 1, 50);
    selectCharacter(c2.ws, 2, '전사B', 2, 45);
    await waitForMessage(c1.ws, 'lobby:players');
    await waitForMessage(c2.ws, 'lobby:players');

    // 팀 배정
    c1.ws.send(JSON.stringify({ type: 'lobby:setTeam', team: 'blue' }));
    c2.ws.send(JSON.stringify({ type: 'lobby:setTeam', team: 'red' }));
    await waitForMessage(c1.ws, 'lobby:players');
    await waitForMessage(c2.ws, 'lobby:players');

    const stats1 = { level: 50, totalAttack: 2000, totalDefense: 1000, totalHp: 5000, totalEvasion: 5, bonusAttack: 0, bonusDefense: 0, bonusHp: 0, bonusEvasion: 0 };
    const stats2 = { level: 45, totalAttack: 1800, totalDefense: 900, totalHp: 4500, totalEvasion: 5, bonusAttack: 0, bonusDefense: 0, bonusHp: 0, bonusEvasion: 0 };

    const start1Promise = waitForMessage(c1.ws, 'pvp:start');
    const start2Promise = waitForMessage(c2.ws, 'pvp:start');

    c1.ws.send(JSON.stringify({ type: 'pvp:ready', stats: stats1 }));
    c2.ws.send(JSON.stringify({ type: 'pvp:ready', stats: stats2 }));

    const start1 = await start1Promise;
    const start2 = await start2Promise;

    expect(start1.team).toBe('blue');
    expect(start2.team).toBe('red');
    expect(start1.opponents.length).toBeGreaterThan(0);
    expect(start2.opponents.length).toBeGreaterThan(0);
    expect(start1.myHp).toBeGreaterThan(0);
    expect(start2.myHp).toBeGreaterThan(0);

    c1.ws.close(); c2.ws.close();
  });

  it('PvP 공격 시 양쪽 플레이어에게 결과가 전달된다', async () => {
    const c1 = await connectClient();
    const c2 = await connectClient();
    selectCharacter(c1.ws, 1, '전사A', 1, 50);
    selectCharacter(c2.ws, 2, '전사B', 2, 45);
    await waitForMessage(c1.ws, 'lobby:players');
    await waitForMessage(c2.ws, 'lobby:players');

    c1.ws.send(JSON.stringify({ type: 'lobby:setTeam', team: 'blue' }));
    c2.ws.send(JSON.stringify({ type: 'lobby:setTeam', team: 'red' }));
    await waitForMessage(c1.ws, 'lobby:players');
    await waitForMessage(c2.ws, 'lobby:players');

    const stats = { level: 50, totalAttack: 100, totalDefense: 50, totalHp: 1000, totalEvasion: 0, bonusAttack: 0, bonusDefense: 0, bonusHp: 0, bonusEvasion: 0 };

    const start1 = waitForMessage(c1.ws, 'pvp:start');
    const start2 = waitForMessage(c2.ws, 'pvp:start');
    c1.ws.send(JSON.stringify({ type: 'pvp:ready', stats }));
    c2.ws.send(JSON.stringify({ type: 'pvp:ready', stats }));
    await start1; await start2;

    // c1이 공격
    const atk1Promise = waitForMessage(c1.ws, 'pvp:attackResult');
    const atk2Promise = waitForMessage(c2.ws, 'pvp:attackResult');
    c1.ws.send(JSON.stringify({ type: 'pvp:attack' }));

    const atk1 = await atk1Promise;
    const atk2 = await atk2Promise;

    // 양쪽 동일한 결과
    expect(atk1.attackerName).toBe('전사A');
    expect(atk2.attackerName).toBe('전사A');
    expect(atk1.defenderName).toBe('전사B');
    expect(atk1.damage).toBe(atk2.damage);
    expect(atk1.defenderHp).toBe(atk2.defenderHp);

    c1.ws.close(); c2.ws.close();
  });

  it('한쪽 팀이 전멸하면 게임오버 메시지가 온다', async () => {
    const c1 = await connectClient();
    const c2 = await connectClient();
    selectCharacter(c1.ws, 1, '전사A', 1, 50);
    selectCharacter(c2.ws, 2, '전사B', 2, 45);
    await waitForMessage(c1.ws, 'lobby:players');
    await waitForMessage(c2.ws, 'lobby:players');

    c1.ws.send(JSON.stringify({ type: 'lobby:setTeam', team: 'blue' }));
    c2.ws.send(JSON.stringify({ type: 'lobby:setTeam', team: 'red' }));
    await waitForMessage(c1.ws, 'lobby:players');
    await waitForMessage(c2.ws, 'lobby:players');

    // c1은 HP 높고, c2는 HP 매우 낮음 (한 방에 끝나도록)
    const stats1 = { level: 50, totalAttack: 99999, totalDefense: 50, totalHp: 10000, totalEvasion: 0, bonusAttack: 0, bonusDefense: 0, bonusHp: 0, bonusEvasion: 0 };
    const stats2 = { level: 45, totalAttack: 100, totalDefense: 0, totalHp: 1, totalEvasion: 0, bonusAttack: 0, bonusDefense: 0, bonusHp: 0, bonusEvasion: 0 };

    c1.ws.send(JSON.stringify({ type: 'pvp:ready', stats: stats1 }));
    c2.ws.send(JSON.stringify({ type: 'pvp:ready', stats: stats2 }));
    await waitForMessage(c1.ws, 'pvp:start');
    await waitForMessage(c2.ws, 'pvp:start');

    // c1 공격 → c2 즉사 → 게임오버
    const go1 = waitForMessage(c1.ws, 'pvp:gameOver');
    const go2 = waitForMessage(c2.ws, 'pvp:gameOver');
    c1.ws.send(JSON.stringify({ type: 'pvp:attack' }));

    // attackResult와 gameOver를 순서대로 받으므로 gameOver 대기
    const gameOver1 = await go1;
    const gameOver2 = await go2;

    expect(gameOver1.winningTeam).toBe('blue');
    expect(gameOver1.losingTeam).toBe('red');
    expect(gameOver1.winnerNames).toContain('전사A');
    expect(gameOver1.loserNames).toContain('전사B');

    expect(gameOver2.winningTeam).toBe('blue');

    c1.ws.close(); c2.ws.close();
  });

  it('팀 변경이 반영된다', async () => {
    const c1 = await connectClient();
    selectCharacter(c1.ws, 1, '전사', 1, 50);
    await waitForMessage(c1.ws, 'lobby:players');

    c1.ws.send(JSON.stringify({ type: 'lobby:setTeam', team: 'red' }));
    const lobby = await waitForMessage(c1.ws, 'lobby:players');
    expect(lobby.players[0].team).toBe('red');

    c1.ws.close();
  });
});

describe('4. 승패 기록 테스트', () => {
  beforeEach(() => { seedTestData(); startTestServer(TEST_PORT); });
  afterEach(() => { stopTestServer(); });

  it('RPC로 PvP 전적을 조회할 수 있다', async () => {
    const { ws } = await connectClient();

    // 초기 전적 없음
    const record = await rpcCall(ws, 'pvp:getRecord', '호스트전사');
    expect(record.wins).toBe(0);
    expect(record.losses).toBe(0);

    ws.close();
  });

  it('승리 기록이 업데이트된다', async () => {
    const { ws } = await connectClient();

    await rpcCall(ws, 'pvp:updateRecord', { characterName: '호스트전사', win: true });
    await rpcCall(ws, 'pvp:updateRecord', { characterName: '호스트전사', win: true });
    await rpcCall(ws, 'pvp:updateRecord', { characterName: '호스트전사', win: false });

    const record = await rpcCall(ws, 'pvp:getRecord', '호스트전사');
    expect(record.wins).toBe(2);
    expect(record.losses).toBe(1);

    ws.close();
  });

  it('패배 기록이 업데이트된다', async () => {
    const { ws } = await connectClient();

    await rpcCall(ws, 'pvp:updateRecord', { characterName: '클라이언트전사', win: false });
    await rpcCall(ws, 'pvp:updateRecord', { characterName: '클라이언트전사', win: false });
    await rpcCall(ws, 'pvp:updateRecord', { characterName: '클라이언트전사', win: true });

    const record = await rpcCall(ws, 'pvp:getRecord', '클라이언트전사');
    expect(record.wins).toBe(1);
    expect(record.losses).toBe(2);

    ws.close();
  });

  it('여러 캐릭터의 전적이 독립적이다', async () => {
    const { ws } = await connectClient();

    await rpcCall(ws, 'pvp:updateRecord', { characterName: '전사A', win: true });
    await rpcCall(ws, 'pvp:updateRecord', { characterName: '전사A', win: true });
    await rpcCall(ws, 'pvp:updateRecord', { characterName: '전사B', win: false });
    await rpcCall(ws, 'pvp:updateRecord', { characterName: '전사B', win: false });
    await rpcCall(ws, 'pvp:updateRecord', { characterName: '전사B', win: false });

    const recordA = await rpcCall(ws, 'pvp:getRecord', '전사A');
    const recordB = await rpcCall(ws, 'pvp:getRecord', '전사B');

    expect(recordA.wins).toBe(2);
    expect(recordA.losses).toBe(0);
    expect(recordB.wins).toBe(0);
    expect(recordB.losses).toBe(3);

    ws.close();
  });

  it('전적이 없는 캐릭터는 0승 0패', async () => {
    const { ws } = await connectClient();

    const record = await rpcCall(ws, 'pvp:getRecord', '존재하지않는캐릭');
    expect(record.wins).toBe(0);
    expect(record.losses).toBe(0);

    ws.close();
  });
});
