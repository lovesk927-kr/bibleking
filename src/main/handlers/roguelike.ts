/**
 * 로그라이크 게임모드 핸들러
 */
import { queryAll, queryOne, run, saveDb } from '../db';
import { calcTotalStats, calcLevelUp, normalizeAnswer } from '../game-logic';
import { generateRandomItem, generateMythicItem, addItemToCharacter } from '../item-service';
import { VILLAGE_MONSTERS, getBossData, VILLAGE_LEVEL_REQS } from '../game-data';
import { getCharacterTotalStats } from './character';
import { HandlerMap } from './types';
import {
  ROGUELIKE_CONFIG, BUFF_POOL, SHOP_ITEMS, UPGRADE_DEFS, ACHIEVEMENT_DEFS,
  START_BUFF_DEFS, START_BUFF_SLOT_UNLOCK, EVENT_DEFS,
  calcNextMonsterLevel, calcBlankCount, calcTimeLimit, calcVerseCount,
  calcRoguelikeMonsterStats, calcEliteStats, calcExpReduction,
  calcComboMultiplier, calcPlayerDamage, calcMonsterDamage, calcStarsEarned,
  getNextEventType, isShopTrigger, isBuffTrigger, getBossThreshold,
} from '../roguelike-data';

// ===== 런 상태 (메모리) =====
interface RunState {
  room: number;
  villageId: number;
  villageKillCount: number;
  playerHp: number;
  playerMaxHp: number;
  playerAttack: number;      // 런 내 (영구+장비+버프 적용)
  playerDefense: number;
  baseAttack: number;         // 영구+장비만 (버프 전)
  baseDefense: number;
  baseMaxHp: number;
  gold: number;
  combo: number;
  maxCombo: number;
  monstersKilled: number;
  hitsTaken: number;
  maxGoldHeld: number;
  elitesKilled: number;
  activeBuffs: { id: string; name: string; description: string; effect: { type: string; value: number } }[];
  usedBuffIds: string[];      // 이미 선택한 버프 ID (중복 방지)
  monster: {
    name: string; emoji: string; level: number;
    hp: number; maxHp: number; attack: number; defense: number;
    isElite: boolean; exp_reward: number;
  } | null;
  // 전투 중 블랭크 상태
  currentQuestion: {
    words: string[]; blankIndices: number[]; answers: string[];
    filledBlanks: boolean[]; verseTexts: string[];
    blankGroups?: number[][];
  } | null;
  roomType: string;
  pendingShopAfterElite: boolean;
  pendingBuffSelect: boolean;
  usedRevive: boolean;
  bonusStars: number;
  // 영구 업그레이드 효과 캐시
  goldBonus: number;
  shopDiscount: number;
  buffChoicesBonus: number;
  hasRevive: boolean;
  // 런 내 추가 금화 보너스 (버프)
  buffGoldBonus: number;
  // 시간 보너스 (버프)
  buffTimeBonus: number;
  // 크리티컬 보너스 (버프)
  buffCritPercent: number;
  // 콤보 보너스 (버프)
  buffComboBonus: number;
  // 공격력 감소 디버프 (기도의 샘)
  attackDebuffPercent: number;
}

const runStates: Record<number, RunState> = {};

function getRecord(characterId: number) {
  let rec = queryOne('SELECT * FROM roguelike_records WHERE character_id = ?', [characterId]);
  if (!rec) {
    run('INSERT INTO roguelike_records (character_id) VALUES (?)', [characterId]);
    rec = queryOne('SELECT * FROM roguelike_records WHERE character_id = ?', [characterId]);
  }
  return rec;
}

function getUpgrades(characterId: number): Record<string, number> {
  const rows = queryAll('SELECT upgrade_type, level FROM roguelike_upgrades WHERE character_id = ?', [characterId]);
  const result: Record<string, number> = {};
  for (const r of rows) result[r.upgrade_type] = r.level;
  return result;
}

function getAchievements(characterId: number): string[] {
  const rows = queryAll('SELECT achievement_id FROM roguelike_achievements WHERE character_id = ?', [characterId]);
  return rows.map((r: any) => r.achievement_id);
}

function getUnlocks(characterId: number): string[] {
  const rows = queryAll('SELECT unlock_type FROM roguelike_unlocks WHERE character_id = ?', [characterId]);
  return rows.map((r: any) => r.unlock_type);
}

function buildPermanentState(characterId: number) {
  const rec = getRecord(characterId);
  const upgrades = getUpgrades(characterId);
  const achievements = getAchievements(characterId);
  const unlocks = getUnlocks(characterId);

  const upgradeList = UPGRADE_DEFS.map(u => {
    const lv = upgrades[u.id] || 0;
    const nextCost = lv < u.maxLevel ? u.costs[lv] : -1;
    return { type: u.id, level: lv, name: u.name, maxLevel: u.maxLevel, cost: nextCost, description: u.description };
  });

  const achievementList = ACHIEVEMENT_DEFS.map(a => ({
    id: a.id, name: a.name, description: a.description,
    unlocked: achievements.includes(a.id), reward: a.reward,
  }));

  const unlockedCount = achievements.length;
  const startBuffSlots = unlockedCount >= START_BUFF_SLOT_UNLOCK.value ? START_BUFF_SLOT_UNLOCK.slots : 1;

  // 해금된 시작 버프
  const unlockedStartBuffs = START_BUFF_DEFS.filter(sb => {
    if (sb.unlockCondition.type === 'best_village') return rec.best_room >= sb.unlockCondition.value;
    if (sb.unlockCondition.type === 'best_room') return rec.best_room >= sb.unlockCondition.value;
    return false;
  }).map(sb => ({ id: sb.id, name: sb.name, description: sb.description }));

  return {
    stars: rec.stars,
    upgrades: upgradeList,
    achievements: achievementList,
    bestRoom: rec.best_room,
    totalMonstersKilled: rec.total_monsters_killed,
    bestCombo: rec.best_combo,
    totalRuns: rec.total_runs,
    unlockedStartBuffs,
    startBuffSlots,
  };
}

function toRunStateResponse(s: RunState) {
  return {
    room: s.room,
    villageId: s.villageId,
    villageKillCount: s.villageKillCount,
    playerHp: s.playerHp,
    playerMaxHp: s.playerMaxHp,
    playerAttack: s.playerAttack,
    playerDefense: s.playerDefense,
    gold: s.gold,
    combo: s.combo,
    maxCombo: s.maxCombo,
    monstersKilled: s.monstersKilled,
    hitsTaken: s.hitsTaken,
    maxGoldHeld: s.maxGoldHeld,
    elitesKilled: s.elitesKilled,
    activeBuffs: s.activeBuffs.map(b => ({ id: b.id, name: b.name, description: b.description })),
    roomType: s.roomType,
    monster: s.monster,
    usedRevive: s.usedRevive,
    bonusStars: s.bonusStars,
  };
}

function recalcStats(s: RunState) {
  // 기본 스탯에 버프 적용
  let atkPercent = 0;
  let defPercent = 0;
  let maxHpPercent = 0;

  for (const b of s.activeBuffs) {
    if (b.effect.type === 'attackPercent') atkPercent += b.effect.value;
    if (b.effect.type === 'defensePercent') defPercent += b.effect.value;
    if (b.effect.type === 'maxHpPercent') maxHpPercent += b.effect.value;
  }

  // 공격력 디버프 적용
  atkPercent -= s.attackDebuffPercent;

  const oldMaxHp = s.playerMaxHp;
  s.playerAttack = Math.max(1, Math.floor(s.baseAttack * (1 + atkPercent / 100)));
  s.playerDefense = Math.max(1, Math.floor(s.baseDefense * (1 + defPercent / 100)));
  s.playerMaxHp = Math.max(1, Math.floor(s.baseMaxHp * (1 + maxHpPercent / 100)));

  // 최대 HP가 늘어난 만큼 현재 HP도 비율 유지
  if (s.playerMaxHp > oldMaxHp) {
    s.playerHp += (s.playerMaxHp - oldMaxHp);
  }
  if (s.playerHp > s.playerMaxHp) s.playerHp = s.playerMaxHp;
}

function spawnMonster(s: RunState, forceElite = false) {
  const level = calcNextMonsterLevel(s.villageKillCount, s.villageId);

  const monsterPool = VILLAGE_MONSTERS[s.villageId] || VILLAGE_MONSTERS[1];
  const pick = monsterPool[Math.floor(Math.random() * monsterPool.length)];

  const isElite = forceElite;
  let stats = calcRoguelikeMonsterStats(level);
  if (isElite) stats = calcEliteStats(stats);

  s.monster = {
    name: isElite ? `⚡ ${pick.name}` : pick.name,
    emoji: pick.emoji,
    level,
    hp: stats.hp, maxHp: stats.hp,
    attack: stats.attack, defense: stats.defense,
    isElite,
    exp_reward: stats.exp_reward,
  };
}

export function createRoguelikeHandlers(): HandlerMap {
  const handlers: HandlerMap = {};

  // ===== 영구 상태 조회 =====
  handlers['roguelike:getState'] = (characterId: number) => {
    return buildPermanentState(characterId);
  };

  // ===== 런 시작 =====
  handlers['roguelike:startRun'] = (data: { characterId: number; startBuffs: string[]; villageId: number }) => {
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    if (!character) return null;

    const stats = getCharacterTotalStats(data.characterId);
    if (!stats) return null;

    const upgrades = getUpgrades(data.characterId);

    // 영구 업그레이드 적용
    let hpPercent = (upgrades['perm_hp'] || 0) * 5;
    let atkPercent = (upgrades['perm_atk'] || 0) * 5;
    const goldBonus = (upgrades['perm_gold'] || 0);
    const shopDiscount = (upgrades['perm_discount'] || 0) * 10;
    const buffChoicesBonus = (upgrades['perm_buff'] || 0);
    const hasRevive = (upgrades['perm_revive'] || 0) > 0;

    // 시작 버프 적용
    const activeBuffs: RunState['activeBuffs'] = [];
    for (const sbId of data.startBuffs) {
      const def = START_BUFF_DEFS.find(sb => sb.id === sbId);
      if (def) {
        if (def.effect.type === 'attackPercent') atkPercent += def.effect.value;
        if (def.effect.type === 'defensePercent') {
          // defPercent는 recalcStats에서 처리
        }
        if (def.effect.type === 'maxHpPercent') hpPercent += def.effect.value;
        activeBuffs.push({ id: def.id, name: def.name, description: def.description, effect: def.effect });
      }
    }

    const baseMaxHp = Math.floor(stats.totalHp * (1 + hpPercent / 100));
    const baseAttack = Math.floor(stats.totalAttack * (1 + atkPercent / 100));
    const baseDefense = stats.totalDefense;

    const s: RunState = {
      room: 0,
      villageId: data.villageId || 1,
      villageKillCount: 0,
      playerHp: baseMaxHp, playerMaxHp: baseMaxHp,
      playerAttack: baseAttack, playerDefense: baseDefense,
      baseAttack, baseDefense, baseMaxHp,
      gold: 0, combo: 0, maxCombo: 0,
      monstersKilled: 0, hitsTaken: 0, maxGoldHeld: 0,
      elitesKilled: 0,
      activeBuffs,
      usedBuffIds: data.startBuffs.slice(),
      monster: null,
      currentQuestion: null,
      roomType: 'path_select',
      pendingShopAfterElite: false,
      pendingBuffSelect: false,
      usedRevive: false,
      bonusStars: 0,
      goldBonus, shopDiscount, buffChoicesBonus, hasRevive,
      buffGoldBonus: 0, buffTimeBonus: 0, buffCritPercent: 0,
      buffComboBonus: 0, attackDebuffPercent: 0,
    };

    recalcStats(s);
    runStates[data.characterId] = s;
    return toRunStateResponse(s);
  };

  // ===== 갈림길 선택 (다음 방 진행) =====
  handlers['roguelike:choosePath'] = (data: { characterId: number; choice: 'left' | 'right' }) => {
    const s = runStates[data.characterId];
    if (!s) return null;

    // 이전에 상점/이벤트/버프를 이미 했으면 바로 전투로
    const prevType = s.roomType;
    const alreadyVisited = prevType === 'shop' || prevType === 'event' || prevType === 'buff_select';

    // 버프 선택 체크 (처치 수 기반, 아직 안 했을 때만)
    if (!alreadyVisited && isBuffTrigger(s.monstersKilled)) {
      s.pendingBuffSelect = true;
    }

    // 보스 대기 중인지 체크 (이미 클리어한 마을은 보스 스킵)
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    const bossThreshold = character ? getBossThreshold(character.level, s.villageId) : 10;
    const alreadyCleared = queryOne('SELECT 1 FROM boss_clears WHERE character_id = ? AND village_id = ?', [data.characterId, s.villageId]);
    const bossPending = s.villageKillCount >= bossThreshold && s.villageId <= 20 && !alreadyCleared;

    if (bossPending) {
      // 보스전으로
      s.roomType = 'boss_battle';
    } else if (alreadyVisited) {
      // 상점/이벤트 후 → 바로 전투
      s.roomType = 'battle';
      spawnMonster(s);
    } else {
      // 다음 이벤트 타입 결정 (처치 수 기반)
      const eventType = getNextEventType(s.monstersKilled);

      if (eventType === 'elite') {
        s.roomType = 'elite';
        spawnMonster(s, true);
        if (isShopTrigger(s.monstersKilled)) s.pendingShopAfterElite = true;
      } else if (eventType === 'shop') {
        s.roomType = 'shop';
        s.monster = null;
      } else if (eventType === 'event') {
        s.roomType = 'event';
        s.monster = null;
      } else {
        s.roomType = 'battle';
        spawnMonster(s);
      }
    }

    return toRunStateResponse(s);
  };

  // ===== 엘리트 선택 (도전/도망) =====
  handlers['roguelike:eliteChoice'] = (data: { characterId: number; fight: boolean }) => {
    const s = runStates[data.characterId];
    if (!s) return null;

    if (!data.fight) {
      // 도망: 다음 방으로
      s.monster = null;
      s.roomType = 'path_select';
      // 버프 선택 대기 중이면
      if (s.pendingBuffSelect) {
        s.pendingBuffSelect = false;
        s.roomType = 'buff_select';
      }
      return toRunStateResponse(s);
    }

    // 도전: 전투 시작 (이미 몬스터 스폰됨)
    s.roomType = 'battle';
    return toRunStateResponse(s);
  };

  // ===== 문제 가져오기 =====
  handlers['roguelike:getQuestion'] = (data: { characterId: number; reciteMode: number }) => {
    const s = runStates[data.characterId];
    if (!s || !s.monster) return null;

    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    if (!character) return null;

    // 구절 범위: 몬스터 레벨 기반으로 출제 범위 결정
    const maxVerse = calcVerseCount(s.monster.level);
    const verses = queryAll(
      'SELECT * FROM verses WHERE verse_number >= 1 AND verse_number <= ? AND content != ""',
      [maxVerse]
    );
    if (verses.length === 0) return null;

    // 랜덤 구절 선택
    const verse = verses[Math.floor(Math.random() * verses.length)];
    const content = verse.content as string;
    const words = content.replace(/\s+/g, ' ').split(' ');

    // 블랭크 수
    const blankCount = calcBlankCount(s.monster.level, character.level);
    const actualBlanks = Math.min(blankCount, words.length);

    // 랜덤 블랭크 인덱스
    const indices: number[] = [];
    const available = words.map((_: string, i: number) => i);
    for (let i = 0; i < actualBlanks; i++) {
      const pick = Math.floor(Math.random() * available.length);
      indices.push(available[pick]);
      available.splice(pick, 1);
    }
    indices.sort((a, b) => a - b);

    // 연속 블랭크를 그룹으로 묶기
    // blankGroups: [[0,1,2], [5], [8,9]] 형태
    const blankGroups: number[][] = [];
    for (const idx of indices) {
      const lastGroup = blankGroups[blankGroups.length - 1];
      if (lastGroup && idx === lastGroup[lastGroup.length - 1] + 1) {
        lastGroup.push(idx);
      } else {
        blankGroups.push([idx]);
      }
    }

    // 그룹별 답 (연속 단어를 합침)
    const groupAnswers = blankGroups.map(group => group.map(i => words[i]).join(' '));

    // 제한 시간
    const levelDiff = s.monster.level - character.level;
    let timeLimit = calcTimeLimit(actualBlanks, data.reciteMode, levelDiff);
    // 버프 시간 보너스
    if (timeLimit > 0) timeLimit += s.buffTimeBonus;

    // 상태 저장 (그룹 기반)
    s.currentQuestion = {
      words, blankIndices: indices, answers: groupAnswers,
      filledBlanks: new Array(blankGroups.length).fill(false),
      verseTexts: [content],
      blankGroups,
    };

    return {
      verseTexts: [content],
      verseRef: `${verse.book} ${verse.chapter}:${verse.verse_number}`,
      words, blankIndices: indices, answers: groupAnswers,
      timeLimit, blankCount: blankGroups.length,
      blankGroups,
    };
  };

  // ===== 답변 제출 (그룹 단위 매칭) =====
  handlers['roguelike:submitAnswer'] = (data: { characterId: number; answer: string }) => {
    const s = runStates[data.characterId];
    if (!s || !s.currentQuestion) return { correct: false, filledIndices: [] as number[], remainingBlanks: 0 };

    const q = s.currentQuestion;
    const normalized = normalizeAnswer(data.answer);
    const groups = q.blankGroups || q.blankIndices.map(i => [i]);

    // 아직 안 채워진 그룹 중에서 매칭
    for (let i = 0; i < q.answers.length; i++) {
      if (q.filledBlanks[i]) continue;
      if (normalizeAnswer(q.answers[i]) === normalized) {
        q.filledBlanks[i] = true;
        const remaining = q.filledBlanks.filter(f => !f).length;
        return { correct: true, filledIndices: groups[i], remainingBlanks: remaining };
      }
    }

    return { correct: false, filledIndices: [] as number[], remainingBlanks: q.filledBlanks.filter(f => !f).length };
  };

  // ===== 턴 완료 =====
  handlers['roguelike:completeTurn'] = (data: { characterId: number; allCorrect: boolean }) => {
    const s = runStates[data.characterId];
    if (!s || !s.monster) return null;

    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    if (!character) return null;

    let log = '';
    let damage = 0;
    let isPlayerAttack = data.allCorrect;
    let monsterDefeated = false;
    let playerDead = false;
    let goldEarned = 0;
    let expEarned = 0;
    let itemDrop: any = null;
    let leveledUp = false;
    let newLevel: number | undefined;

    if (data.allCorrect) {
      // 플레이어 공격
      s.combo++;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;

      // 크리티컬
      const critRoll = Math.random() * 100;
      const isCrit = critRoll < s.buffCritPercent;

      damage = calcPlayerDamage(s.playerAttack, s.monster.defense, s.combo + Math.floor(s.buffComboBonus / 5));
      if (isCrit) {
        damage = Math.floor(damage * 1.5);
        log = `⚡ 크리티컬! ${s.monster.name}에게 ${damage} 데미지!`;
      } else {
        log = `⚔️ ${s.monster.name}에게 ${damage} 데미지!`;
      }
      s.monster.hp = Math.max(0, s.monster.hp - damage);

      if (s.monster.hp <= 0) {
        monsterDefeated = true;
        s.monstersKilled++;

        // 금화
        goldEarned = ROGUELIKE_CONFIG.GOLD_PER_KILL + s.goldBonus + s.buffGoldBonus;
        s.gold += goldEarned;
        if (s.gold > s.maxGoldHeld) s.maxGoldHeld = s.gold;

        if (s.monster.isElite) s.elitesKilled++;

        // EXP
        const reduction = calcExpReduction(s.monster.level, character.level);
        expEarned = Math.floor(s.monster.exp_reward * reduction);

        if (expEarned > 0) {
          const lvResult = calcLevelUp(character.level, character.exp, character.max_exp, expEarned);
          run('UPDATE characters SET level = ?, exp = ?, max_exp = ? WHERE id = ?',
            [lvResult.newLevel, lvResult.newExp, lvResult.maxExp, data.characterId]);
          if (lvResult.leveledUp) {
            leveledUp = true;
            newLevel = lvResult.newLevel;
            // 레벨업 시 기본 스탯 재계산 후 적용
            saveDb();
            const newStats = getCharacterTotalStats(data.characterId);
            if (newStats) {
              s.baseAttack = newStats.totalAttack;
              s.baseDefense = newStats.totalDefense;
              s.baseMaxHp = newStats.totalHp;
              recalcStats(s);
            }
          }
        }

        // 아이템 드랍
        if (Math.random() < ROGUELIKE_CONFIG.ITEM_DROP_RATE || s.monster.isElite) {
          if (Math.random() < ROGUELIKE_CONFIG.ITEM_EQUIP_RATE) {
            const item = generateRandomItem(character.level);
            const added = addItemToCharacter(data.characterId, item);
            itemDrop = added;
          }
          // 소모품은 게임모드에서 미적용
        }

        log += ` ${s.monster.name} 처치!`;
      }
    } else {
      // 몬스터 공격 (오답/시간초과)
      s.combo = 0;
      s.hitsTaken++;
      damage = calcMonsterDamage(s.monster.attack, s.playerDefense);
      s.playerHp = Math.max(0, s.playerHp - damage);
      log = `💥 ${s.monster.name}의 공격! ${damage} 데미지를 받았다!`;

      if (s.playerHp <= 0) {
        // 부활 체크
        if (s.hasRevive && !s.usedRevive) {
          s.usedRevive = true;
          s.playerHp = Math.floor(s.playerMaxHp * 0.3);
          log += ` 부활의 기도 발동! HP 30% 회복!`;
        } else {
          playerDead = true;
          log += ' 쓰러졌다...';
        }
      }
    }

    s.currentQuestion = null;

    // 몬스터 처치 후 다음 상태
    if (monsterDefeated) {
      s.villageKillCount++;

      // 보스 출현 체크
      const bossThreshold = getBossThreshold(character.level, s.villageId);
      const alreadyCleared = queryOne('SELECT 1 FROM boss_clears WHERE character_id = ? AND village_id = ?', [data.characterId, s.villageId]);
      const shouldBoss = s.villageKillCount >= bossThreshold && s.villageId <= 20 && !alreadyCleared;

      if (shouldBoss) {
        // 엘리트 후 상점이 대기 중이면 상점 먼저
        if (s.monster?.isElite && s.pendingShopAfterElite) {
          s.pendingShopAfterElite = false;
          s.roomType = 'shop';
        } else if (s.pendingBuffSelect) {
          s.pendingBuffSelect = false;
          s.roomType = 'buff_select';
        } else {
          s.roomType = 'boss_battle';
        }
      } else if (s.monster?.isElite && s.pendingShopAfterElite) {
        s.pendingShopAfterElite = false;
        s.roomType = 'shop';
      } else if (s.pendingBuffSelect) {
        s.pendingBuffSelect = false;
        s.roomType = 'buff_select';
      } else {
        s.roomType = 'path_select';
      }
      s.monster = null;
    }

    if (playerDead) {
      s.roomType = 'run_end';
    }

    const comboMult = calcComboMultiplier(s.combo);

    return {
      playerHp: s.playerHp, playerMaxHp: s.playerMaxHp,
      playerAttack: s.playerAttack, playerDefense: s.playerDefense,
      monsterHp: s.monster?.hp ?? 0, monsterMaxHp: s.monster?.maxHp ?? 0,
      damage, isPlayerAttack, combo: s.combo, comboMultiplier: comboMult,
      log, monsterDefeated, playerDead,
      goldEarned, expEarned, itemDrop, leveledUp, newLevel,
    };
  };

  // ===== 상점 정보 =====
  handlers['roguelike:shopInfo'] = (characterId: number) => {
    const s = runStates[characterId];
    if (!s) return null;

    const items = SHOP_ITEMS.map(si => {
      const discounted = Math.max(1, Math.floor(si.cost * (1 - s.shopDiscount / 100)));
      return { id: si.id, name: si.name, description: si.description, cost: si.cost, discountedCost: discounted };
    });

    return { items, gold: s.gold };
  };

  // ===== 상점 구매 =====
  handlers['roguelike:shopBuy'] = (data: { characterId: number; shopItemId: string }) => {
    const s = runStates[data.characterId];
    if (!s) return { success: false, message: '런 상태가 없습니다.', gold: 0, playerHp: 0, playerMaxHp: 0, playerAttack: 0, playerDefense: 0 };

    const shopItem = SHOP_ITEMS.find(si => si.id === data.shopItemId);
    if (!shopItem) return { success: false, message: '아이템을 찾을 수 없습니다.', gold: s.gold, playerHp: s.playerHp, playerMaxHp: s.playerMaxHp, playerAttack: s.playerAttack, playerDefense: s.playerDefense };

    const cost = Math.max(1, Math.floor(shopItem.cost * (1 - s.shopDiscount / 100)));
    if (s.gold < cost) return { success: false, message: '금화가 부족합니다.', gold: s.gold, playerHp: s.playerHp, playerMaxHp: s.playerMaxHp, playerAttack: s.playerAttack, playerDefense: s.playerDefense };

    s.gold -= cost;

    switch (shopItem.type) {
      case 'heal':
        s.playerHp = Math.min(s.playerMaxHp, s.playerHp + Math.floor(s.playerMaxHp * shopItem.value / 100));
        break;
      case 'attack_buff':
        s.activeBuffs.push({ id: 'shop_atk', name: shopItem.name, description: shopItem.description, effect: { type: 'attackPercent', value: shopItem.value } });
        recalcStats(s);
        break;
      case 'defense_buff':
        s.activeBuffs.push({ id: 'shop_def', name: shopItem.name, description: shopItem.description, effect: { type: 'defensePercent', value: shopItem.value } });
        recalcStats(s);
        break;
      case 'maxhp_buff':
        s.activeBuffs.push({ id: 'shop_maxhp', name: shopItem.name, description: shopItem.description, effect: { type: 'maxHpPercent', value: shopItem.value } });
        recalcStats(s);
        break;
    }

    return { success: true, message: `${shopItem.name} 구매 완료!`, gold: s.gold, playerHp: s.playerHp, playerMaxHp: s.playerMaxHp, playerAttack: s.playerAttack, playerDefense: s.playerDefense };
  };

  // ===== 이벤트 정보 =====
  handlers['roguelike:eventInfo'] = (characterId: number) => {
    const s = runStates[characterId];
    if (!s) return null;

    const event = EVENT_DEFS[Math.floor(Math.random() * EVENT_DEFS.length)];
    // 이벤트 ID를 상태에 저장
    (s as any)._currentEvent = event;

    const choices = event.choices.map(c => ({
      label: c.label,
      cost: c.cost ? `${c.cost.type === 'gold' ? `금화 ${c.cost.value}` : `HP ${c.cost.value}%`}` : undefined,
    }));

    return { id: event.id, name: event.name, description: event.description, choices };
  };

  // ===== 이벤트 선택 =====
  handlers['roguelike:eventChoice'] = (data: { characterId: number; choiceIndex: number }) => {
    const s = runStates[data.characterId];
    if (!s) return null;

    const event = (s as any)._currentEvent as typeof EVENT_DEFS[0] | undefined;
    if (!event) return null;

    const choice = event.choices[data.choiceIndex];
    const outcome = event.outcomes[data.choiceIndex];
    if (!outcome) return null;

    // 비용 체크
    if (choice?.cost) {
      if (choice.cost.type === 'gold') {
        if (s.gold < choice.cost.value) {
          delete (s as any)._currentEvent;
          s.roomType = 'path_select';
          return { result: '금화가 부족합니다!', runState: toRunStateResponse(s) };
        }
        s.gold -= choice.cost.value;
      }
      if (choice.cost.type === 'hp') {
        const hpCost = Math.floor(s.playerMaxHp * choice.cost.value / 100);
        s.playerHp = Math.max(1, s.playerHp - hpCost);
      }
    }

    let resultMsg: string;
    let eventItem: any = null;
    const roll = Math.random();

    // 이전 스탯 저장
    const beforeStats = {
      playerHp: s.playerHp,
      playerMaxHp: s.playerMaxHp,
      playerAttack: s.playerAttack,
      playerDefense: s.playerDefense,
      gold: s.gold,
    };

    if (roll < outcome.successRate) {
      resultMsg = outcome.success.message;
      switch (outcome.success.type) {
        case 'item': {
          const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
          if (character) {
            const item = generateRandomItem(character.level);
            eventItem = addItemToCharacter(data.characterId, item);
            saveDb();
          }
          break;
        }
        case 'buff': {
          // 랜덤 버프 1개
          const available = BUFF_POOL.filter(b => !s.usedBuffIds.includes(b.id) && b.id !== 'heal');
          if (available.length > 0) {
            const pick = available[Math.floor(Math.random() * available.length)];
            s.activeBuffs.push({ id: pick.id, name: pick.name, description: pick.description, effect: pick.effect });
            s.usedBuffIds.push(pick.id);
            applyBuffEffect(s, pick);
            recalcStats(s);
          }
          break;
        }
        case 'strong_buff': {
          // 강력한 버프: 공격력 +20%
          s.activeBuffs.push({ id: 'strong_atk', name: '강력한 축복', description: '공격력 +20%', effect: { type: 'attackPercent', value: 20 } });
          recalcStats(s);
          break;
        }
        case 'heal_debuff': {
          s.playerHp = Math.min(s.playerMaxHp, s.playerHp + Math.floor(s.playerMaxHp * outcome.success.value / 100));
          s.attackDebuffPercent += 5;
          recalcStats(s);
          break;
        }
        case 'stars': {
          s.bonusStars += outcome.success.value;
          break;
        }
        case 'damage': {
          // 함정 (fail 케이스에서 호출)
          break;
        }
      }
    } else if (outcome.fail) {
      resultMsg = outcome.fail.message;
      if (outcome.fail.type === 'damage') {
        const dmg = Math.floor(s.playerMaxHp * outcome.fail.value / 100);
        s.playerHp = Math.max(1, s.playerHp - dmg);
      }
    } else {
      resultMsg = '아무 일도 일어나지 않았다.';
    }

    delete (s as any)._currentEvent;

    // 이벤트 후 버프 선택 또는 경로 선택
    if (s.pendingBuffSelect) {
      s.pendingBuffSelect = false;
      s.roomType = 'buff_select';
    } else {
      s.roomType = 'path_select';
    }

    // 스탯 변경 사항 계산
    const statChanges: { label: string; before: number; after: number }[] = [];
    if (s.playerHp !== beforeStats.playerHp) statChanges.push({ label: 'HP', before: beforeStats.playerHp, after: s.playerHp });
    if (s.playerMaxHp !== beforeStats.playerMaxHp) statChanges.push({ label: '최대HP', before: beforeStats.playerMaxHp, after: s.playerMaxHp });
    if (s.playerAttack !== beforeStats.playerAttack) statChanges.push({ label: '공격력', before: beforeStats.playerAttack, after: s.playerAttack });
    if (s.playerDefense !== beforeStats.playerDefense) statChanges.push({ label: '방어력', before: beforeStats.playerDefense, after: s.playerDefense });
    if (s.gold !== beforeStats.gold) statChanges.push({ label: '금화', before: beforeStats.gold, after: s.gold });

    return { result: resultMsg, runState: toRunStateResponse(s), statChanges, eventItem };
  };

  // ===== 버프 선택지 가져오기 =====
  handlers['roguelike:getBuffChoices'] = (characterId: number) => {
    const s = runStates[characterId];
    if (!s) return [];

    const available = BUFF_POOL.filter(b => !s.usedBuffIds.includes(b.id));
    const count = 3 + s.buffChoicesBonus;
    const choices: typeof BUFF_POOL = [];

    const pool = [...available];
    for (let i = 0; i < Math.min(count, pool.length); i++) {
      const idx = Math.floor(Math.random() * pool.length);
      choices.push(pool[idx]);
      pool.splice(idx, 1);
    }

    return choices.map(b => ({ id: b.id, name: b.name, description: b.description }));
  };

  // ===== 버프 선택 =====
  handlers['roguelike:selectBuff'] = (data: { characterId: number; buffId: string }) => {
    const s = runStates[data.characterId];
    if (!s) return null;

    const buff = BUFF_POOL.find(b => b.id === data.buffId);
    if (!buff || s.usedBuffIds.includes(buff.id)) return toRunStateResponse(s);

    s.usedBuffIds.push(buff.id);

    // 즉시 효과 (heal)
    if (buff.effect.type === 'healPercent') {
      s.playerHp = Math.min(s.playerMaxHp, s.playerHp + Math.floor(s.playerMaxHp * buff.effect.value / 100));
    } else {
      s.activeBuffs.push({ id: buff.id, name: buff.name, description: buff.description, effect: buff.effect });
      applyBuffEffect(s, buff);
      recalcStats(s);
    }

    // 상점 대기 중이면 상점으로
    if (s.pendingShopAfterElite) {
      s.pendingShopAfterElite = false;
      s.roomType = 'shop';
    } else {
      s.roomType = 'path_select';
    }

    return toRunStateResponse(s);
  };

  // ===== 런 종료 =====
  handlers['roguelike:endRun'] = (characterId: number) => {
    const s = runStates[characterId];
    if (!s) return null;

    const rec = getRecord(characterId);
    const starsEarned = calcStarsEarned(s.monstersKilled, s.elitesKilled) + s.bonusStars;

    // 기록 업데이트 (best_room은 최고 도달 마을로 사용)
    const newBestRoom = Math.max(rec.best_room, s.villageId);
    const newBestCombo = Math.max(rec.best_combo, s.maxCombo);
    const newTotalKills = rec.total_monsters_killed + s.monstersKilled;
    const newTotalRuns = rec.total_runs + 1;
    const newStars = rec.stars + starsEarned;

    run('UPDATE roguelike_records SET stars = ?, best_room = ?, total_monsters_killed = ?, best_combo = ?, total_runs = ? WHERE character_id = ?',
      [newStars, newBestRoom, newTotalKills, newBestCombo, newTotalRuns, characterId]);

    // 업적 체크
    const existingAchievements = getAchievements(characterId);
    const newAchievements: { id: string; name: string; reward: number }[] = [];

    for (const ach of ACHIEVEMENT_DEFS) {
      if (existingAchievements.includes(ach.id)) continue;

      let achieved = false;
      switch (ach.condition.type) {
        case 'best_village': achieved = newBestRoom >= ach.condition.value; break;
        case 'best_room': achieved = newBestRoom >= ach.condition.value; break;
        case 'best_combo': achieved = newBestCombo >= ach.condition.value; break;
        case 'total_kills': achieved = newTotalKills >= ach.condition.value; break;
        case 'no_hit_kills': achieved = s.hitsTaken === 0 && s.monstersKilled >= ach.condition.value; break;
        case 'max_gold': achieved = s.maxGoldHeld >= ach.condition.value; break;
      }

      if (achieved) {
        run('INSERT OR IGNORE INTO roguelike_achievements (character_id, achievement_id) VALUES (?, ?)', [characterId, ach.id]);
        // 업적 별 보상
        run('UPDATE roguelike_records SET stars = stars + ? WHERE character_id = ?', [ach.reward, characterId]);
        newAchievements.push({ id: ach.id, name: ach.name, reward: ach.reward });
      }
    }

    // 해금 체크
    for (const sb of START_BUFF_DEFS) {
      if ((sb.unlockCondition.type === 'best_village' || sb.unlockCondition.type === 'best_room') && s.villageId >= sb.unlockCondition.value) {
        run('INSERT OR IGNORE INTO roguelike_unlocks (character_id, unlock_type) VALUES (?, ?)', [characterId, sb.id]);
      }
    }

    const finalRec = getRecord(characterId);

    delete runStates[characterId];

    return {
      roomReached: s.monstersKilled,
      starsEarned: starsEarned + newAchievements.reduce((sum, a) => sum + a.reward, 0),
      totalStars: finalRec.stars,
      monstersKilled: s.monstersKilled,
      maxCombo: s.maxCombo,
      newAchievements,
      itemsKept: s.monstersKilled, // 아이템은 이미 DB에 영구 저장됨
    };
  };

  // ===== 영구 업그레이드 구매 =====
  handlers['roguelike:upgrade'] = (data: { characterId: number; upgradeType: string }) => {
    const rec = getRecord(data.characterId);
    const upgradeDef = UPGRADE_DEFS.find(u => u.id === data.upgradeType);
    if (!upgradeDef) return { success: false, message: '업그레이드를 찾을 수 없습니다.', state: buildPermanentState(data.characterId) };

    const currentLevel = getUpgrades(data.characterId)[data.upgradeType] || 0;
    if (currentLevel >= upgradeDef.maxLevel) return { success: false, message: '이미 최대 단계입니다.', state: buildPermanentState(data.characterId) };

    const cost = upgradeDef.costs[currentLevel];
    if (rec.stars < cost) return { success: false, message: `별이 부족합니다. (필요: ⭐${cost}, 보유: ⭐${rec.stars})`, state: buildPermanentState(data.characterId) };

    run('UPDATE roguelike_records SET stars = stars - ? WHERE character_id = ?', [cost, data.characterId]);
    run('INSERT INTO roguelike_upgrades (character_id, upgrade_type, level) VALUES (?, ?, 1) ON CONFLICT(character_id, upgrade_type) DO UPDATE SET level = level + 1',
      [data.characterId, data.upgradeType]);

    return { success: true, message: `${upgradeDef.name} ${currentLevel + 1}단계 업그레이드 완료!`, state: buildPermanentState(data.characterId) };
  };

  // ===== 보스전 완료 =====
  handlers['roguelike:bossComplete'] = (data: { characterId: number; villageId: number; victory: boolean }) => {
    const s = runStates[data.characterId];
    if (!s) return null;

    if (!data.victory) {
      s.roomType = 'run_end';
      return { runState: toRunStateResponse(s), bossVictory: false, reward: null };
    }

    // 보스 클리어 기록
    run('INSERT OR IGNORE INTO boss_clears (character_id, village_id) VALUES (?, ?)', [data.characterId, data.villageId]);
    saveDb();

    // 보상: 신화급 아이템
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    let reward = null;
    if (character) {
      reward = generateMythicItem(character.level + 5);
      addItemToCharacter(data.characterId, reward);
    }

    // 마지막 마을이면 게임 클리어
    if (s.villageId >= 20) {
      s.roomType = 'run_end';
      return { runState: toRunStateResponse(s), bossVictory: true, reward, finalVictory: true };
    }

    // 다음 마을 진행
    s.villageId++;
    s.villageKillCount = 0;
    s.roomType = 'path_select';

    return { runState: toRunStateResponse(s), bossVictory: true, reward };
  };

  // ===== 디버그: 보스 즉시 소환 =====
  handlers['roguelike:debugBoss'] = (characterId: number) => {
    const s = runStates[characterId];
    if (!s) return null;
    s.roomType = 'boss_battle';
    return toRunStateResponse(s);
  };

  // ===== 디버그: 이벤트 강제 발생 =====
  handlers['roguelike:debugEvent'] = (characterId: number) => {
    const s = runStates[characterId];
    if (!s) return null;
    s.roomType = 'event';
    return toRunStateResponse(s);
  };

  return handlers;
}

// 버프 부가 효과 적용
function applyBuffEffect(s: RunState, buff: { effect: { type: string; value: number } }) {
  switch (buff.effect.type) {
    case 'goldBonus': s.buffGoldBonus += buff.effect.value; break;
    case 'timeBonus': s.buffTimeBonus += buff.effect.value; break;
    case 'critPercent': s.buffCritPercent += buff.effect.value; break;
    case 'comboBonus': s.buffComboBonus += buff.effect.value; break;
  }
}
