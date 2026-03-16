import { queryAll, queryOne, run, getSetting } from '../db';
import { normalizeAnswer, calcReciteExp, calcLevelUp } from '../game-logic';
import { generateRandomItem, addItemToCharacter } from '../item-service';
import { HandlerMap } from './types';

export function createReciteHandlers(): HandlerMap {
  const handlers: HandlerMap = {};

  handlers['recite:getQuiz'] = () => {
    const book = getSetting('book', '시편');
    const chapter = parseInt(getSetting('chapter', '119'));
    const startVerse = parseInt(getSetting('start_verse', '1'));
    const count = parseInt(getSetting('verse_count', '10'));

    return queryAll(
      'SELECT * FROM verses WHERE book = ? AND chapter = ? AND verse_number >= ? ORDER BY verse_number LIMIT ?',
      [book, chapter, startVerse, count]
    );
  };

  handlers['recite:getQuizRange'] = (data: { startVerse: number; endVerse: number }) => {
    const book = getSetting('book', '시편');
    const chapter = parseInt(getSetting('chapter', '119'));

    return queryAll(
      'SELECT * FROM verses WHERE book = ? AND chapter = ? AND verse_number >= ? AND verse_number <= ? ORDER BY verse_number',
      [book, chapter, data.startVerse, data.endVerse]
    );
  };

  handlers['recite:getVerseNumbers'] = () => {
    const book = getSetting('book', '시편');
    const chapter = parseInt(getSetting('chapter', '119'));

    return queryAll(
      'SELECT verse_number FROM verses WHERE book = ? AND chapter = ? ORDER BY verse_number',
      [book, chapter]
    ).map((r: any) => r.verse_number);
  };

  handlers['recite:submit'] = (data: { characterId: number; answers: { verse_number: number; answer: string }[] }) => {
    const results: { verse_number: number; correct: boolean; correctAnswer: string; userAnswer: string }[] = [];
    let score = 0;

    for (const a of data.answers) {
      const verse = queryOne('SELECT content FROM verses WHERE verse_number = ?', [a.verse_number]);
      if (!verse) continue;

      const correct = normalizeAnswer(verse.content) === normalizeAnswer(a.answer);
      if (correct) score++;

      results.push({ verse_number: a.verse_number, correct, correctAnswer: verse.content, userAnswer: a.answer });
    }

    const totalQuestions = data.answers.length;
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [data.characterId]);
    const earnedExp = calcReciteExp(score, character?.recite_mode ?? 1);

    if (character) {
      const levelResult = calcLevelUp(character.level, character.exp, character.max_exp, earnedExp);
      const rewards = levelResult.levelUps > 0
        ? (() => {
            const r: any[] = [];
            for (let i = 0; i < levelResult.levelUps; i++) {
              const itemLevel = levelResult.newLevel - levelResult.levelUps + i + 1;
              const item = generateRandomItem(itemLevel);
              r.push(addItemToCharacter(data.characterId, item));
            }
            return r;
          })()
        : [];

      run('UPDATE characters SET exp = ?, level = ?, max_exp = ? WHERE id = ?',
        [levelResult.newExp, levelResult.newLevel, levelResult.maxExp, data.characterId]);

      return {
        results, score, totalQuestions, earnedExp,
        leveledUp: levelResult.leveledUp, newLevel: levelResult.newLevel,
        newExp: levelResult.newExp, maxExp: levelResult.maxExp, rewards,
      };
    }

    return { results, score, totalQuestions, earnedExp, leveledUp: false, rewards: [] };
  };

  return handlers;
}
