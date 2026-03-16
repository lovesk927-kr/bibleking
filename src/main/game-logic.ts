// 순수 계산 로직 — DB/Electron 의존성 없이 테스트 가능

// ===== 스탯 계산 =====

export function calcBaseStats(level: number) {
  return {
    baseAttack: 50 + level * 30,
    baseDefense: 30 + level * 20,
    baseHp: 500 + level * 100,
    baseEvasion: 5,
  };
}

export function calcEnhanceBonus(statType: string, enhanceLevel: number): number {
  return statType === 'evasion'
    ? Math.floor(enhanceLevel * 0.5)
    : enhanceLevel * 3;
}

export function calcEquipBonuses(equippedItems: { stat_type: string; stat_bonus: number; enhance_level: number }[]) {
  let bonusAttack = 0;
  let bonusDefense = 0;
  let bonusHp = 0;
  let bonusEvasion = 0;

  for (const item of equippedItems) {
    const enhanceBonus = calcEnhanceBonus(item.stat_type, item.enhance_level);
    const totalBonus = item.stat_bonus + enhanceBonus;
    if (item.stat_type === 'attack') bonusAttack += totalBonus;
    if (item.stat_type === 'defense') bonusDefense += totalBonus;
    if (item.stat_type === 'hp') bonusHp += totalBonus;
    if (item.stat_type === 'evasion') bonusEvasion += totalBonus;
  }

  return { bonusAttack, bonusDefense, bonusHp, bonusEvasion };
}

export function calcTotalStats(level: number, equippedItems: { stat_type: string; stat_bonus: number; enhance_level: number }[]) {
  const base = calcBaseStats(level);
  const bonus = calcEquipBonuses(equippedItems);

  return {
    ...base,
    ...bonus,
    totalAttack: base.baseAttack + bonus.bonusAttack,
    totalDefense: base.baseDefense + bonus.bonusDefense,
    totalHp: base.baseHp + bonus.bonusHp,
    totalEvasion: Math.min(50, base.baseEvasion + bonus.bonusEvasion),
  };
}

// ===== 몬스터 생성 =====

const VILLAGE_LEVEL_REQS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190];

export function calcMonsterLevelRange(characterLevel: number, villageId: number) {
  const villageMinLevel = Math.max(1, (VILLAGE_LEVEL_REQS[villageId - 1] || 1) - 1);
  const villageMaxLevel = (VILLAGE_LEVEL_REQS[villageId - 1] || 1) + 10 + 2;
  const minLv = Math.min(Math.max(villageMinLevel, characterLevel - 5), villageMaxLevel);
  const maxLv = Math.min(characterLevel + 5, villageMaxLevel);
  return { minLv, maxLv };
}

export function calcMonsterStats(level: number) {
  const hp = 400 + level * 150;
  const attack = 50 + level * 30;
  const defense = 20 + level * 20;
  const exp_reward = 10 + level * 8;
  const power = attack + defense + Math.floor(hp / 10);
  return { hp, attack, defense, exp_reward, power };
}

// ===== 전투 승률 =====

export function calcWinRate(playerPower: number, monsterPower: number, scorePercent: number) {
  const powerRatio = playerPower / Math.max(1, monsterPower);
  let baseWinRate = Math.round(50 + (powerRatio - 1) * 50);
  baseWinRate = Math.min(95, Math.max(5, baseWinRate));

  const scoreBonus = Math.round(scorePercent * 0.2);
  const finalWinRate = Math.min(99, Math.max(1, baseWinRate + scoreBonus));

  return { baseWinRate, scoreBonus, finalWinRate };
}

// ===== 레벨업 계산 =====

export function calcLevelUp(currentLevel: number, currentExp: number, currentMaxExp: number, earnedExp: number) {
  let newExp = currentExp + earnedExp;
  let newLevel = currentLevel;
  let maxExp = currentMaxExp;
  let leveledUp = false;
  let levelUps = 0;

  while (newExp >= maxExp) {
    newExp -= maxExp;
    newLevel++;
    maxExp = newLevel * 100;
    leveledUp = true;
    levelUps++;
  }

  return { newExp, newLevel, maxExp, leveledUp, levelUps };
}

// ===== 암송 채점 =====

export function normalizeAnswer(s: string): string {
  return s.replace(/[\s,.!?;:'"''""·\u3000]/g, '');
}

export function calcReciteExp(score: number, reciteMode: number): number {
  let earnedExp = score * 10;
  if (reciteMode === 0 && earnedExp > 0) {
    earnedExp = Math.round(earnedExp * 1.2);
  }
  return earnedExp;
}

// ===== 아이템 능력치 =====

export function calcItemStatBonus(statType: string, level: number, rarityIndex: number): number {
  const rarityMultiplier = [1.0, 1.5, 2.0, 3.0, 5.0][rarityIndex];
  return statType === 'evasion'
    ? Math.floor((1 + Math.floor(level / 15)) * rarityMultiplier)
    : Math.floor((10 + level * 5) * rarityMultiplier);
}

export function getItemStatType(itemType: string): string {
  if (itemType === 'weapon') return 'attack';
  if (itemType === 'shield') return 'defense';
  if (itemType === 'shoes') return 'evasion';
  if (itemType === 'belt') return 'hp';
  return ['attack', 'defense', 'hp'][Math.floor(Math.random() * 3)];
}

// ===== 강화 확률 =====

export function calcEnhanceSuccessRate(nextLevel: number): number {
  if (nextLevel <= 5) return 100;
  const rates: Record<number, number> = { 6: 80, 7: 60, 8: 40, 9: 20, 10: 10 };
  return rates[nextLevel] ?? 5;
}

// ===== 합성 능력치 =====

export function calcSynthStatBonus(statType: string, maxLevel: number, newRarityIndex: number): number {
  const newRarityMultiplier = [1.0, 1.5, 2.0, 3.0, 5.0][newRarityIndex];
  return statType === 'evasion'
    ? Math.floor((1 + Math.floor(maxLevel / 15)) * newRarityMultiplier)
    : Math.floor((10 + maxLevel * 5) * newRarityMultiplier);
}

// ===== 보스 전투 =====

export function calcBossStats(playerAttack: number, playerHp: number) {
  const bossMaxHp = Math.max(100, playerAttack * 10);
  const bossAttack = Math.max(10, Math.floor(playerHp / 4));
  return { bossMaxHp, bossAttack };
}

export function calcBossDamage(correct: boolean, playerAttack: number, bossAttack: number, playerDefense: number, playerEvasion: number) {
  if (correct) {
    return { damage: playerAttack, targetIsBoss: true, dodged: false };
  }
  const evasionRate = Math.min(30, playerEvasion);
  const dodged = Math.random() * 100 < evasionRate;
  if (dodged) {
    return { damage: 0, targetIsBoss: false, dodged: true };
  }
  const rawDamage = bossAttack - playerDefense;
  const damage = Math.max(1, rawDamage);
  return { damage, targetIsBoss: false, dodged: false };
}
