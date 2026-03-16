import { queryAll, queryOne, run, saveDb } from '../db';
import { HandlerMap } from './types';

export function createConsumableHandlers(): HandlerMap {
  const handlers: HandlerMap = {};

  handlers['consumable:getAll'] = (characterId: number) => {
    return queryAll('SELECT type, quantity FROM consumables WHERE character_id = ? AND quantity > 0', [characterId]);
  };

  handlers['consumable:use'] = (data: { characterId: number; type: string }) => {
    const row = queryOne('SELECT quantity FROM consumables WHERE character_id = ? AND type = ?', [data.characterId, data.type]);
    if (!row || row.quantity <= 0) return { success: false, message: '소모품이 부족합니다.' };
    run('UPDATE consumables SET quantity = quantity - 1 WHERE character_id = ? AND type = ?', [data.characterId, data.type]);
    return { success: true };
  };

  handlers['consumable:transfer'] = (data: { fromCharacterId: number; toCharacterId: number; type: string; quantity: number }) => {
    const row = queryOne('SELECT quantity FROM consumables WHERE character_id = ? AND type = ?', [data.fromCharacterId, data.type]);
    if (!row || row.quantity < data.quantity) return { success: false, message: '소모품이 부족합니다.' };

    run('UPDATE consumables SET quantity = quantity - ? WHERE character_id = ? AND type = ?', [data.quantity, data.fromCharacterId, data.type]);

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

  return handlers;
}
