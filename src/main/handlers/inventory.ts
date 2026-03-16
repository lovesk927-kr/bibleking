import { queryAll, queryOne, run, getDb, saveDb } from '../db';
import { calcItemStatBonus, calcEnhanceSuccessRate } from '../game-logic';
import { HandlerMap } from './types';

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'mythic'];
const RARITY_KOR: Record<string, string> = { common: '일반', uncommon: '고급', rare: '희귀', epic: '전설', mythic: '신화' };

export function createInventoryHandlers(): HandlerMap {
  const handlers: HandlerMap = {};

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

    const itemInfos = data.ciIds.map(ciId => queryOne(`
      SELECT i.*, ci.id as ci_id, ci.is_equipped, ci.enhance_level FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.id = ? AND ci.character_id = ?
    `, [ciId, data.characterId]));

    if (itemInfos.some((i: any) => !i)) return { success: false, message: '아이템을 찾을 수 없습니다.' };
    if (itemInfos.some((i: any) => i.is_equipped)) return { success: false, message: '장착 중인 아이템은 합성할 수 없습니다.' };

    const firstName = itemInfos[0].name;
    const firstRarity = itemInfos[0].rarity;
    if (!itemInfos.every((i: any) => i.name === firstName && i.rarity === firstRarity)) {
      return { success: false, message: '같은 이름, 같은 등급 아이템 3개가 필요합니다.' };
    }

    const rarityIdx = RARITY_ORDER.indexOf(firstRarity);
    if (rarityIdx >= RARITY_ORDER.length - 1) return { success: false, message: '신화 등급은 더 이상 합성할 수 없습니다.' };

    const newRarity = RARITY_ORDER[rarityIdx + 1];
    const maxLevel = Math.max(...itemInfos.map((i: any) => i.level_req || 1));
    const statType = itemInfos[0].stat_type;
    const newStatBonus = calcItemStatBonus(statType, maxLevel, rarityIdx + 1);

    for (const ciId of data.ciIds) {
      run('DELETE FROM character_items WHERE id = ? AND character_id = ?', [ciId, data.characterId]);
    }

    const statName = statType === 'attack' ? '공격력' : statType === 'defense' ? '방어력' : statType === 'evasion' ? '회피율' : '체력';
    const desc = `${RARITY_KOR[newRarity]} 등급 장비. ${statName} +${newStatBonus}`;
    run('INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [firstName, desc, itemInfos[0].type, statType, newStatBonus, newRarity, maxLevel]);
    const newItem = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
    run('INSERT INTO character_items (character_id, item_id, is_equipped, enhance_level) VALUES (?, ?, 0, 0)', [data.characterId, newItem.id]);

    return { success: true, message: `합성 성공! ${firstName} [${RARITY_KOR[newRarity]}]` };
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

    const nextLevel = target.enhance_level + 1;
    const rate = calcEnhanceSuccessRate(nextLevel);
    const success = Math.random() * 100 < rate;

    run('DELETE FROM character_items WHERE id = ? AND character_id = ?', [data.materialCiId, data.characterId]);

    const materialLevel = material.level_req || 1;
    const targetLevel = target.level_req || 1;
    if (materialLevel > targetLevel) {
      const rarityIdx = RARITY_ORDER.indexOf(target.rarity);
      const newStatBonus = calcItemStatBonus(target.stat_type, materialLevel, rarityIdx);
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

  return handlers;
}
