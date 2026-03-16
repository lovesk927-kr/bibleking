import { queryAll, queryOne, run, getSetting, saveSetting } from '../db';
import { HandlerMap } from './types';

export function createFileHandlers(): HandlerMap {
  const handlers: HandlerMap = {};

  handlers['file:getExportData'] = () => {
    const settings = {
      book: getSetting('book', '시편'),
      chapter: getSetting('chapter', '119'),
      startVerse: parseInt(getSetting('start_verse', '1')),
      verseCount: parseInt(getSetting('verse_count', '10')),
    };
    const verses = queryAll(
      'SELECT verse_number, content, blank_template FROM verses WHERE book = ? AND chapter = ? AND verse_number >= ? ORDER BY verse_number LIMIT ?',
      [settings.book, parseInt(settings.chapter), settings.startVerse, settings.verseCount]
    );
    return { settings, verses };
  };

  handlers['file:importData'] = (data: { settings: any; verses: any[] }) => {
    saveSetting('book', data.settings.book);
    saveSetting('chapter', data.settings.chapter);
    saveSetting('start_verse', String(data.settings.startVerse));
    saveSetting('verse_count', String(data.settings.verseCount));

    for (const v of data.verses) {
      const existing = queryOne('SELECT id FROM verses WHERE book = ? AND chapter = ? AND verse_number = ?',
        [data.settings.book, parseInt(data.settings.chapter), v.verse_number]);
      if (existing) {
        run('UPDATE verses SET content = ?, blank_template = ? WHERE id = ?', [v.content, v.blank_template || '', existing.id]);
      } else {
        run('INSERT INTO verses (book, chapter, verse_number, content, blank_template) VALUES (?, ?, ?, ?, ?)',
          [data.settings.book, parseInt(data.settings.chapter), v.verse_number, v.content, v.blank_template || '']);
      }
    }
    return true;
  };

  handlers['file:getCharacterExportData'] = (characterId: number) => {
    const character = queryOne('SELECT name, character_type, level, exp, max_exp, description, recite_mode FROM characters WHERE id = ?', [characterId]);
    if (!character) return null;

    const items = queryAll(`
      SELECT i.name, i.description, i.type, i.stat_type, i.stat_bonus, i.rarity, i.level_req, ci.is_equipped, ci.enhance_level
      FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.character_id = ?
    `, [characterId]);

    return { character, items };
  };

  handlers['file:importCharacterData'] = (data: { character: any; items: any[] }) => {
    const c = data.character;
    run('INSERT INTO characters (name, character_type, level, exp, max_exp, description, recite_mode) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [c.name, c.character_type, c.level, c.exp, c.max_exp, c.description, c.recite_mode]);
    const newChar = queryOne('SELECT id FROM characters ORDER BY id DESC LIMIT 1');
    if (!newChar) return { success: false };

    for (const item of data.items) {
      run('INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [item.name, item.description, item.type, item.stat_type, item.stat_bonus, item.rarity, item.level_req]);
      const newItem = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
      run('INSERT INTO character_items (character_id, item_id, is_equipped, enhance_level) VALUES (?, ?, ?, ?)',
        [newChar.id, newItem.id, item.is_equipped, item.enhance_level || 0]);
    }

    return { success: true, characterId: newChar.id };
  };

  return handlers;
}
