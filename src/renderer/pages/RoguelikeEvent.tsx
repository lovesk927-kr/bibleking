import React, { useState, useEffect } from 'react';
import type { Character, RoguelikeRunState, RoguelikeEventInfo, Item } from '../types';

interface Props {
  character: Character;
  onDone: (newState: RoguelikeRunState) => void;
}

export function RoguelikeEvent({ character, onDone }: Props) {
  const [event, setEvent] = useState<RoguelikeEventInfo | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [statChanges, setStatChanges] = useState<{ label: string; before: number; after: number }[]>([]);
  const [choosing, setChoosing] = useState(false);
  const [pendingState, setPendingState] = useState<RoguelikeRunState | null>(null);
  const [eventItem, setEventItem] = useState<Item | null>(null);
  const [itemRevealed, setItemRevealed] = useState(false);

  useEffect(() => {
    window.api.roguelikeEventInfo(character.id).then(setEvent);
  }, [character.id]);

  const handleChoice = async (index: number) => {
    if (choosing) return;
    setChoosing(true);
    const res = await window.api.roguelikeEventChoice({ characterId: character.id, choiceIndex: index });
    if (res) {
      setResult(res.result);
      setStatChanges(res.statChanges || []);
      setPendingState(res.runState);
      if (res.eventItem) {
        setEventItem(res.eventItem);
      }
    }
  };

  const handleConfirm = () => {
    if (eventItem && !itemRevealed) {
      // 아이템이 있으면 먼저 카드 오픈
      return;
    }
    if (pendingState) onDone(pendingState);
  };

  const handleItemReveal = () => {
    setItemRevealed(true);
  };

  const handleItemConfirm = () => {
    setEventItem(null);
    if (pendingState) onDone(pendingState);
  };

  if (!event) return <div className="roguelike-event"><p>로딩 중...</p></div>;

  // 아이템 카드 오픈 화면
  if (eventItem && result) {
    return (
      <div className="roguelike-event">
        <div className="item-drop-overlay">
          <div className="item-drop-title">아이템 획득!</div>
          {!itemRevealed ? (
            <div className="item-card item-card-closed" onClick={handleItemReveal}>
              <div className="item-card-back">
                <span className="item-card-icon">🎁</span>
                <div className="item-card-hint">클릭하여 열기</div>
              </div>
            </div>
          ) : (
            <div className={`item-card item-card-opened rarity-${eventItem.rarity}`}>
              <div className="item-card-rarity">
                {eventItem.rarity === 'mythic' ? '신화' : eventItem.rarity === 'legendary' ? '전설' : eventItem.rarity === 'epic' ? '영웅' : eventItem.rarity === 'rare' ? '희귀' : '일반'}
              </div>
              <div className="item-card-name">{eventItem.name}</div>
              <div className="item-card-desc">{eventItem.description}</div>
              <div className="item-card-stat">
                {eventItem.stat_type === 'attack' ? '⚔️ 공격력' : eventItem.stat_type === 'defense' ? '🛡️ 방어력' : eventItem.stat_type === 'hp' ? '❤️ 체력' : '💨 회피'} +{eventItem.stat_bonus}
              </div>
              <button className="btn btn-primary item-card-confirm" onClick={handleItemConfirm}>확인</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="roguelike-event">
      <div className="event-card">
        <h2>{event.name}</h2>
        <p className="event-description">{event.description}</p>

        {!result ? (
          <div className="event-choices">
            {event.choices.map((choice, i) => (
              <button
                key={i}
                className="btn btn-game event-choice-btn"
                onClick={() => handleChoice(i)}
                disabled={choosing}
              >
                {choice.label}
                {choice.cost && <span className="choice-cost"> ({choice.cost})</span>}
              </button>
            ))}
          </div>
        ) : (
          <div className="event-result">
            <p>{result}</p>
            {statChanges.length > 0 && (
              <div className="event-stat-changes">
                {statChanges.map((sc, i) => {
                  const diff = sc.after - sc.before;
                  return (
                    <div key={i} className={`stat-change ${diff > 0 ? 'stat-up' : 'stat-down'}`}>
                      {sc.label}: {sc.before} → {sc.after} ({diff > 0 ? '+' : ''}{diff})
                    </div>
                  );
                })}
              </div>
            )}
            {pendingState && (
              <button className="btn btn-primary event-confirm-btn" onClick={handleConfirm}>확인</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
