import { queryAll, queryOne, run } from '../db';
import { calcTotalStats, calcWinRate, calcLevelUp } from '../game-logic';
import { generateRandomItem, addItemToCharacter } from '../item-service';
import { VILLAGE_LEVEL_REQS, VILLAGE_MONSTERS } from '../game-data';
import { getEquippedItems } from './character';
import { HandlerMap } from './types';

export function createBattleHandlers(): HandlerMap {
  const handlers: HandlerMap = {};

  handlers['monster:random'] = (data: { characterLevel: number; villageId: number }) => {
    const { characterLevel, villageId } = typeof data === 'number'
      ? { characterLevel: data, villageId: 1 }
      : data;

    const monsters = VILLAGE_MONSTERS[villageId] || VILLAGE_MONSTERS[1];
    const type = monsters[Math.floor(Math.random() * monsters.length)];

    const villageMinLevel = Math.max(1, (VILLAGE_LEVEL_REQS[villageId - 1] || 1) - 1);
    const villageMaxLevel = (VILLAGE_LEVEL_REQS[villageId - 1] || 1) + 10 + 2;
    const minLv = Math.min(Math.max(villageMinLevel, characterLevel - 5), villageMaxLevel);
    const maxLv = Math.min(characterLevel + 5, villageMaxLevel);
    const level = minLv + Math.floor(Math.random() * (Math.max(0, maxLv - minLv) + 1));

    const hp = 400 + level * 150;
    const attack = 50 + level * 30;
    const defense = 20 + level * 20;
    const exp_reward = 10 + level * 8;
    const power = attack + defense + Math.floor(hp / 10);

    return { id: 0, name: type.name, emoji: type.emoji, level, hp, attack, defense, exp_reward, power };
  };

  handlers['battle:fight'] = (data: { characterId: number; monsterId: number; monster: any; scorePercent: number; noDrop?: boolean }) => {
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    const monster = data.monster;
    if (!character || !monster) return { victory: false, log: ['오류 발생'], battleExp: 0, battleRewards: [], monsterName: '', monsterEmoji: '', battleLeveledUp: false };

    const equippedItems = getEquippedItems(data.characterId);
    const stats = calcTotalStats(character.level, equippedItems);
    const playerAttack = stats.totalAttack;
    const playerDefense = stats.totalDefense;
    const playerMaxHp = stats.totalHp;
    const playerEvasion = Math.min(30, stats.totalEvasion);

    const playerPower = playerAttack + playerDefense + Math.floor(playerMaxHp / 10) + playerEvasion;
    const monsterPower = monster.attack + monster.defense + Math.floor(monster.hp / 10);

    const { finalWinRate, baseWinRate, scoreBonus } = calcWinRate(playerPower, monsterPower, data.scorePercent);

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
    const totalTurns = 4 + Math.floor(Math.random() * 3);
    const playerDmgPerTurn = Math.max(1, playerAttack - monster.defense);
    const monsterDmgPerTurn = Math.max(1, monster.attack - playerDefense);

    for (let turn = 1; turn <= totalTurns; turn++) {
      const isLastTurn = turn === totalTurns;
      const progress = turn / totalTurns;

      // 플레이어 공격
      const critChance = victory ? 0.2 + progress * 0.1 : 0.05;
      const missChance = victory ? 0.05 : 0.1 + progress * 0.1;
      const isCrit = Math.random() < critChance;
      const playerMiss = Math.random() < missChance;

      let playerDmg = Math.max(1, Math.floor(playerDmgPerTurn * (0.7 + Math.random() * 0.6)));
      if (isCrit) playerDmg = Math.floor(playerDmg * 1.5);

      if (playerMiss) {
        log.push(`${turn}턴: ${character.name}의 공격이 빗나갔다!`);
      } else if (victory && isLastTurn && monsterHp > 0) {
        playerDmg = Math.max(playerDmg, monsterHp);
        monsterHp = 0;
        log.push(playerDmg > playerDmgPerTurn * 1.3
          ? `${turn}턴: ${character.name}의 강력한 일격! ${playerDmg} 데미지! 💥 (몬스터 HP: 0)`
          : `${turn}턴: ${character.name}이(가) ${playerDmg} 데미지!${isCrit ? ' 💥크리티컬!' : ''} (몬스터 HP: 0)`);
      } else {
        monsterHp = Math.max(0, monsterHp - playerDmg);
        log.push(`${turn}턴: ${character.name}이(가) ${playerDmg} 데미지!${isCrit ? ' 💥크리티컬!' : ''} (몬스터 HP: ${monsterHp})`);
      }
      if (monsterHp <= 0) break;

      // 몬스터 공격
      const evasionChance = victory
        ? Math.min(playerEvasion + 10, 40)
        : Math.max(0, playerEvasion - progress * 15);
      const monsterMiss = Math.random() * 100 < evasionChance;

      let monsterDmg = Math.max(1, Math.floor(monsterDmgPerTurn * (0.7 + Math.random() * 0.6)));
      if (!victory && progress > 0.5) monsterDmg = Math.floor(monsterDmg * (1 + progress * 0.5));
      if (victory) monsterDmg = Math.floor(monsterDmg * 0.7);

      if (monsterMiss) {
        log.push(`${turn}턴: ${character.name}이(가) ${monster.name}의 공격을 회피했다! 💨`);
      } else if (!victory && isLastTurn && playerHp > 0) {
        monsterDmg = Math.max(monsterDmg, playerHp);
        playerHp = 0;
        log.push(monsterDmg > monsterDmgPerTurn * 1.3
          ? `${turn}턴: ${monster.name}의 강력한 일격! ${monsterDmg} 데미지! (내 HP: 0)`
          : `${turn}턴: ${monster.name}이(가) ${monsterDmg} 데미지! (내 HP: 0)`);
      } else {
        playerHp = Math.max(0, playerHp - monsterDmg);
        log.push(`${turn}턴: ${monster.name}이(가) ${monsterDmg} 데미지! (내 HP: ${playerHp})`);
      }
      if (playerHp <= 0) break;
    }

    // 보상 처리
    let battleExp = 0;
    const battleRewards: any[] = [];

    if (victory) {
      battleExp = monster.exp_reward;
      log.push('---');
      log.push(`🎉 승리! 전투 경험치 +${battleExp}`);

      if (!data.noDrop && Math.random() < 0.55) {
        log.push(`🎁 아이템 상자를 획득했다!`);
        if (Math.random() < 0.55) {
          const droppedItem = generateRandomItem(monster.level);
          battleRewards.push(addItemToCharacter(data.characterId, droppedItem));
        } else {
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

    // 전투 경험치 → 레벨업
    let battleLeveledUp = false;
    if (victory && battleExp > 0) {
      const charNow = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
      if (charNow) {
        const levelResult = calcLevelUp(charNow.level, charNow.exp, charNow.max_exp, battleExp);
        battleLeveledUp = levelResult.leveledUp;

        if (levelResult.levelUps > 0) {
          for (let i = 0; i < levelResult.levelUps; i++) {
            const itemLevel = levelResult.newLevel - levelResult.levelUps + i + 1;
            const item = generateRandomItem(itemLevel);
            battleRewards.push(addItemToCharacter(data.characterId, item));
          }
        }

        run('UPDATE characters SET exp = ?, level = ?, max_exp = ? WHERE id = ?',
          [levelResult.newExp, levelResult.newLevel, levelResult.maxExp, data.characterId]);
      }
    }

    return {
      victory, log, battleExp, battleRewards,
      monsterName: monster.name, monsterEmoji: monster.emoji, battleLeveledUp,
    };
  };

  return handlers;
}
