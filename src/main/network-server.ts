import { WebSocketServer, WebSocket } from 'ws';
import os from 'os';
import { createHandlers, HandlerMap } from './handlers';

interface NetworkPlayer {
  id: string;
  ws: WebSocket;
  characterId: number | null;
  characterName: string;
  characterType: number;
  level: number;
  isHost: boolean;
}

export type GameMode = 'pvp' | 'boss';

interface PvpPlayerState {
  id: string;
  characterId: number;
  characterName: string;
  characterType: number;
  team: 'blue' | 'red';
  stats: {
    level: number;
    totalAttack: number;
    totalDefense: number;
    totalHp: number;
    totalEvasion: number;
    bonusAttack: number;
    bonusDefense: number;
    bonusHp: number;
    bonusEvasion: number;
  };
  hp: number;
  maxHp: number;
  ready: boolean;
}

interface PvpState {
  players: Map<string, PvpPlayerState>;
  verses: any[];
  active: boolean;
}

let wss: WebSocketServer | null = null;
let players: NetworkPlayer[] = [];
let handlers: HandlerMap | null = null;
let hostPlayer: NetworkPlayer | null = null;
let roomMode: GameMode = 'pvp';
let serverPort: number = 7777;
let hostEventSender: ((msg: any) => void) | null = null;
let pvpState: PvpState | null = null;
let pvpVerseRange: { startVerse: number; endVerse: number } | null = null;
let pvpEasyPlayers: Set<string> = new Set();
let playerTeams: Map<string, 'blue' | 'red'> = new Map();

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

export function startServer(port: number = 7777): { ip: string; port: number } {
  if (wss) {
    const ip = getLocalIP();
    return { ip, port: serverPort };
  }

  handlers = createHandlers();
  players = [];
  roomMode = 'pvp';
  serverPort = port;
  playerTeams.clear();

  wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket) => {
    const playerId = generateId();
    const player: NetworkPlayer = {
      id: playerId,
      ws,
      characterId: null,
      characterName: '',
      characterType: 0,
      level: 0,
      isHost: false,
    };
    players.push(player);

    ws.send(JSON.stringify({
      type: 'welcome',
      playerId,
    }));

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        handleMessage(player, msg);
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    });

    ws.on('close', () => {
      players = players.filter(p => p.id !== playerId);
      playerTeams.delete(playerId);
      broadcastLobby();
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  const ip = getLocalIP();
  return { ip, port };
}

export function stopServer() {
  if (wss) {
    for (const player of players) {
      try {
        player.ws.send(JSON.stringify({ type: 'server:closed' }));
        player.ws.close();
      } catch (e) { /* ignore */ }
    }
    wss.close();
    wss = null;
    players = [];
    hostPlayer = null;
    handlers = null;
    playerTeams.clear();
  }
}

export function isServerRunning(): boolean {
  return wss !== null;
}

export function setHostPlayer(characterId: number, characterName: string, characterType: number, level: number) {
  hostPlayer = {
    id: 'host',
    ws: null as any,
    characterId,
    characterName,
    characterType,
    level,
    isHost: true,
  };
  // 호스트는 기본 블루팀
  if (!playerTeams.has('host')) {
    playerTeams.set('host', 'blue');
  }
}

export function setRoomMode(mode: GameMode) {
  roomMode = mode;
  broadcastRoomInfo();
}

export function getRoomMode(): GameMode {
  return roomMode;
}

export function getRoomInfo() {
  return {
    hostName: hostPlayer?.characterName || '',
    hostCharacterType: hostPlayer?.characterType || 0,
    hostLevel: hostPlayer?.level || 0,
    mode: roomMode,
    playerCount: getPlayersInfo().length,
  };
}

export function broadcastGameStart() {
  const msg = JSON.stringify({
    type: 'game:started',
    mode: roomMode,
  });
  for (const p of players) {
    try {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(msg);
      }
    } catch (e) { /* ignore */ }
  }
}

export function setPvpEasyMode(playerId: string, easy: boolean) {
  if (easy) {
    pvpEasyPlayers.add(playerId);
  } else {
    pvpEasyPlayers.delete(playerId);
  }
  broadcastLobby();
}

export function getPvpEasyPlayers(): string[] {
  return Array.from(pvpEasyPlayers);
}

export function setPlayerTeam(playerId: string, team: 'blue' | 'red') {
  playerTeams.set(playerId, team);
  broadcastLobby();
}

export function getPlayersInfo(): any[] {
  const all = hostPlayer ? [hostPlayer, ...players] : [...players];
  return all
    .filter(p => p.characterId !== null)
    .map(p => ({
      id: p.id,
      characterId: p.characterId,
      characterName: p.characterName,
      characterType: p.characterType,
      level: p.level,
      isHost: p.isHost,
      easyMode: pvpEasyPlayers.has(p.id),
      team: playerTeams.get(p.id) || 'blue',
    }));
}

function handleMessage(player: NetworkPlayer, msg: any) {
  if (!handlers) return;

  switch (msg.type) {
    case 'rpc': {
      const { id, channel, data } = msg;
      try {
        if (channel.startsWith('admin:') && channel !== 'admin:getSettings') {
          player.ws.send(JSON.stringify({
            type: 'rpc:response',
            id,
            error: '관리자 기능은 호스트에서만 사용할 수 있습니다.',
          }));
          return;
        }

        // 네트워크 선물 전송
        // - 수신자가 호스트: 호스트 DB에 직접 저장
        // - 수신자가 클라이언트: WebSocket으로 아이템 데이터 push → 클라이언트가 로컬 DB에 저장
        if (channel === 'gift:networkTransferItem') {
          const { item, targetPlayerId, targetCharacterId, senderName } = data;
          if (targetPlayerId === 'host') {
            if (!handlers) {
              player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: { success: false, message: '서버 오류' } }));
              return;
            }
            const result = handlers['gift:receiveItem']({ characterId: targetCharacterId, item });
            if (result.success) sendGiftNotification(targetPlayerId, senderName, item.name, false);
            player.ws.send(JSON.stringify({ type: 'rpc:response', id, result }));
          } else {
            const target = players.find(p => p.id === targetPlayerId);
            if (!target || target.ws.readyState !== WebSocket.OPEN) {
              player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: { success: false, message: '대상 플레이어를 찾을 수 없습니다.' } }));
              return;
            }
            target.ws.send(JSON.stringify({ type: 'gift:receiveItem', characterId: targetCharacterId, item }));
            sendGiftNotification(targetPlayerId, senderName, item.name, false);
            player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: { success: true } }));
          }
          return;
        }
        if (channel === 'gift:networkTransferConsumable') {
          const { targetPlayerId, targetCharacterId, type: cType, quantity, senderName, consumableLabel } = data;
          if (targetPlayerId === 'host') {
            if (!handlers) {
              player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: { success: false, message: '서버 오류' } }));
              return;
            }
            const result = handlers['consumable:add']({ characterId: targetCharacterId, type: cType, quantity });
            if (result.success) sendGiftNotification(targetPlayerId, senderName, consumableLabel || cType, true);
            player.ws.send(JSON.stringify({ type: 'rpc:response', id, result }));
          } else {
            const target = players.find(p => p.id === targetPlayerId);
            if (!target || target.ws.readyState !== WebSocket.OPEN) {
              player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: { success: false, message: '대상 플레이어를 찾을 수 없습니다.' } }));
              return;
            }
            target.ws.send(JSON.stringify({ type: 'consumable:add', characterId: targetCharacterId, consumableType: cType, quantity }));
            sendGiftNotification(targetPlayerId, senderName, consumableLabel || cType, true);
            player.ws.send(JSON.stringify({ type: 'rpc:response', id, result: { success: true } }));
          }
          return;
        }

        const handler = handlers[channel];
        if (!handler) {
          player.ws.send(JSON.stringify({
            type: 'rpc:response',
            id,
            error: `Unknown channel: ${channel}`,
          }));
          return;
        }

        const result = handler(data);
        player.ws.send(JSON.stringify({
          type: 'rpc:response',
          id,
          result,
        }));
      } catch (e: any) {
        player.ws.send(JSON.stringify({
          type: 'rpc:response',
          id,
          error: e.message || 'Server error',
        }));
      }
      break;
    }

    case 'lobby:selectCharacter': {
      player.characterId = msg.characterId;
      player.characterName = msg.characterName;
      player.characterType = msg.characterType;
      player.level = msg.level;
      // 새 참가자는 인원이 적은 팀에 자동 배정
      if (!playerTeams.has(player.id)) {
        const info = getPlayersInfo();
        const blueCount = info.filter(p => p.team === 'blue').length;
        const redCount = info.filter(p => p.team === 'red').length;
        playerTeams.set(player.id, blueCount <= redCount ? 'blue' : 'red');
      }
      broadcastLobby();
      break;
    }

    case 'lobby:getPlayers': {
      player.ws.send(JSON.stringify({
        type: 'lobby:players',
        players: getPlayersInfo(),
        mode: roomMode,
      }));
      break;
    }

    case 'room:getInfo': {
      player.ws.send(JSON.stringify({
        type: 'room:info',
        ...getRoomInfo(),
      }));
      break;
    }

    case 'lobby:setTeam': {
      playerTeams.set(player.id, msg.team);
      broadcastLobby();
      break;
    }

    case 'pvp:ready': {
      pvpReady(player.id, {
        characterName: player.characterName,
        characterType: player.characterType,
        stats: msg.stats,
      });
      break;
    }

    case 'pvp:attack': {
      pvpAttack(player.id);
      break;
    }

    case 'pvp:end': {
      pvpEnd(player.id);
      break;
    }

    default:
      break;
  }
}

function broadcastLobby() {
  const playersInfo = getPlayersInfo();
  const msg = JSON.stringify({
    type: 'lobby:players',
    players: playersInfo,
    mode: roomMode,
  });

  for (const p of players) {
    try {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(msg);
      }
    } catch (e) { /* ignore */ }
  }
}

function broadcastRoomInfo() {
  const info = getRoomInfo();
  const msg = JSON.stringify({
    type: 'room:info',
    ...info,
  });
  for (const p of players) {
    try {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(msg);
      }
    } catch (e) { /* ignore */ }
  }
}

export function getServerPlayers() {
  return getPlayersInfo();
}

// ===== PvP =====

export function setHostEventSender(fn: (msg: any) => void) {
  hostEventSender = fn;
}

function sendPvpToPlayer(playerId: string, msg: any) {
  if (playerId === 'host') {
    if (hostEventSender) hostEventSender(msg);
    return;
  }
  const p = players.find(pl => pl.id === playerId);
  if (p && p.ws.readyState === WebSocket.OPEN) {
    try { p.ws.send(JSON.stringify(msg)); } catch (e) { /* ignore */ }
  }
}

function broadcastPvp(msg: any) {
  if (!pvpState) return;
  for (const [pid] of pvpState.players) {
    sendPvpToPlayer(pid, msg);
  }
}

export function pvpReady(playerId: string, data: { characterName: string; characterType: number; stats: any }) {
  if (!pvpState) {
    pvpState = { players: new Map(), verses: [], active: false };
  }

  const team = playerTeams.get(playerId) || 'blue';

  // characterId 조회
  let characterId = 0;
  if (playerId === 'host' && hostPlayer) {
    characterId = hostPlayer.characterId || 0;
  } else {
    const p = players.find(pl => pl.id === playerId);
    if (p) characterId = p.characterId || 0;
  }

  pvpState.players.set(playerId, {
    id: playerId,
    characterId,
    characterName: data.characterName,
    characterType: data.characterType,
    team,
    stats: data.stats,
    hp: data.stats.totalHp,
    maxHp: data.stats.totalHp,
    ready: true,
  });

  // Check if all expected players are ready
  const allPlayers = getPlayersInfo();
  const readyCount = pvpState.players.size;

  if (readyCount >= 2 && readyCount >= allPlayers.length) {
    // PvP 밸런스: 평균 레벨로 base stat 재계산, 장비 보너스만 개인 유지
    const playerArr = Array.from(pvpState.players.values());
    const avgLevel = Math.round(
      playerArr.reduce((sum, p) => sum + (p.stats.level || 1), 0) / playerArr.length
    );
    const baseAttack = 50 + avgLevel * 30;
    const baseDefense = 30 + avgLevel * 20;
    const baseHp = 500 + avgLevel * 100;
    const baseEvasion = 5;

    for (const [, pState] of pvpState.players) {
      const s = pState.stats;
      s.totalAttack = baseAttack + (s.bonusAttack || 0);
      s.totalDefense = baseDefense + (s.bonusDefense || 0);
      s.totalHp = baseHp + (s.bonusHp || 0);
      s.totalEvasion = Math.min(50, baseEvasion + (s.bonusEvasion || 0));
      pState.hp = s.totalHp;
      pState.maxHp = s.totalHp;
    }

    // Get verses for PvP quiz
    if (handlers) {
      const allVerses = pvpVerseRange
        ? handlers['recite:getQuizRange'](pvpVerseRange)
        : handlers['recite:getQuiz'](null);
      const shuffled = [...allVerses].sort(() => Math.random() - 0.5);
      pvpState.verses = shuffled.slice(0, Math.max(5, shuffled.length));
    }

    pvpState.active = true;

    // Send start to each player with team opponent info
    for (const [pid, pState] of pvpState.players) {
      const myTeam: any[] = [];
      const enemies: any[] = [];
      for (const [oid, oState] of pvpState.players) {
        const info = {
          id: oid,
          characterName: oState.characterName,
          characterType: oState.characterType,
          hp: oState.hp,
          maxHp: oState.maxHp,
          team: oState.team,
        };
        if (oState.team === pState.team) {
          myTeam.push(info);
        } else {
          enemies.push(info);
        }
      }

      sendPvpToPlayer(pid, {
        type: 'pvp:start',
        verses: pvpState.verses,
        myHp: pState.hp,
        myMaxHp: pState.maxHp,
        myTeam,
        opponents: enemies,
        team: pState.team,
        easyMode: pvpEasyPlayers.has(pid),
      });
    }
  }
}

export function pvpAttack(attackerId: string): any {
  if (!pvpState || !pvpState.active) return null;

  const attacker = pvpState.players.get(attackerId);
  if (!attacker || attacker.hp <= 0) return null;

  // 상대팀 중 살아있는 랜덤 타겟
  const aliveEnemies: PvpPlayerState[] = [];
  for (const [, pState] of pvpState.players) {
    if (pState.team !== attacker.team && pState.hp > 0) {
      aliveEnemies.push(pState);
    }
  }
  if (aliveEnemies.length === 0) return null;

  const defender = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];

  // Evasion check
  const evaded = Math.random() * 100 < defender.stats.totalEvasion;
  let damage = 0;

  if (!evaded) {
    damage = Math.max(1, attacker.stats.totalAttack - Math.floor(defender.stats.totalDefense * 0.5));
    defender.hp = Math.max(0, defender.hp - damage);
  }

  const result = {
    attackerId,
    attackerName: attacker.characterName,
    attackerTeam: attacker.team,
    defenderId: defender.id,
    defenderName: defender.characterName,
    defenderTeam: defender.team,
    damage,
    evaded,
    defenderHp: defender.hp,
    defenderMaxHp: defender.maxHp,
  };

  // Send attack result to all players
  broadcastPvp({
    type: 'pvp:attackResult',
    ...result,
  });

  // Check game over: 한쪽 팀 전멸
  const blueAlive = Array.from(pvpState.players.values()).filter(p => p.team === 'blue' && p.hp > 0);
  const redAlive = Array.from(pvpState.players.values()).filter(p => p.team === 'red' && p.hp > 0);

  if (blueAlive.length === 0 || redAlive.length === 0) {
    const winningTeam = blueAlive.length > 0 ? 'blue' : 'red';
    const losingTeam = winningTeam === 'blue' ? 'red' : 'blue';
    finishPvpGame(winningTeam, losingTeam);
  }

  return result;
}

function finishPvpGame(winningTeam: string, losingTeam: string, nullified = false) {
  if (!pvpState) return;
  pvpState.active = false;

  const allPlayers = Array.from(pvpState.players.values());
  const winners = allPlayers.filter(p => p.team === winningTeam);
  const losers = allPlayers.filter(p => p.team === losingTeam);

  const expResults: Record<string, { exp: number; leveledUp: boolean; newLevel?: number }> = {};

  if (!nullified && handlers) {
    // 정상 종료: 경험치 계산 + 전적 기록
    const winnerExpEach = winners.length > 0
      ? Math.floor((100 * losers.length) / winners.length)
      : 0;
    const loserExpEach = losers.length > 0
      ? Math.floor((100 * winners.length * 0.2) / losers.length)
      : 0;

    for (const p of allPlayers) {
      handlers['pvp:updateRecord']({
        characterName: p.characterName,
        win: p.team === winningTeam,
      });
      const exp = p.team === winningTeam ? winnerExpEach : loserExpEach;
      let leveledUp = false;
      let newLevel: number | undefined;
      if (p.characterId && exp > 0) {
        const result = handlers['pvp:grantExp']({ characterId: p.characterId, exp });
        if (result && result.leveledUp) {
          leveledUp = true;
          newLevel = result.newLevel;
        }
      }
      expResults[p.id] = { exp, leveledUp, newLevel };
    }
  }

  // 각 플레이어에게 gameOver 전송
  for (const [pid] of pvpState.players) {
    const r = expResults[pid] || { exp: 0, leveledUp: false };
    sendPvpToPlayer(pid, {
      type: 'pvp:gameOver',
      winningTeam,
      losingTeam,
      winnerNames: winners.map(p => p.characterName),
      loserNames: losers.map(p => p.characterName),
      earnedExp: r.exp,
      leveledUp: r.leveledUp,
      newLevel: r.newLevel,
      nullified,
    });
  }

  pvpState = null;
}

export function pvpEnd(surrenderId?: string) {
  if (!pvpState) return;

  if (surrenderId) {
    // 종료 요청한 플레이어의 팀이 패배, 무효 처리 (경험치/전적 없음)
    const surrenderer = pvpState.players.get(surrenderId);
    const losingTeam = surrenderer?.team || 'blue';
    const winningTeam = losingTeam === 'blue' ? 'red' : 'blue';
    finishPvpGame(winningTeam, losingTeam, true);
  } else {
    // 팀별 총 HP로 승패 결정 (전멸 등 정상 종료)
    const blueHp = Array.from(pvpState.players.values())
      .filter(p => p.team === 'blue')
      .reduce((sum, p) => sum + p.hp, 0);
    const redHp = Array.from(pvpState.players.values())
      .filter(p => p.team === 'red')
      .reduce((sum, p) => sum + p.hp, 0);

    const winningTeam = blueHp >= redHp ? 'blue' : 'red';
    const losingTeam = winningTeam === 'blue' ? 'red' : 'blue';
    finishPvpGame(winningTeam, losingTeam);
  }
}

// 호스트가 클라이언트에게 선물 전송 (WebSocket push → 클라이언트 로컬 DB 저장)
export function sendGiftFromHost(targetPlayerId: string, targetCharacterId: number, giftKind: 'item' | 'consumable', data: any, senderName: string, consumableLabel?: string): { success: boolean; message?: string } {
  const target = players.find(p => p.id === targetPlayerId);
  if (!target || target.ws.readyState !== WebSocket.OPEN) {
    return { success: false, message: '대상 플레이어를 찾을 수 없습니다.' };
  }
  if (giftKind === 'item') {
    target.ws.send(JSON.stringify({ type: 'gift:receiveItem', characterId: targetCharacterId, item: data }));
    sendGiftNotification(targetPlayerId, senderName, data.name, false);
  } else {
    target.ws.send(JSON.stringify({ type: 'consumable:add', characterId: targetCharacterId, consumableType: data.type, quantity: data.quantity }));
    sendGiftNotification(targetPlayerId, senderName, consumableLabel || data.type, true);
  }
  return { success: true };
}

// 선물 수신 알림을 대상 플레이어에게 전송
function sendGiftNotification(targetPlayerId: string, senderName: string, itemName: string, isConsumable: boolean) {
  const msg = { type: 'gift:notification', senderName, itemName, isConsumable };
  if (targetPlayerId === 'host') {
    if (hostEventSender) hostEventSender(msg);
    return;
  }
  const target = players.find(p => p.id === targetPlayerId);
  if (target && target.ws.readyState === WebSocket.OPEN) {
    try { target.ws.send(JSON.stringify(msg)); } catch (e) { /* ignore */ }
  }
}

export function setPvpVerseRange(range: { startVerse: number; endVerse: number }) {
  pvpVerseRange = range;
  broadcastLobby();
}

export function getPvpVerseRange() {
  return pvpVerseRange;
}
