import React, { useState } from 'react';
import type { Item } from '../types';
import { RARITY_COLORS, RARITY_NAMES, ITEM_TYPE_NAMES, ITEM_TYPE_EMOJI } from '../constants';

interface RewardItem extends Item {
  isLevelUp?: boolean;
}

interface Props {
  rewards: RewardItem[];
  onClose: () => void;
  title?: string;
  levelUp?: { from: number; to: number };
}

export function RewardBox({ rewards, onClose, title, levelUp }: Props) {
  const [opened, setOpened] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleOpen = () => {
    setOpened(true);
  };

  const handleNext = () => {
    if (currentIndex < rewards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  if (!opened) {
    return (
      <div className="page reward-box">
        <h1 className="title">{title || '🎁 레벨업 보상!'}</h1>
        {levelUp && (
          <div className="levelup-banner">
            <div className="levelup-congrats">축하합니다!</div>
            <div className="levelup-levels">
              Lv.{levelUp.from} → Lv.{levelUp.to}
            </div>
          </div>
        )}
        <div className="box-container" onClick={handleOpen}>
          <div className="treasure-box">📦</div>
          <p className="box-hint">상자를 클릭하여 열기!</p>
        </div>
      </div>
    );
  }

  const item = rewards[currentIndex] as any;
  const isConsumable = item._consumable === true;

  return (
    <div className="page reward-box">
      <h1 className="title">{title || (item.isLevelUp ? '🎁 레벨업 보상!' : '🎁 전투 드롭!')}</h1>

      <div className="reward-reveal">
        <div className="reward-item" style={{ borderColor: isConsumable ? '#4fc3f7' : RARITY_COLORS[item.rarity] }}>
          {item.isLevelUp && <div className="reward-badge-levelup">레벨업 보상</div>}
          {!item.isLevelUp && <div className="reward-badge-drop">몬스터 드롭</div>}
          <div className="reward-emoji">{isConsumable ? (item._emoji || '📜') : (ITEM_TYPE_EMOJI[item.type] || '📦')}</div>
          <div className="reward-name" style={{ color: isConsumable ? '#4fc3f7' : RARITY_COLORS[item.rarity] }}>
            {item.name}
          </div>
          {!isConsumable && (
            <div className="reward-rarity" style={{ color: RARITY_COLORS[item.rarity] }}>
              [{RARITY_NAMES[item.rarity]}]
            </div>
          )}
          {isConsumable && (
            <div className="reward-rarity" style={{ color: '#4fc3f7' }}>
              [소모품]
            </div>
          )}
          <div className="reward-type">{isConsumable ? '소모품' : ITEM_TYPE_NAMES[item.type]}</div>
          <div className="reward-desc">{item.description}</div>
        </div>
      </div>

      <p className="reward-count">{currentIndex + 1} / {rewards.length}</p>

      <button className="btn btn-primary" onClick={handleNext}>
        {currentIndex < rewards.length - 1 ? '다음 보상' : '가방에 넣기'}
      </button>
    </div>
  );
}
