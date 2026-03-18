import React, { useState, useEffect } from 'react';
import type { Character, RoguelikeRunState, RoguelikeShopInfo } from '../types';

interface Props {
  character: Character;
  runState: RoguelikeRunState;
  onBuy: (itemId: string) => Promise<{ success: boolean; message: string }>;
  onDone: () => void;
}

export function RoguelikeShop({ character, runState, onBuy, onDone }: Props) {
  const [shopInfo, setShopInfo] = useState<RoguelikeShopInfo | null>(null);
  const [message, setMessage] = useState('');
  const [gold, setGold] = useState(runState.gold);

  useEffect(() => {
    window.api.roguelikeShopInfo(character.id).then(setShopInfo);
  }, [character.id]);

  const handleBuy = async (itemId: string, cost: number) => {
    if (shopInfo && shopInfo.gold < cost) {
      setMessage('금화가 부족합니다!');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    const result = await onBuy(itemId);
    setMessage(result.message);
    if (result.success) {
      // 상점 정보 갱신
      const updated = await window.api.roguelikeShopInfo(character.id);
      setShopInfo(updated);
      setGold(updated?.gold ?? gold);
    }
    setTimeout(() => setMessage(''), 2000);
  };

  if (!shopInfo) return <div className="roguelike-shop"><p>로딩 중...</p></div>;

  return (
    <div className="roguelike-shop">
      <h2>상점</h2>
      <div className="shop-gold">보유 금화: {shopInfo.gold}</div>

      {message && <div className="shop-message">{message}</div>}

      <div className="shop-items">
        {shopInfo.items.map(item => (
          <div key={item.id} className="shop-item-card">
            <div className="shop-item-name">{item.name}</div>
            <div className="shop-item-desc">{item.description}</div>
            <div className="shop-item-cost">
              {item.discountedCost < item.cost ? (
                <><span className="original-cost">{item.cost}</span> → {item.discountedCost}</>
              ) : (
                <>{item.cost}</>
              )}
            </div>
            <button
              className={`btn btn-secondary btn-small ${shopInfo.gold < item.discountedCost ? 'btn-insufficient' : ''}`}
              onClick={() => handleBuy(item.id, item.discountedCost)}
            >
              구매
            </button>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" onClick={onDone}>상점 나가기</button>
    </div>
  );
}
