import React, { useEffect, useState } from 'react';
import type { Character } from '../types';
import { CHARACTER_INFO } from '../constants';
import { useApi } from '../api-context';

interface Props {
  onSelect: (character: Character) => void;
  onCreate: () => void;
  onAdmin: () => void;
  onNetwork: () => void;
  isNetworkMode: boolean;
  isHost: boolean;
}

export function CharacterSelect({ onSelect, onCreate, onAdmin, onNetwork, isNetworkMode, isHost }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [importMessage, setImportMessage] = useState('');
  const [showContact, setShowContact] = useState(false);
  const { api } = useApi();

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    const list = await api.getCharacters();
    setCharacters(list);
  };

  const handleImportCharacter = async () => {
    const result = await api.importCharacter();
    if (result.success) {
      setImportMessage('캐릭터 가져오기 완료!');
      loadCharacters();
    } else {
      setImportMessage(result.error || '가져오기 취소');
    }
    setTimeout(() => setImportMessage(''), 3000);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('정말 이 캐릭터를 삭제하시겠습니까?')) {
      await api.deleteCharacter(id);
      loadCharacters();
    }
  };

  return (
    <div className="page character-select">
      <h1 className="title">⚔️ 암송킹 ⚔️</h1>
      <p className="subtitle">{isNetworkMode ? '네트워크 모드에 참여할 캐릭터를 선택하세요' : '캐릭터를 선택하세요'}</p>

      <div className="character-list">
        {characters.map((c) => (
          <div key={c.id} className="character-card" onClick={() => onSelect(c)}>
            <div className={`character-avatar type-${c.character_type}`}>
              {CHARACTER_INFO[c.character_type].image
                ? <img src={CHARACTER_INFO[c.character_type].image} className="character-avatar-img" alt="" />
                : CHARACTER_INFO[c.character_type].emoji}
            </div>
            <div className="character-info">
              <span className="character-name">{c.name}</span>
              <span className="character-level">Lv.{c.level}</span>
              <span className="character-type-name">{CHARACTER_INFO[c.character_type].name}</span>
            </div>
            <button className="btn-delete" onClick={(e) => handleDelete(c.id, e)}>✕</button>
          </div>
        ))}
      </div>

      {importMessage && <p className="file-message">{importMessage}</p>}

      <div className="button-grid-2x2">
        <button className="btn btn-primary" onClick={onCreate}>
          새 캐릭터 만들기
        </button>
        <button className="btn btn-import" onClick={handleImportCharacter}>
          캐릭터 가져오기
        </button>
        {(!isNetworkMode || isHost) && (
          <button className="btn btn-secondary" onClick={onAdmin}>
            관리자 모드
          </button>
        )}
        {!isNetworkMode && (
          <button className="btn btn-network" onClick={onNetwork}>
            네트워크 모드
          </button>
        )}
      </div>

      <div className="main-footer">
        <button className="btn-contact" onClick={() => setShowContact(true)}>문의하기</button>
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
