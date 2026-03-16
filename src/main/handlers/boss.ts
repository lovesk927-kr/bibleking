import { queryAll, queryOne, run, getDb, saveDb } from '../db';
import { calcBossStats } from '../game-logic';
import { getBossData } from '../game-data';
import { generateMythicItem, addItemToCharacter } from '../item-service';
import { getCharacterTotalStats } from './character';
import { HandlerMap } from './types';

// 보스전 상태를 메모리에 보관 (캐릭터당 1개)
const bossBattleStates: Record<number, {
  villageId: number; bossHp: number; bossMaxHp: number; bossAttack: number;
  playerHp: number; playerMaxHp: number; playerAttack: number; playerDefense: number; playerEvasion: number;
  round: number;
}> = {};

export function createBossHandlers(): HandlerMap {
  const handlers: HandlerMap = {};

  handlers['boss:getClears'] = (characterId: number) => {
    const rows = queryAll('SELECT village_id FROM boss_clears WHERE character_id = ?', [characterId]);
    return rows.map((r: any) => r.village_id);
  };

  handlers['boss:checkReady'] = (villageId: number) => {
    const boss = getBossData(villageId);
    if (!boss) return { ready: false, message: '보스 데이터가 없습니다.' };
    const [startVerse, endVerse] = boss.quizRange;
    const verses = queryAll(
      'SELECT verse_number FROM verses WHERE verse_number >= ? AND verse_number <= ? AND blank_template != ""',
      [startVerse, endVerse]
    );
    if (verses.length === 0) return { ready: false, message: '아직 준비되지 않은 전투입니다.' };
    return { ready: true };
  };

  handlers['boss:startBattle'] = (data: { characterId: number; villageId: number }) => {
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    if (!character) return null;

    const boss = getBossData(data.villageId);
    if (!boss) return null;

    const stats = getCharacterTotalStats(data.characterId);
    if (!stats) return null;

    const { bossMaxHp, bossAttack } = calcBossStats(stats.totalAttack, stats.totalHp);

    const state = {
      villageId: data.villageId,
      bossHp: bossMaxHp, bossMaxHp, bossAttack,
      playerHp: stats.totalHp, playerMaxHp: stats.totalHp,
      playerAttack: stats.totalAttack, playerDefense: stats.totalDefense, playerEvasion: stats.totalEvasion,
      round: 0,
    };
    bossBattleStates[data.characterId] = state;

    return {
      bossVillageId: data.villageId,
      bossName: boss.name, bossEmoji: boss.emoji, bossTitle: boss.title,
      bossHp: state.bossHp, bossMaxHp: state.bossMaxHp, bossAttack: state.bossAttack,
      playerHp: state.playerHp, playerMaxHp: state.playerMaxHp,
      playerAttack: state.playerAttack, playerDefense: state.playerDefense, playerEvasion: state.playerEvasion,
      round: 0, phase: 'intro', log: [], currentQuestion: null, timeLimit: 40,
    };
  };

  handlers['boss:getQuestion'] = (data: { villageId: number; reciteMode: number }) => {
    const boss = getBossData(data.villageId);
    if (!boss) return null;

    const [startVerse, endVerse] = boss.quizRange;
    const verses = queryAll(
      'SELECT * FROM verses WHERE verse_number >= ? AND verse_number <= ? AND blank_template != ""',
      [startVerse, endVerse]
    );
    if (verses.length === 0) return null;

    const verse = verses[Math.floor(Math.random() * verses.length)];
    const content = verse.content as string;
    const words = content.replace(/\s+/g, ' ').split(' ');
    const blankIdx = Math.floor(Math.random() * words.length);

    return {
      verseNumber: verse.verse_number, verseContent: content,
      words, blankIndices: [blankIdx], answers: [words[blankIdx]],
    };
  };

  handlers['boss:attack'] = (data: { characterId: number; villageId: number; correct: boolean }) => {
    const state = bossBattleStates[data.characterId];
    if (!state) return { bossHp: 0, playerHp: 0, damage: 0, dodged: false, log: '전투 상태가 없습니다.' };

    state.round++;
    let log = '';

    if (data.correct) {
      const damage = state.playerAttack;
      state.bossHp = Math.max(0, state.bossHp - damage);
      log = `⚔️ ${state.round}턴: 정답! 보스에게 ${damage} 데미지!`;
    } else {
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

    return { bossHp: state.bossHp, playerHp: state.playerHp, damage: data.correct ? state.playerAttack : 0, dodged: false, log };
  };

  handlers['boss:complete'] = (data: { characterId: number; villageId: number }) => {
    const db = getDb();
    db.run('INSERT OR IGNORE INTO boss_clears (character_id, village_id) VALUES (?, ?)', [data.characterId, data.villageId]);
    saveDb();

    delete bossBattleStates[data.characterId];

    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    const level = character ? character.level : 1;
    let savedReward: any = null;
    let rewardError: string | null = null;
    try {
      const reward = generateMythicItem(level);
      savedReward = addItemToCharacter(data.characterId, reward);
    } catch (e: any) {
      rewardError = e.message + ' | ' + e.stack;
    }
    saveDb();

    const clears = queryAll('SELECT village_id FROM boss_clears WHERE character_id = ?', [data.characterId]);

    const boss = getBossData(data.villageId);
    return {
      victory: true, villageId: data.villageId,
      bossName: boss?.name || '보스', bossEmoji: boss?.emoji || '👿',
      reward: savedReward, lightFragment: clears.length, rewardError,
    };
  };

  return handlers;
}
