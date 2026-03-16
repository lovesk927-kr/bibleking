import { describe, it, expect } from 'vitest';
import {
  calcBaseStats,
  calcEnhanceBonus,
  calcEquipBonuses,
  calcTotalStats,
  calcMonsterLevelRange,
  calcMonsterStats,
  calcWinRate,
  calcLevelUp,
  normalizeAnswer,
  calcReciteExp,
  calcItemStatBonus,
  getItemStatType,
  calcEnhanceSuccessRate,
  calcSynthStatBonus,
  calcBossStats,
  calcBossDamage,
} from '../main/game-logic';

// ===== 기본 스탯 계산 =====
describe('calcBaseStats', () => {
  it('레벨 1 기본 스탯', () => {
    const stats = calcBaseStats(1);
    expect(stats.baseAttack).toBe(80);    // 50 + 1*30
    expect(stats.baseDefense).toBe(50);   // 30 + 1*20
    expect(stats.baseHp).toBe(600);       // 500 + 1*100
    expect(stats.baseEvasion).toBe(5);
  });

  it('레벨 100 기본 스탯', () => {
    const stats = calcBaseStats(100);
    expect(stats.baseAttack).toBe(3050);  // 50 + 100*30
    expect(stats.baseDefense).toBe(2030); // 30 + 100*20
    expect(stats.baseHp).toBe(10500);     // 500 + 100*100
    expect(stats.baseEvasion).toBe(5);
  });

  it('레벨 0이면 베이스만', () => {
    const stats = calcBaseStats(0);
    expect(stats.baseAttack).toBe(50);
    expect(stats.baseDefense).toBe(30);
    expect(stats.baseHp).toBe(500);
  });
});

// ===== 강화 보너스 =====
describe('calcEnhanceBonus', () => {
  it('일반 스탯은 강화당 +3', () => {
    expect(calcEnhanceBonus('attack', 5)).toBe(15);
    expect(calcEnhanceBonus('defense', 3)).toBe(9);
    expect(calcEnhanceBonus('hp', 10)).toBe(30);
  });

  it('회피는 강화당 +0.5 (floor)', () => {
    expect(calcEnhanceBonus('evasion', 1)).toBe(0);
    expect(calcEnhanceBonus('evasion', 2)).toBe(1);
    expect(calcEnhanceBonus('evasion', 5)).toBe(2);
    expect(calcEnhanceBonus('evasion', 10)).toBe(5);
  });

  it('강화 0이면 보너스 0', () => {
    expect(calcEnhanceBonus('attack', 0)).toBe(0);
    expect(calcEnhanceBonus('evasion', 0)).toBe(0);
  });
});

// ===== 장비 보너스 합산 =====
describe('calcEquipBonuses', () => {
  it('빈 장비면 보너스 0', () => {
    const bonus = calcEquipBonuses([]);
    expect(bonus.bonusAttack).toBe(0);
    expect(bonus.bonusDefense).toBe(0);
    expect(bonus.bonusHp).toBe(0);
    expect(bonus.bonusEvasion).toBe(0);
  });

  it('여러 장비 합산', () => {
    const items = [
      { stat_type: 'attack', stat_bonus: 100, enhance_level: 3 },
      { stat_type: 'defense', stat_bonus: 50, enhance_level: 0 },
      { stat_type: 'attack', stat_bonus: 80, enhance_level: 5 },
    ];
    const bonus = calcEquipBonuses(items);
    expect(bonus.bonusAttack).toBe(100 + 9 + 80 + 15); // 204
    expect(bonus.bonusDefense).toBe(50);
    expect(bonus.bonusHp).toBe(0);
    expect(bonus.bonusEvasion).toBe(0);
  });

  it('회피 장비 강화 보너스', () => {
    const items = [
      { stat_type: 'evasion', stat_bonus: 3, enhance_level: 10 }, // 3 + 5 = 8
    ];
    const bonus = calcEquipBonuses(items);
    expect(bonus.bonusEvasion).toBe(8);
  });
});

// ===== 총합 스탯 =====
describe('calcTotalStats', () => {
  it('장비 없이 기본 스탯만', () => {
    const stats = calcTotalStats(10, []);
    expect(stats.totalAttack).toBe(50 + 10 * 30);
    expect(stats.totalDefense).toBe(30 + 10 * 20);
    expect(stats.totalHp).toBe(500 + 10 * 100);
    expect(stats.totalEvasion).toBe(5);
  });

  it('회피 상한 50%', () => {
    const items = [
      { stat_type: 'evasion', stat_bonus: 50, enhance_level: 10 },
    ];
    const stats = calcTotalStats(1, items);
    expect(stats.totalEvasion).toBe(50); // capped
  });

  it('장비 포함 스탯', () => {
    const items = [
      { stat_type: 'attack', stat_bonus: 100, enhance_level: 0 },
    ];
    const stats = calcTotalStats(1, items);
    expect(stats.totalAttack).toBe(80 + 100); // base 80 + bonus 100
  });
});

// ===== 몬스터 레벨 범위 =====
describe('calcMonsterLevelRange', () => {
  it('마을 1, 캐릭터 레벨 1', () => {
    const range = calcMonsterLevelRange(1, 1);
    // villageMin = max(1, 1-1) = 1, villageMax = 1+12 = 13
    // minLv = min(max(1, 1-5=-4), 13) = min(1, 13) = 1
    // maxLv = min(1+5=6, 13) = 6
    expect(range.minLv).toBe(1);
    expect(range.maxLv).toBe(6);
  });

  it('마을 1, 캐릭터 레벨 20 (마을 맥스 제한)', () => {
    const range = calcMonsterLevelRange(20, 1);
    // villageMin=1, villageMax=13
    // minLv = min(max(1, 15), 13) = min(15, 13) = 13
    // maxLv = min(25, 13) = 13
    expect(range.minLv).toBe(13);
    expect(range.maxLv).toBe(13);
  });

  it('마을 5, 캐릭터 레벨 45', () => {
    const range = calcMonsterLevelRange(45, 5);
    // villageMin = max(1, 40-1)=39, villageMax = 40+12=52
    // minLv = min(max(39, 40), 52) = min(40, 52) = 40
    // maxLv = min(50, 52) = 50
    expect(range.minLv).toBe(40);
    expect(range.maxLv).toBe(50);
  });

  it('마을 20, 캐릭터 레벨 200', () => {
    const range = calcMonsterLevelRange(200, 20);
    // villageMin = max(1, 190-1)=189, villageMax=190+12=202
    // minLv = min(max(189, 195), 202) = min(195, 202) = 195
    // maxLv = min(205, 202) = 202
    expect(range.minLv).toBe(195);
    expect(range.maxLv).toBe(202);
  });
});

// ===== 몬스터 스탯 =====
describe('calcMonsterStats', () => {
  it('레벨 1 몬스터', () => {
    const stats = calcMonsterStats(1);
    expect(stats.hp).toBe(550);       // 400 + 1*150
    expect(stats.attack).toBe(80);    // 50 + 1*30
    expect(stats.defense).toBe(40);   // 20 + 1*20
    expect(stats.exp_reward).toBe(18); // 10 + 1*8
    expect(stats.power).toBe(80 + 40 + 55); // 175
  });

  it('레벨 100 몬스터', () => {
    const stats = calcMonsterStats(100);
    expect(stats.hp).toBe(15400);
    expect(stats.attack).toBe(3050);
    expect(stats.defense).toBe(2020);
    expect(stats.exp_reward).toBe(810);
  });
});

// ===== 전투 승률 =====
describe('calcWinRate', () => {
  it('전투력 동일 + 암송 100%이면 승률 70%', () => {
    const result = calcWinRate(1000, 1000, 100);
    expect(result.baseWinRate).toBe(50);
    expect(result.scoreBonus).toBe(20);
    expect(result.finalWinRate).toBe(70);
  });

  it('전투력 동일 + 암송 0%이면 승률 50%', () => {
    const result = calcWinRate(1000, 1000, 0);
    expect(result.finalWinRate).toBe(50);
  });

  it('전투력 2배 = 기본 승률 95% (상한)', () => {
    const result = calcWinRate(2000, 1000, 0);
    expect(result.baseWinRate).toBe(95);
    expect(result.finalWinRate).toBe(95);
  });

  it('전투력 절반 = 기본 승률 25%', () => {
    const result = calcWinRate(500, 1000, 0);
    expect(result.baseWinRate).toBe(25);
    expect(result.finalWinRate).toBe(25);
  });

  it('최저 승률 5%, 최고 95% (암송 보너스 전)', () => {
    const result = calcWinRate(1, 10000, 0);
    expect(result.baseWinRate).toBe(5);
  });

  it('승률 상한 99%', () => {
    const result = calcWinRate(10000, 1, 100);
    expect(result.finalWinRate).toBe(99);
  });
});

// ===== 레벨업 =====
describe('calcLevelUp', () => {
  it('경험치 부족하면 레벨업 안됨', () => {
    const result = calcLevelUp(1, 50, 100, 30);
    expect(result.newLevel).toBe(1);
    expect(result.newExp).toBe(80);
    expect(result.leveledUp).toBe(false);
  });

  it('경험치 딱 맞으면 레벨업', () => {
    const result = calcLevelUp(1, 90, 100, 10);
    expect(result.newLevel).toBe(2);
    expect(result.newExp).toBe(0);
    expect(result.maxExp).toBe(200); // 2 * 100
    expect(result.leveledUp).toBe(true);
    expect(result.levelUps).toBe(1);
  });

  it('다중 레벨업', () => {
    // 레벨 1, exp 0, maxExp 100, +500
    const result = calcLevelUp(1, 0, 100, 500);
    // 100에서 레벨2 -> 남은 400, maxExp 200
    // 200에서 레벨3 -> 남은 200, maxExp 300
    // 200 < 300이므로 레벨3에서 정지
    expect(result.newLevel).toBe(3);
    expect(result.newExp).toBe(200);
    expect(result.maxExp).toBe(300);
    expect(result.levelUps).toBe(2);
  });

  it('경험치 0 추가', () => {
    const result = calcLevelUp(5, 200, 500, 0);
    expect(result.newLevel).toBe(5);
    expect(result.newExp).toBe(200);
    expect(result.leveledUp).toBe(false);
  });
});

// ===== 암송 채점 =====
describe('normalizeAnswer', () => {
  it('공백, 구두점 제거', () => {
    expect(normalizeAnswer('여호와의 증거들을 지키고')).toBe('여호와의증거들을지키고');
  });

  it('동일 내용 비교', () => {
    const a = normalizeAnswer('행위가 온전하여 여호와의 율법을 따라 행하는 자들은 복이 있음이여');
    const b = normalizeAnswer('행위가 온전하여 여호와의 율법을 따라 행하는 자들은 복이 있음이여');
    expect(a).toBe(b);
  });

  it('구두점 차이 무시', () => {
    const a = normalizeAnswer('감사합니다!');
    const b = normalizeAnswer('감사합니다');
    expect(a).toBe(b);
  });
});

describe('calcReciteExp', () => {
  it('일반 모드(0)는 1.2배 보너스', () => {
    expect(calcReciteExp(5, 0)).toBe(60); // 50 * 1.2
  });

  it('빈칸 모드(1)는 보너스 없음', () => {
    expect(calcReciteExp(5, 1)).toBe(50);
  });

  it('0점이면 보너스 적용 안됨', () => {
    expect(calcReciteExp(0, 0)).toBe(0);
  });
});

// ===== 아이템 능력치 =====
describe('calcItemStatBonus', () => {
  it('레벨 1, 일반 공격력', () => {
    // (10 + 1*5) * 1.0 = 15
    expect(calcItemStatBonus('attack', 1, 0)).toBe(15);
  });

  it('레벨 100, 전설 공격력', () => {
    // (10 + 100*5) * 3.0 = 510 * 3 = 1530
    expect(calcItemStatBonus('attack', 100, 3)).toBe(1530);
  });

  it('레벨 1, 일반 회피', () => {
    // (1 + floor(1/15)) * 1.0 = 1
    expect(calcItemStatBonus('evasion', 1, 0)).toBe(1);
  });

  it('레벨 30, 희귀 회피', () => {
    // (1 + floor(30/15)) * 2.0 = 3 * 2 = 6
    expect(calcItemStatBonus('evasion', 30, 2)).toBe(6);
  });

  it('레벨 150, 신화 체력', () => {
    // (10 + 150*5) * 5.0 = 760 * 5 = 3800
    expect(calcItemStatBonus('hp', 150, 4)).toBe(3800);
  });
});

describe('getItemStatType', () => {
  it('무기는 항상 공격력', () => {
    expect(getItemStatType('weapon')).toBe('attack');
  });
  it('방패는 항상 방어력', () => {
    expect(getItemStatType('shield')).toBe('defense');
  });
  it('신발은 항상 회피', () => {
    expect(getItemStatType('shoes')).toBe('evasion');
  });
  it('허리띠는 항상 체력', () => {
    expect(getItemStatType('belt')).toBe('hp');
  });
  it('기타(갑옷, 투구)는 공/방/체 중 하나', () => {
    const validTypes = ['attack', 'defense', 'hp'];
    for (let i = 0; i < 20; i++) {
      expect(validTypes).toContain(getItemStatType('chest'));
      expect(validTypes).toContain(getItemStatType('helmet'));
    }
  });
});

// ===== 강화 확률 =====
describe('calcEnhanceSuccessRate', () => {
  it('1~5강은 100%', () => {
    for (let i = 1; i <= 5; i++) {
      expect(calcEnhanceSuccessRate(i)).toBe(100);
    }
  });

  it('6강 80%', () => {
    expect(calcEnhanceSuccessRate(6)).toBe(80);
  });

  it('7강 60%', () => {
    expect(calcEnhanceSuccessRate(7)).toBe(60);
  });

  it('10강 10%', () => {
    expect(calcEnhanceSuccessRate(10)).toBe(10);
  });

  it('11강 이상 5%', () => {
    expect(calcEnhanceSuccessRate(11)).toBe(5);
    expect(calcEnhanceSuccessRate(15)).toBe(5);
    expect(calcEnhanceSuccessRate(99)).toBe(5);
  });
});

// ===== 합성 능력치 =====
describe('calcSynthStatBonus', () => {
  it('일반→고급 합성', () => {
    // newRarityIndex = 1 (uncommon), multiplier = 1.5
    // (10 + 10*5) * 1.5 = 60 * 1.5 = 90
    expect(calcSynthStatBonus('attack', 10, 1)).toBe(90);
  });

  it('전설→신화 합성', () => {
    // newRarityIndex = 4, multiplier = 5.0
    // (10 + 50*5) * 5.0 = 260 * 5 = 1300
    expect(calcSynthStatBonus('defense', 50, 4)).toBe(1300);
  });

  it('회피 합성은 별도 공식', () => {
    // (1 + floor(30/15)) * 2.0 = 3 * 2 = 6
    expect(calcSynthStatBonus('evasion', 30, 2)).toBe(6);
  });
});

// ===== 보스 전투 =====
describe('calcBossStats', () => {
  it('보스 HP = 플레이어 공격력 x 10', () => {
    const stats = calcBossStats(500, 3000);
    expect(stats.bossMaxHp).toBe(5000);
    expect(stats.bossAttack).toBe(750); // 3000/4
  });

  it('최소 보스 HP 100', () => {
    const stats = calcBossStats(5, 100);
    expect(stats.bossMaxHp).toBe(100);
  });

  it('최소 보스 공격력 10', () => {
    const stats = calcBossStats(100, 20);
    expect(stats.bossAttack).toBe(10);
  });
});

describe('calcBossDamage', () => {
  it('정답이면 플레이어 공격력만큼 보스에게 데미지', () => {
    const result = calcBossDamage(true, 500, 200, 100, 10);
    expect(result.damage).toBe(500);
    expect(result.targetIsBoss).toBe(true);
    expect(result.dodged).toBe(false);
  });

  it('오답 + 방어력이 보스공격력보다 높으면 데미지 1', () => {
    // dodge가 안되도록 evasion 0으로 설정
    const result = calcBossDamage(false, 500, 100, 200, 0);
    expect(result.damage).toBe(1);
    expect(result.targetIsBoss).toBe(false);
  });
});

// ===== 경계값 테스트 =====
describe('경계값 테스트', () => {
  it('레벨업 경계: 정확히 maxExp', () => {
    const result = calcLevelUp(1, 0, 100, 100);
    expect(result.newLevel).toBe(2);
    expect(result.newExp).toBe(0);
  });

  it('레벨업 경계: maxExp - 1', () => {
    const result = calcLevelUp(1, 0, 100, 99);
    expect(result.newLevel).toBe(1);
    expect(result.newExp).toBe(99);
  });

  it('승률 경계: 전투력 0 방어', () => {
    const result = calcWinRate(0, 1000, 0);
    expect(result.baseWinRate).toBe(5); // min bound
  });

  it('몬스터 레벨 범위: 마을 1 초보자', () => {
    const range = calcMonsterLevelRange(1, 1);
    expect(range.minLv).toBeGreaterThanOrEqual(1);
    expect(range.maxLv).toBeGreaterThanOrEqual(range.minLv);
  });
});
