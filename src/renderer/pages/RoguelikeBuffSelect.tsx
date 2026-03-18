import React, { useState, useEffect } from 'react';
import type { Character, RoguelikeRunState } from '../types';

interface Props {
  character: Character;
  onDone: (newState: RoguelikeRunState) => void;
}

export function RoguelikeBuffSelect({ character, onDone }: Props) {
  const [choices, setChoices] = useState<{ id: string; name: string; description: string }[]>([]);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    window.api.roguelikeGetBuffChoices(character.id).then(setChoices);
  }, [character.id]);

  const handleSelect = async (buffId: string) => {
    if (selecting) return;
    setSelecting(true);
    const newState = await window.api.roguelikeSelectBuff({ characterId: character.id, buffId });
    if (newState) onDone(newState);
  };

  return (
    <div className="roguelike-buff-select">
      <h2>축복을 선택하세요</h2>
      <div className="buff-cards">
        {choices.map(buff => (
          <button
            key={buff.id}
            className="buff-card"
            onClick={() => handleSelect(buff.id)}
            disabled={selecting}
          >
            <div className="buff-card-name">{buff.name}</div>
            <div className="buff-card-desc">{buff.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
