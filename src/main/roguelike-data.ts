/**
 * 로그라이크 게임모드 - 상수 및 설정 데이터
 */
import { VILLAGE_LEVEL_REQS } from './game-data';

// ===== 설정 변수 (추후 조정 가능) =====
export const ROGUELIKE_CONFIG = {
  BUFF_INTERVAL: 3,         // N방마다 버프 선택
  SHOP_INTERVAL: 5,         // N방마다 상점
  ELITE_INTERVAL: 10,       // N방마다 엘리트
  EVENT_CHANCE: 0.15,       // 랜덤 이벤트 확률 (15%)
  GOLD_PER_KILL: 2,         // 몬스터당 금화
  ITEM_DROP_RATE: 0.40,     // 아이템 드랍률 40%
  ITEM_EQUIP_RATE: 0.60,    // 드랍 중 장비 비율 60%
  COMBO_MAX_MULTIPLIER: 2.0,  // 콤보 최대 배율
  COMBO_PER_STACK: 0.02,    // 콤보 1당 배율 증가
  COMBO_CAP: 50,            // 콤보 캡 (50콤보 = 2.0배)
  VERSE_BASE_ROOMS: 5,      // 처음 N방은 1절만
  VERSE_GROWTH_INTERVAL: 3, // 이후 N방마다 +1절
  DIFFICULTY_INTERVAL: 3,   // N마리마다 난이도 상승
  VILLAGE_ROOMS: 10,        // 마을당 방 수 (몬스터 풀 순환)
  TOTAL_VILLAGES: 20,
};

// ===== 마을 레벨 범위 =====
export function getVillageLevelRange(villageId: number): { min: number; max: number } {
  const min = VILLAGE_LEVEL_REQS[villageId - 1] || 1;
  const max = (VILLAGE_LEVEL_REQS[villageId] || min + 10) - 1;
  return { min, max };
}

// ===== 보스 출현 조건 (마을 내 처치 수 기준) =====
export function getBossThreshold(playerLevel: number, villageId: number): number {
  const { max } = getVillageLevelRange(villageId);
  if (playerLevel >= max + 2) return 0; // 즉시 보스
  if (playerLevel >= max) return 3;     // 3마리 후 보스
  return 10;                            // 10마리 후 보스
}

// ===== 몬스터 레벨 결정 (마을 범위 내 점진적 상승) =====
export function calcNextMonsterLevel(villageKillCount: number, villageId: number): number {
  const { min, max } = getVillageLevelRange(villageId);
  const range = max - min;
  // 처치 수에 따라 마을 레벨 범위 내에서 점진 상승
  const progress = Math.min(villageKillCount / 10, 1);
  const baseLevel = min + Math.floor(range * progress);
  // ±10% 랜덤 변동
  const variance = Math.max(1, Math.floor(baseLevel * 0.1));
  const level = baseLevel + Math.floor(Math.random() * (variance * 2 + 1)) - variance;
  return Math.max(min, Math.min(max, level));
}

// ===== 블랭크 수 =====
export function calcBlankCount(monsterLevel: number, playerLevel: number): number {
  const diff = monsterLevel - playerLevel;
  if (diff <= -1) return 1;
  if (diff === 0) return 2;
  if (diff === 1) return 3;
  if (diff === 2) return 4;
  return 5; // diff >= 3
}

// ===== 제한 시간 =====
export function calcTimeLimit(blankCount: number, reciteMode: number, levelDiff: number): number {
  // 레벨 차이 5 이상: 2초/블랭크 (극한)
  if (levelDiff >= 5) return blankCount * 2;
  // 주관식: 5초/블랭크
  if (reciteMode === 0) return blankCount * 5;
  // 빈칸채우기: 무제한 (0 = 무제한)
  return 0;
}

// ===== 구절 범위 (몬스터 레벨 기준) =====
export function calcVerseCount(monsterLevel: number): number {
  // Lv1~5: 1~3절, Lv6~10: 1~5절, Lv11~15: 1~8절, 5레벨당 +3절
  const tier = Math.floor((monsterLevel - 1) / 5);
  return Math.min(3 + tier * 3, 30); // 최대 30절 캡
}

// ===== 몬스터 풀: 방 깊이 → 마을 ID =====
export function calcVillageIdForRoom(room: number): number {
  const { VILLAGE_ROOMS, TOTAL_VILLAGES } = ROGUELIKE_CONFIG;
  const villageIndex = Math.floor((room - 1) / VILLAGE_ROOMS) % TOTAL_VILLAGES;
  return villageIndex + 1;
}

// ===== 게임모드 전용 몬스터 스탯 (3~5턴 킬 밸런스) =====
export function calcRoguelikeMonsterStats(level: number) {
  const hp = 80 + level * 25;
  // 동급 캐릭터 HP(500+lv*100) 기준 4~6대에 죽도록 공격력 설정
  // 목표 데미지 ≈ (500+lv*100)/5 → 공격력은 데미지의 ~1.3배 (방어 감산 고려)
  const attack = Math.floor((500 + level * 100) / 5 * 1.3);
  const defense = 10 + level * 8;
  const exp_reward = Math.max(1, 5 + level * 4);
  return { hp, attack, defense, exp_reward };
}

// ===== 엘리트 스탯 =====
export function calcEliteStats(baseStats: { hp: number; attack: number; defense: number; exp_reward: number }) {
  return {
    hp: Math.floor(baseStats.hp * 1.5),
    attack: Math.floor(baseStats.attack * 1.3),
    defense: baseStats.defense,
    exp_reward: Math.floor(baseStats.exp_reward * 2),
  };
}

// ===== EXP 감소율 =====
export function calcExpReduction(monsterLevel: number, playerLevel: number): number {
  const diff = playerLevel - monsterLevel;
  if (diff >= 5) return 0;      // EXP 0
  if (diff >= 3) return 0.5;    // 50%
  return 1;                      // 100%
}

// ===== 콤보 배율 =====
export function calcComboMultiplier(combo: number): number {
  const { COMBO_PER_STACK, COMBO_MAX_MULTIPLIER } = ROGUELIKE_CONFIG;
  return Math.min(COMBO_MAX_MULTIPLIER, 1 + combo * COMBO_PER_STACK);
}

// ===== 데미지 계산 =====
export function calcPlayerDamage(attack: number, monsterDefense: number, combo: number): number {
  // 플레이어 공격력 50%만 적용
  const effectiveAtk = Math.floor(attack * 0.5);
  const baseDmg = Math.max(1, effectiveAtk - monsterDefense);
  const minDmg = Math.max(1, Math.floor(baseDmg * 0.8));
  const maxDmg = Math.floor(baseDmg * 1.2);
  const rawDmg = minDmg + Math.floor(Math.random() * (maxDmg - minDmg + 1));
  const comboMult = calcComboMultiplier(combo);
  return Math.max(1, Math.floor(rawDmg * comboMult));
}

export function calcMonsterDamage(monsterAttack: number, playerDefense: number): number {
  // 공격력의 50%는 방어 무시 (고정 데미지)
  const trueDmg = Math.floor(monsterAttack * 0.5);
  // 나머지 50%는 방어력 감산
  const reducedDmg = Math.max(0, Math.floor(monsterAttack * 0.5) - playerDefense);
  const finalBase = trueDmg + reducedDmg;
  const minDmg = Math.max(1, Math.floor(finalBase * 0.8));
  const maxDmg = Math.floor(finalBase * 1.2);
  return minDmg + Math.floor(Math.random() * (maxDmg - minDmg + 1));
}

// ===== 별 획득 =====
export function calcStarsEarned(monstersKilled: number, elitesKilled: number): number {
  // 5마리마다 1별 + 엘리트당 2별
  return Math.floor(monstersKilled / 5) + elitesKilled * 2;
}

// ===== 다음 이벤트 타입 결정 (처치 수 기반) =====
export function getNextEventType(monstersKilled: number): 'elite' | 'shop' | 'event' | 'normal' {
  const { ELITE_INTERVAL, SHOP_INTERVAL, EVENT_CHANCE } = ROGUELIKE_CONFIG;
  if (monstersKilled > 0 && monstersKilled % ELITE_INTERVAL === 0) return 'elite';
  if (monstersKilled > 0 && monstersKilled % SHOP_INTERVAL === 0) return 'shop';
  if (Math.random() < EVENT_CHANCE) return 'event';
  return 'normal';
}

// 상점 여부
export function isShopTrigger(monstersKilled: number): boolean {
  return monstersKilled > 0 && monstersKilled % ROGUELIKE_CONFIG.SHOP_INTERVAL === 0;
}

// 버프 선택 여부
export function isBuffTrigger(monstersKilled: number): boolean {
  return monstersKilled > 0 && monstersKilled % ROGUELIKE_CONFIG.BUFF_INTERVAL === 0;
}

// ===== 버프 풀 =====
export interface BuffDef {
  id: string;
  name: string;
  description: string;
  effect: { type: string; value: number };
}

export const BUFF_POOL: BuffDef[] = [
  { id: 'atk_up', name: '축복의 검', description: '공격력 +10%', effect: { type: 'attackPercent', value: 10 } },
  { id: 'def_up', name: '축복의 방패', description: '방어력 +10%', effect: { type: 'defensePercent', value: 10 } },
  { id: 'maxhp_up', name: '생명의 은총', description: '최대 HP +15%', effect: { type: 'maxHpPercent', value: 15 } },
  { id: 'time_up', name: '시간의 여유', description: '제한시간 +3초', effect: { type: 'timeBonus', value: 3 } },
  { id: 'heal', name: '치유의 손길', description: 'HP 20% 즉시 회복', effect: { type: 'healPercent', value: 20 } },
  { id: 'crit_up', name: '전사의 눈', description: '크리티컬 확률 +10%', effect: { type: 'critPercent', value: 10 } },
  { id: 'gold_up', name: '상인의 축복', description: '금화 드랍 +1', effect: { type: 'goldBonus', value: 1 } },
  { id: 'combo_up', name: '연속 기도', description: '콤보 데미지 배율 +5%', effect: { type: 'comboBonus', value: 5 } },
];

// ===== 상점 아이템 =====
export interface ShopItemDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'heal' | 'attack_buff' | 'defense_buff' | 'maxhp_buff';
  value: number;
}

export const SHOP_ITEMS: ShopItemDef[] = [
  { id: 'shop_heal', name: 'HP 회복', description: '최대 HP의 30% 회복', cost: 3, type: 'heal', value: 30 },
  { id: 'shop_atk', name: '공격력 강화', description: '공격력 +15% (이번 스테이지만 적용)', cost: 5, type: 'attack_buff', value: 15 },
  { id: 'shop_def', name: '방어력 강화', description: '방어력 +15% (이번 스테이지만 적용)', cost: 5, type: 'defense_buff', value: 15 },
  { id: 'shop_maxhp', name: 'HP 최대치 증가', description: '최대 HP +20% (이번 스테이지만 적용)', cost: 7, type: 'maxhp_buff', value: 20 },
];

// ===== 영구 업그레이드 =====
export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  costs: number[];
  effectPerLevel: number;
  effectType: string;
}

export const UPGRADE_DEFS: UpgradeDef[] = [
  { id: 'perm_hp', name: '기본 HP 강화', description: '시작 HP +5%', maxLevel: 5, costs: [10, 25, 50, 80, 120], effectPerLevel: 5, effectType: 'hpPercent' },
  { id: 'perm_atk', name: '기본 공격력 강화', description: '시작 공격력 +5%', maxLevel: 5, costs: [10, 25, 50, 80, 120], effectPerLevel: 5, effectType: 'attackPercent' },
  { id: 'perm_gold', name: '금화 수집가', description: '금화 드랍 +1', maxLevel: 3, costs: [15, 40, 75], effectPerLevel: 1, effectType: 'goldBonus' },
  { id: 'perm_discount', name: '상인의 친구', description: '상점 가격 -10%', maxLevel: 3, costs: [15, 40, 75], effectPerLevel: 10, effectType: 'shopDiscount' },
  { id: 'perm_buff', name: '축복의 기운', description: '버프 선택지 +1', maxLevel: 3, costs: [20, 50, 90], effectPerLevel: 1, effectType: 'buffChoices' },
  { id: 'perm_revive', name: '부활의 기도', description: '런 당 1회 부활 (HP 30% 회복)', maxLevel: 1, costs: [100], effectPerLevel: 1, effectType: 'revive' },
];

// ===== 업적 =====
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  condition: { type: string; value: number };
  reward: number; // 별
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'village_2', name: '첫 발걸음', description: '2번째 마을 도달', condition: { type: 'best_village', value: 2 }, reward: 5 },
  { id: 'village_5', name: '탐험가', description: '5번째 마을 도달', condition: { type: 'best_village', value: 5 }, reward: 15 },
  { id: 'village_10', name: '용사', description: '10번째 마을 도달', condition: { type: 'best_village', value: 10 }, reward: 30 },
  { id: 'combo_10', name: '콤보 마스터', description: '10콤보 달성', condition: { type: 'best_combo', value: 10 }, reward: 10 },
  { id: 'combo_20', name: '콤보 전설', description: '20콤보 달성', condition: { type: 'best_combo', value: 20 }, reward: 20 },
  { id: 'kills_100', name: '사냥꾼', description: '누적 몬스터 100마리 처치', condition: { type: 'total_kills', value: 100 }, reward: 15 },
  { id: 'no_hit_5', name: '무패', description: '한 런에서 피격 0회로 몬스터 5마리 처치', condition: { type: 'no_hit_kills', value: 5 }, reward: 25 },
  { id: 'gold_30', name: '부자', description: '한 런에서 금화 30개 보유', condition: { type: 'max_gold', value: 30 }, reward: 10 },
];

// ===== 해금 시작 버프 =====
export interface StartBuffDef {
  id: string;
  name: string;
  description: string;
  unlockCondition: { type: string; value: number };
  effect: { type: string; value: number };
}

export const START_BUFF_DEFS: StartBuffDef[] = [
  { id: 'start_atk', name: '전사의 축복', description: '공격력 +10%', unlockCondition: { type: 'best_village', value: 3 }, effect: { type: 'attackPercent', value: 10 } },
  { id: 'start_def', name: '수호자의 축복', description: '방어력 +15%', unlockCondition: { type: 'best_village', value: 5 }, effect: { type: 'defensePercent', value: 15 } },
  { id: 'start_hp', name: '생명의 축복', description: 'HP +20%', unlockCondition: { type: 'best_village', value: 10 }, effect: { type: 'maxHpPercent', value: 20 } },
];

// 시작 버프 슬롯: 업적 5개 달성 시 2슬롯
export const START_BUFF_SLOT_UNLOCK = { type: 'achievement_count', value: 5, slots: 2 };

// ===== 랜덤 이벤트 =====
export interface EventDef {
  id: string;
  name: string;
  description: string;
  choices: { label: string; cost?: { type: string; value: number } }[];
  outcomes: { successRate: number; success: { type: string; value: number; message: string }; fail?: { type: string; value: number; message: string } }[];
}

export const EVENT_DEFS: EventDef[] = [
  {
    id: 'treasure',
    name: '보물상자',
    description: '낡은 보물상자를 발견했다! 무엇이 들어있을까?',
    choices: [{ label: '열기' }, { label: '무시' }],
    outcomes: [
      { successRate: 0.7, success: { type: 'item', value: 1, message: '아이템을 발견했다!' }, fail: { type: 'damage', value: 15, message: '함정이었다! HP -15%' } },
      { successRate: 1, success: { type: 'none', value: 0, message: '조심스럽게 지나쳤다.' } },
    ],
  },
  {
    id: 'pilgrim',
    name: '상처입은 순례자',
    description: '길가에 상처입은 순례자가 쓰러져 있다.',
    choices: [{ label: '돕기', cost: { type: 'gold', value: 3 } }, { label: '지나침' }],
    outcomes: [
      { successRate: 1, success: { type: 'buff', value: 1, message: '순례자가 감사하며 축복을 내렸다!' } },
      { successRate: 1, success: { type: 'none', value: 0, message: '발걸음을 재촉했다.' } },
    ],
  },
  {
    id: 'spring',
    name: '기도의 샘',
    description: '은은한 빛이 나는 샘물을 발견했다.',
    choices: [{ label: '기도하기' }, { label: '지나침' }],
    outcomes: [
      { successRate: 1, success: { type: 'heal_debuff', value: 50, message: 'HP 50% 회복! 하지만 공격력이 5% 감소했다.' } },
      { successRate: 1, success: { type: 'none', value: 0, message: '아쉽지만 지나쳤다.' } },
    ],
  },
  {
    id: 'merchant',
    name: '수상한 상인',
    description: '어둠 속에서 수상한 상인이 나타났다.',
    choices: [{ label: '거래 (-HP 20%)', cost: { type: 'hp', value: 20 } }, { label: '거절' }],
    outcomes: [
      { successRate: 1, success: { type: 'strong_buff', value: 1, message: '강력한 축복을 얻었다!' } },
      { successRate: 1, success: { type: 'none', value: 0, message: '상인은 사라졌다.' } },
    ],
  },
  {
    id: 'tablet',
    name: '고대 석판',
    description: '기이한 문자가 새겨진 석판을 발견했다.',
    choices: [{ label: '해독 도전' }, { label: '지나침' }],
    outcomes: [
      { successRate: 0.5, success: { type: 'stars', value: 5, message: '석판을 해독했다! 별 보너스!' }, fail: { type: 'none', value: 0, message: '해독에 실패했다...' } },
      { successRate: 1, success: { type: 'none', value: 0, message: '모르는 문자는 건드리지 않는게 좋다.' } },
    ],
  },
];
