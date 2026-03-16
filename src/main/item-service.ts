/**
 * 아이템 생성/DB 저장 통합 서비스
 * 4곳에서 중복되던 "아이템 생성 → items INSERT → character_items INSERT" 패턴을 통합
 */
import { queryOne, run, saveDb } from './db';
import { calcItemStatBonus } from './game-logic';

const ITEM_TYPES = ['weapon', 'belt', 'chest', 'shoes', 'shield', 'helmet'];
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'mythic'];
const RARITY_WEIGHTS = [50, 30, 15, 1, 0.1];
const RARITY_KOR: Record<string, string> = { common: '일반', uncommon: '고급', rare: '희귀', epic: '전설', mythic: '신화' };

const TYPE_NAMES: Record<string, string[][]> = {
  weapon: [['나무 검', '철 검'], ['강철 검', '빛나는 검'], ['축복의 검', '심판의 검'], ['믿음의 검', '축복의 지팡이'], ['성령의 검']],
  belt: [['천 허리띠', '가죽 허리띠'], ['철 벨트', '강화 벨트'], ['빛의 허리띠', '축복의 벨트'], ['영광의 허리띠', '은혜의 벨트'], ['진리의 허리띠']],
  chest: [['천 갑옷', '가죽 갑옷'], ['철 갑옷', '강화 갑옷'], ['빛의 갑옷', '축복의 갑옷'], ['성별의 갑옷', '영광의 갑옷'], ['의의 호심경']],
  shoes: [['천 신발', '가죽 신발'], ['철 신발', '강화 신발'], ['빛의 신발', '축복의 신발'], ['영광의 신발', '은혜의 신발'], ['복음의 신']],
  shield: [['나무 방패', '철 방패'], ['강철 방패', '빛의 방패'], ['축복의 방패', '수호의 방패'], ['영광의 방패', '은혜의 방패'], ['믿음의 방패']],
  helmet: [['천 모자', '가죽 투구'], ['철 투구', '강화 투구'], ['빛의 투구', '축복의 투구'], ['영광의 투구', '은혜의 왕관'], ['구원의 투구']],
};

const MYTHIC_NAMES: Record<string, string> = {
  weapon: '성령의 검', belt: '진리의 허리띠', chest: '의의 호심경',
  shoes: '복음의 신', shield: '믿음의 방패', helmet: '구원의 투구',
};

function getStatType(itemType: string): string {
  if (itemType === 'weapon') return 'attack';
  if (itemType === 'shield') return 'defense';
  if (itemType === 'shoes') return 'evasion';
  if (itemType === 'belt') return 'hp';
  return ['attack', 'defense', 'hp'][Math.floor(Math.random() * 3)];
}

function statLabel(statType: string): string {
  return statType === 'attack' ? '공격력' : statType === 'defense' ? '방어력' : statType === 'evasion' ? '회피율' : '체력';
}

export interface GeneratedItem {
  name: string;
  description: string;
  type: string;
  stat_type: string;
  stat_bonus: number;
  rarity: string;
  level_req: number;
}

export function generateRandomItem(level: number): GeneratedItem {
  const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];

  let roll = Math.random() * 100;
  let rarityIndex = 0;
  for (let i = 0; i < RARITY_WEIGHTS.length; i++) {
    roll -= RARITY_WEIGHTS[i];
    if (roll <= 0) { rarityIndex = i; break; }
  }
  const rarity = RARITIES[rarityIndex];
  const names = TYPE_NAMES[type][rarityIndex];
  const name = names[Math.floor(Math.random() * names.length)];
  const statType = getStatType(type);
  const statBonus = calcItemStatBonus(statType, level, rarityIndex);

  return {
    name, type, stat_type: statType, stat_bonus: statBonus, rarity, level_req: level,
    description: `${RARITY_KOR[rarity]} 등급 장비. ${statLabel(statType)} +${statBonus}`,
  };
}

export function generateMythicItem(level: number): GeneratedItem {
  const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
  const name = MYTHIC_NAMES[type];
  const statType = getStatType(type);
  const statBonus = calcItemStatBonus(statType, level, 4); // mythic = index 4

  return {
    name, type, stat_type: statType, stat_bonus: statBonus, rarity: 'mythic', level_req: level,
    description: `신화 등급 장비. ${statLabel(statType)} +${statBonus}`,
  };
}

/** 아이템 생성 → DB 저장 → character_items 연결 (공통 패턴) */
export function addItemToCharacter(characterId: number, item: GeneratedItem, enhanceLevel = 0): any {
  run('INSERT INTO items (name, description, type, stat_type, stat_bonus, rarity, level_req) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [item.name, item.description, item.type, item.stat_type, item.stat_bonus, item.rarity, item.level_req]);
  const newItem = queryOne('SELECT id FROM items ORDER BY id DESC LIMIT 1');
  run('INSERT INTO character_items (character_id, item_id, is_equipped, enhance_level) VALUES (?, ?, 0, ?)',
    [characterId, newItem.id, enhanceLevel]);
  return { ...item, id: newItem.id };
}

/** 레벨업 시 아이템 보상 처리 (레벨업마다 1개) */
export function processLevelUpRewards(characterId: number, levelUps: number, newLevel: number): any[] {
  const rewards: any[] = [];
  for (let i = 0; i < levelUps; i++) {
    const itemLevel = newLevel - levelUps + i + 1;
    const item = generateRandomItem(itemLevel);
    const added = addItemToCharacter(characterId, item);
    rewards.push(added);
  }
  return rewards;
}
