import React, { useState, useRef, useEffect } from 'react';
import type { Character, Item } from '../types';
import { CHARACTER_INFO } from '../constants';
import { useApi } from '../api-context';
import { RewardBox } from './RewardBox';

interface Props {
  onComplete: (character: Character) => void;
  onBack: () => void;
}

export function CharacterCreate({ onComplete, onBack }: Props) {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<number>(1);
  const [reciteMode, setReciteMode] = useState<number>(0);
  const [createdCharacter, setCreatedCharacter] = useState<Character | null>(null);
  const [welcomeRewards, setWelcomeRewards] = useState<Item[]>([]);
  const { api } = useApi();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Electron 포커스 이슈 해결: 마운트 시 input에 포커스
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('캐릭터 이름을 입력하세요!');
      return;
    }
    const result = await api.createCharacter({ name: name.trim(), type: selectedType, reciteMode });
    const { welcomeRewards: rewards, ...character } = result;
    if (rewards && rewards.length > 0) {
      setCreatedCharacter(character);
      setWelcomeRewards(rewards);
    } else {
      onComplete(character);
    }
  };

  if (createdCharacter && welcomeRewards.length > 0) {
    return <RewardBox rewards={welcomeRewards} title="🎉 생성 기념 선물!" onClose={() => onComplete(createdCharacter)} />;
  }

  return (
    <div className="page character-create">
      <h1 className="title">캐릭터 생성</h1>

      <div className="form-group">
        <label>캐릭터 이름</label>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onMouseDown={(e) => { e.currentTarget.focus(); }}
          placeholder="이름을 입력하세요"
          maxLength={10}
          className="input"
          autoFocus
        />
      </div>

      <div className="form-group">
        <label>캐릭터 선택</label>
        <div className="character-type-grid">
          {Object.entries(CHARACTER_INFO).map(([key, info]) => (
            <div
              key={key}
              className={`character-type-card ${selectedType === Number(key) ? 'selected' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setSelectedType(Number(key))}
            >
              <div className="character-type-emoji">
                {info.image
                  ? <img src={info.image} className="character-type-img" alt="" />
                  : info.emoji}
              </div>
              <div className="character-type-name">{info.name}</div>
              <div className="character-type-desc">{info.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>암송(공격) 방식</label>
        <div className="recite-mode-grid">
          <div
            className={`recite-mode-card ${reciteMode === 0 ? 'selected' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setReciteMode(0)}
          >
            <div className="recite-mode-icon">📝</div>
            <div className="recite-mode-name">전체 입력</div>
            <div className="recite-mode-desc">구절 전체를 직접 입력합니다</div>
          </div>
          <div
            className={`recite-mode-card ${reciteMode === 1 ? 'selected' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setReciteMode(1)}
          >
            <div className="recite-mode-icon">🔲</div>
            <div className="recite-mode-name">빈칸 채우기</div>
            <div className="recite-mode-desc">빈칸 부분만 채워넣습니다</div>
          </div>
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-primary" onClick={handleCreate}>생성하기</button>
        <button className="btn btn-secondary" onClick={onBack}>돌아가기</button>
      </div>
    </div>
  );
}
