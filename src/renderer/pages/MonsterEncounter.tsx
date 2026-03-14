import React, { useEffect, useState } from 'react';
import type { Character, CharacterStats, Monster } from '../types';
import { VILLAGES } from '../constants';
import { useApi } from '../api-context';

// 마을별 배경 테마
const VILLAGE_THEMES: Record<number, { bg: string; particle?: string }> = {
  1:  { bg: 'linear-gradient(180deg, #1a4a1a 0%, #0d2b0d 40%, #1a1a2e 100%)', particle: '🌿' },       // 에덴 - 초록 숲
  2:  { bg: 'linear-gradient(180deg, #4a1a3a 0%, #2d1a2d 40%, #1a1a2e 100%)', particle: '🌸' },       // 기쁨의 동산 - 분홍 꽃
  3:  { bg: 'linear-gradient(180deg, #0d1f0d 0%, #0a150a 40%, #0d0d1a 100%)', particle: '🍃' },       // 속삭임의 숲 - 어두운 숲
  4:  { bg: 'linear-gradient(180deg, #2a2a3a 0%, #1a1a2a 40%, #0d0d1a 100%)', particle: '🌫️' },      // 실락원 - 안개
  5:  { bg: 'linear-gradient(180deg, #4a3a1a 0%, #3a2a0d 40%, #1a1a0d 100%)', particle: '🏜️' },      // 가시의 땅 - 사막
  6:  { bg: 'linear-gradient(180deg, #3a3a2a 0%, #2a2a1a 40%, #1a1a1a 100%)', particle: '🏛️' },      // 바벨의 파편 - 유적
  7:  { bg: 'linear-gradient(180deg, #4a1a0a 0%, #3a0d0d 40%, #1a0d0d 100%)', particle: '🔥' },       // 소돔의 잿더미 - 화염
  8:  { bg: 'linear-gradient(180deg, #0a1a3a 0%, #0d1a4a 40%, #0a0d2a 100%)', particle: '💧' },       // 노아의 심연 - 심해
  9:  { bg: 'linear-gradient(180deg, #4a4a1a 0%, #3a3a0d 40%, #2a2a0d 100%)', particle: '☀️' },       // 시험의 광야 - 뜨거운 사막
  10: { bg: 'linear-gradient(180deg, #1a2a1a 0%, #0d1a0d 40%, #1a0d2a 100%)', particle: '☠️' },       // 마라의 쓴 샘 - 독
  11: { bg: 'linear-gradient(180deg, #4a2a0a 0%, #3a1a0a 40%, #2a0d0d 100%)', particle: '⚡' },       // 시내산의 불꽃 - 번개 산
  12: { bg: 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 40%, #1a1a1a 100%)', particle: '🏰' },       // 여리고의 성벽 - 성벽
  13: { bg: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a0d 40%, #050510 100%)', particle: '🕳️' },       // 골짜기의 침묵 - 칠흑
  14: { bg: 'linear-gradient(180deg, #0d0d2a 0%, #0a0a1a 40%, #0d1a2a 100%)', particle: '🌙' },       // 게세마네의 밤 - 달밤
  15: { bg: 'linear-gradient(180deg, #3a0d0d 0%, #2a0a0a 40%, #1a0d0d 100%)', particle: '💀' },       // 대환난의 날 - 핏빛
  16: { bg: 'linear-gradient(180deg, #4a2a0a 0%, #3a2a1a 40%, #2a1a0a 100%)', particle: '⚒️' },       // 정화의 용광로 - 용광로
  17: { bg: 'linear-gradient(180deg, #2a3a4a 0%, #1a2a3a 40%, #3a4a5a 100%)', particle: '☁️' },       // 휴거의 대기소 - 하늘
  18: { bg: 'linear-gradient(180deg, #3a3a1a 0%, #4a4a2a 40%, #2a2a0d 100%)', particle: '👑' },       // 천년의 왕국 - 황금
  19: { bg: 'linear-gradient(180deg, #1a3a4a 0%, #0d2a3a 40%, #1a4a4a 100%)', particle: '💎' },       // 생명수의 강 - 수정
  20: { bg: 'linear-gradient(180deg, #3a3a5a 0%, #4a4a6a 40%, #ffffff22 100%)', particle: '✨' },      // 천국 - 신성한 빛
};

interface Props {
  character: Character;
  villageId: number;
  onStartRecite: (monster: Monster) => void;
  onChangeVillage: () => void;
  onBack: () => void;
}

export function MonsterEncounter({ character, villageId, onStartRecite, onChangeVillage, onBack }: Props) {
  const [monster, setMonster] = useState<Monster | null>(null);
  const [stats, setStats] = useState<CharacterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { api } = useApi();

  const village = VILLAGES.find(v => v.id === villageId);

  useEffect(() => {
    loadMonster();
  }, []);

  const loadMonster = async () => {
    setLoading(true);
    const [m, s] = await Promise.all([
      api.getRandomMonster({ characterLevel: character.level, villageId }),
      api.getCharacterStats(character.id),
    ]);
    setMonster(m);
    setStats(s);
    setLoading(false);
  };

  const handleFlee = () => {
    loadMonster();
  };

  if (loading || !monster) return <div className="page"><p>몬스터를 찾는 중...</p></div>;

  // 승률 계산 (서버 로직과 동일)
  const playerPower = stats
    ? stats.totalAttack + stats.totalDefense + Math.floor(stats.totalHp / 10) + stats.totalEvasion
    : 0;
  const monsterPower = monster.attack + monster.defense + Math.floor(monster.hp / 10);
  const powerRatio = playerPower / Math.max(1, monsterPower);
  const baseWinRate = Math.min(95, Math.max(5, Math.round(50 + (powerRatio - 1) * 50)));

  const winRateClass = baseWinRate >= 60 ? 'winrate-high' : baseWinRate >= 40 ? 'winrate-mid' : 'winrate-low';

  const theme = VILLAGE_THEMES[villageId] || VILLAGE_THEMES[1];
  const particles = theme.particle ? Array.from({ length: 8 }, (_, i) => i) : [];

  return (
    <div className="page monster-encounter" style={{ background: theme.bg }}>
      {/* 배경 파티클 */}
      <div className="encounter-particles">
        {particles.map(i => (
          <span key={i} className="encounter-particle" style={{
            left: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
            fontSize: `${0.8 + Math.random() * 1.2}rem`,
            opacity: 0.3 + Math.random() * 0.3,
          }}>{theme.particle}</span>
        ))}
      </div>

      {village && (
        <div className="encounter-village-tag" onClick={onChangeVillage} style={{ cursor: 'pointer' }}>
          {village.emoji} {village.name} <span className="village-change-btn">마을 변경 ▸</span>
        </div>
      )}
      {village && <div className="encounter-village-desc">{village.description}</div>}
      <h1 className="title">몬스터 출현!</h1>

      <div className="monster-card">
        <div className="monster-emoji">{monster.emoji}</div>
        <div className="monster-name">{monster.name}</div>
        <div className={`monster-winrate ${winRateClass}`}>
          승률 {baseWinRate}% + 암송점수
        </div>
        <div className="monster-stats">
          <div className="monster-stat">
            <span className="stat-name">레벨</span>
            <span className="stat-value">Lv.{monster.level}</span>
          </div>
          <div className="monster-stat">
            <span className="stat-name">HP</span>
            <span className="stat-value">{monster.hp}</span>
          </div>
          <div className="monster-stat">
            <span className="stat-name">공격력</span>
            <span className="stat-value">{monster.attack}</span>
          </div>
          <div className="monster-stat">
            <span className="stat-name">방어력</span>
            <span className="stat-value">{monster.defense}</span>
          </div>
          <div className="monster-stat">
            <span className="stat-name">전투력</span>
            <span className="stat-value">{monsterPower}</span>
          </div>
        </div>
        <div className="monster-exp-reward">처치 시 경험치: +{monster.exp_reward}</div>
        <div className="monster-my-power">내 전투력: {playerPower}</div>
      </div>

      <div className="encounter-buttons">
        <button className="btn btn-primary btn-game" onClick={() => onStartRecite(monster)}>
          📖 암송으로 공격하기!
        </button>
        <button className="btn btn-flee btn-game" onClick={handleFlee}>
          🏃 도망가기 (다른 몬스터)
        </button>
        <button className="btn btn-back" onClick={onBack}>
          ← 돌아가기
        </button>
      </div>
    </div>
  );
}
