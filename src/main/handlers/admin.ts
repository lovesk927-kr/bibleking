import { queryAll, queryOne, run, getDb, saveDb, getSetting, saveSetting } from '../db';
import { HandlerMap } from './types';

export function createAdminHandlers(): HandlerMap {
  const handlers: HandlerMap = {};

  handlers['admin:login'] = (password: string) => {
    return password === '1234';
  };

  handlers['admin:getVerses'] = () => {
    return queryAll('SELECT * FROM verses ORDER BY verse_number');
  };

  handlers['admin:saveVerses'] = (data: { book: string; chapter: string; verses: { verse_number: number; content: string }[] }) => {
    for (const v of data.verses) {
      const existing = queryOne('SELECT id FROM verses WHERE book = ? AND chapter = ? AND verse_number = ?', [data.book, parseInt(data.chapter), v.verse_number]);
      if (existing) {
        run('UPDATE verses SET content = ? WHERE id = ?', [v.content, existing.id]);
      } else {
        run('INSERT INTO verses (book, chapter, verse_number, content) VALUES (?, ?, ?, ?)', [data.book, parseInt(data.chapter), v.verse_number, v.content]);
      }
    }
    return true;
  };

  handlers['admin:getSettings'] = () => {
    return {
      book: getSetting('book', '시편'),
      chapter: getSetting('chapter', '119'),
      startVerse: parseInt(getSetting('start_verse', '1')),
      verseCount: parseInt(getSetting('verse_count', '10')),
    };
  };

  handlers['admin:saveSettings'] = (settings: { book: string; chapter: string; startVerse: number; verseCount: number }) => {
    saveSetting('book', settings.book);
    saveSetting('chapter', settings.chapter);
    saveSetting('start_verse', String(settings.startVerse));
    saveSetting('verse_count', String(settings.verseCount));
    return true;
  };

  handlers['admin:getBlankTemplates'] = () => {
    return queryAll('SELECT verse_number, blank_template FROM verses ORDER BY verse_number');
  };

  handlers['admin:saveBlankTemplates'] = (templates: { verse_number: number; blank_template: string }[]) => {
    for (const t of templates) {
      run('UPDATE verses SET blank_template = ? WHERE verse_number = ?', [t.blank_template, t.verse_number]);
    }
    return true;
  };

  handlers['admin:clearDb'] = () => {
    const db = getDb();
    db.run('DELETE FROM character_items');
    db.run('DELETE FROM items');
    db.run('DELETE FROM consumables');
    db.run('DELETE FROM characters');
    db.run('DELETE FROM verses');
    db.run('DELETE FROM game_settings');
    db.run('DELETE FROM pvp_records');
    saveDb();
    return true;
  };

  return handlers;
}
