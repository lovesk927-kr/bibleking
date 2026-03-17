import React, { useState, useEffect } from 'react';
import type { Character } from '../types';
import { CHARACTER_INFO, VILLAGES, getBossForVillage } from '../constants';

interface Props {
  character: Character;
  onRecite: () => void;
  onTraining: () => void;
  onTraining2: () => void;
  onInventory: () => void;
  onDetail: () => void;
  onBack: () => void;
  isNetworkMode?: boolean;
}

export function MainScreen({ character, onRecite, onTraining, onTraining2, onInventory, onDetail, onBack, isNetworkMode }: Props) {
  const expPercent = (character.exp / character.max_exp) * 100;
  const [showContact, setShowContact] = useState(false);
  const [bossReady, setBossReady] = useState<{ name: string; emoji: string } | null>(null);

  useEffect(() => {
    // 보스전 조건 확인
    window.api.getBossClears(character.id).then((clears: number[]) => {
      for (const village of VILLAGES) {
        const boss = getBossForVillage(village.id);
        if (!boss) continue;
        if (clears.includes(village.id)) continue;
        const nextVillage = VILLAGES.find(v => v.id === village.id + 1);
        const reachedNextLevel = nextVillage ? character.level >= nextVillage.levelReq : character.level >= village.levelReq;
        if (reachedNextLevel) {
          setBossReady({ name: boss.name, emoji: boss.emoji });
          return;
        }
        break;
      }
      setBossReady(null);
    });
  }, [character.id, character.level]);

  return (
    <div className="page main-screen">
      <div className="character-profile">
        <div className={`character-avatar-large type-${character.character_type}`}>
          {CHARACTER_INFO[character.character_type].image
            ? <img src={CHARACTER_INFO[character.character_type].image} className="character-avatar-img-large" alt="" />
            : CHARACTER_INFO[character.character_type].emoji}
        </div>
        <h2 className="character-name-large">{character.name}</h2>
        <span className="character-class">{CHARACTER_INFO[character.character_type].name}</span>

        <div className="stat-bar">
          <div className="stat-label">
            <span>Lv.{character.level}</span>
            <span>{character.exp} / {character.max_exp} EXP</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill exp" style={{ width: `${expPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="menu-buttons">
        <button className="btn btn-game btn-detail" onClick={onDetail}>
          👤 캐릭터 상세
        </button>
        <button className="btn btn-game btn-training" onClick={onTraining}>
          📝 트레이닝
        </button>
        <button className="btn btn-game btn-training2" onClick={onTraining2}>
          📖 트레이닝 2
          <span className="btn-new-badge">NEW</span>
        </button>
        <button className={`btn btn-game ${bossReady ? 'btn-boss-ready' : 'btn-recite'}`} onClick={onRecite}>
          {bossReady ? `${bossReady.emoji} 보스 전투! — ${bossReady.name}` : '⚔️ 전투 시작'}
        </button>
        <button className="btn btn-game btn-inventory" onClick={onInventory}>
          🎒 가방
        </button>
        <button className="btn btn-back" onClick={onBack}>
          ← 캐릭터 선택
        </button>
      </div>

      <div className="main-footer">
        <button className="btn-contact" onClick={() => setShowContact(true)}>
          문의하기
        </button>
        <div className="app-version">v{__APP_VERSION__}</div>
      </div>

      {showContact && (
        <div className="contact-overlay" onClick={() => setShowContact(false)}>
          <div className="contact-popup" onClick={e => e.stopPropagation()}>
            <h3 className="contact-title">문의하기</h3>
            <p className="contact-desc">
              버그 제보나 추가되었으면 하는 기능이 있다면<br />
              아래 이메일로 편하게 보내주세요!
            </p>
            <div className="contact-email"
              onClick={() => { navigator.clipboard.writeText('lovesk927@naver.com'); alert('이메일이 복사되었습니다!'); }}
            >
              lovesk927@naver.com
            </div>
            <p className="contact-hint">클릭하면 이메일이 복사됩니다</p>
            <button className="btn btn-secondary" onClick={() => setShowContact(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
