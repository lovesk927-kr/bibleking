import { queryOne, run, saveDb } from '../db';
import { calcLevelUp } from '../game-logic';
import { HandlerMap } from './types';

export function createPvpHandlers(): HandlerMap {
  const handlers: HandlerMap = {};

  handlers['pvp:getRecord'] = (characterName: string) => {
    const record = queryOne('SELECT wins, losses FROM pvp_records WHERE character_name = ?', [characterName]);
    return record || { wins: 0, losses: 0 };
  };

  handlers['pvp:grantExp'] = (data: { characterId: number; exp: number }) => {
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    if (!character || data.exp <= 0) return { earnedExp: 0, leveledUp: false };

    const result = calcLevelUp(character.level, character.exp, character.max_exp, data.exp);
    run('UPDATE characters SET exp = ?, level = ?, max_exp = ? WHERE id = ?',
      [result.newExp, result.newLevel, result.maxExp, data.characterId]);
    saveDb();
    return { earnedExp: data.exp, leveledUp: result.leveledUp, newLevel: result.newLevel, newExp: result.newExp, maxExp: result.maxExp };
  };

  handlers['pvp:updateRecord'] = (data: { characterName: string; win: boolean }) => {
    const existing = queryOne('SELECT id FROM pvp_records WHERE character_name = ?', [data.characterName]);
    if (existing) {
      if (data.win) {
        run('UPDATE pvp_records SET wins = wins + 1 WHERE character_name = ?', [data.characterName]);
      } else {
        run('UPDATE pvp_records SET losses = losses + 1 WHERE character_name = ?', [data.characterName]);
      }
    } else {
      run('INSERT INTO pvp_records (character_name, wins, losses) VALUES (?, ?, ?)',
        [data.characterName, data.win ? 1 : 0, data.win ? 0 : 1]);
    }
    return true;
  };

  return handlers;
}
