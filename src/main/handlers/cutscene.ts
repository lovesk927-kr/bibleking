import { queryOne, getDb, saveDb } from '../db';
import { HandlerMap } from './types';

export function createCutsceneHandlers(): HandlerMap {
  const handlers: HandlerMap = {};

  handlers['cutscene:getPrologueSeen'] = (characterId: number) => {
    const row = queryOne(
      "SELECT id FROM cutscene_seen WHERE character_id = ? AND village_id = 0 AND type = 'prologue'",
      [characterId]
    );
    return !!row;
  };

  handlers['cutscene:setPrologueSeen'] = (characterId: number) => {
    const db = getDb();
    db.run(
      "INSERT OR IGNORE INTO cutscene_seen (character_id, village_id, type) VALUES (?, 0, 'prologue')",
      [characterId]
    );
    saveDb();
    return true;
  };

  handlers['cutscene:getSeen'] = (data: { characterId: number; villageId: number; type: string }) => {
    const row = queryOne(
      'SELECT id FROM cutscene_seen WHERE character_id = ? AND village_id = ? AND type = ?',
      [data.characterId, data.villageId, data.type]
    );
    return !!row;
  };

  handlers['cutscene:setSeen'] = (data: { characterId: number; villageId: number; type: string }) => {
    const db = getDb();
    db.run(
      'INSERT OR IGNORE INTO cutscene_seen (character_id, village_id, type) VALUES (?, ?, ?)',
      [data.characterId, data.villageId, data.type]
    );
    saveDb();
    return true;
  };

  return handlers;
}
