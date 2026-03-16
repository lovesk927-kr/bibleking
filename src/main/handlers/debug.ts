import { queryOne, run } from '../db';
import { HandlerMap } from './types';

export function createDebugHandlers(): HandlerMap {
  const handlers: HandlerMap = {};

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

  return handlers;
}
