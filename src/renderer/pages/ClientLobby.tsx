import React, { useEffect, useState } from 'react';
import { NetworkClient, NetworkPlayerInfo } from '../network-client';
import type { Character, Item } from '../types';
import { CHARACTER_INFO } from '../constants';
import { useApi } from '../api-context';

interface PvpRecord {
  wins: number;
  losses: number;
}

interface ConsumableInfo {
  type: string;
  quantity: number;
}

const CONSUMABLE_LABELS: Record<string, string> = {
  perfect_score: '📜 100점권',
  hint: '💡 힌트권',
};

interface Props {
  client: NetworkClient;
  character: Character;
  onGameStart: (character: Character, mode: string) => void;
  onBack: () => void;
}

export function ClientLobby({ client, character, onGameStart, onBack }: Props) {
  const { api } = useApi();
  const [players, setPlayers] = useState<NetworkPlayerInfo[]>([]);
  const [gameMode, setGameMode] = useState<string>('pvp');
  const [disconnected, setDisconnected] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<NetworkPlayerInfo | null>(null);
  const [playerRecord, setPlayerRecord] = useState<PvpRecord | null>(null);

  // 아이템 주기
  const [showGiftUI, setShowGiftUI] = useState(false);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myConsumables, setMyConsumables] = useState<ConsumableInfo[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectedConsumables, setSelectedConsumables] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    client.setOnLobbyUpdate((p, mode) => {
      setPlayers(p);
      if (mode) setGameMode(mode);
    });

    client.setOnGameStart((mode) => {
      onGameStart(character, mode);
    });

    client.setOnDisconnect(() => {
      setDisconnected(true);
    });

    client.setOnGiftNotification((senderName, itemName, isConsumable) => {
      const label = isConsumable ? '소모품' : '장비';
      alert(`${senderName}님이 ${label} [${itemName}]을(를) 보냈습니다!`);
    });

    client.selectCharacter(character.id, character.name, character.character_type, character.level);
    client.requestPlayers();

    return () => {
      client.setOnLobbyUpdate(() => {});
      client.setOnDisconnect(() => {});
      client.setOnGameStart(() => {});
      client.setOnGiftNotification(() => {});
    };
  }, []);

  const handlePlayerClick = async (p: NetworkPlayerInfo) => {
    setSelectedPlayer(p);
    setShowGiftUI(false);
    setSelectedItems(new Set());
    setSelectedConsumables(new Set());
    try {
      const record = await client.send('pvp:getRecord', p.characterName);
      setPlayerRecord(record || { wins: 0, losses: 0 });
    } catch {
      setPlayerRecord({ wins: 0, losses: 0 });
    }
  };

  const handleOpenGiftUI = async () => {
    // 로컬 DB에서 아이템/소모품 로드 (네트워크 API가 아닌 로컬 API 사용)
    const items = await window.api.getItems(character.id);
    const consumables = await window.api.getConsumables(character.id);
    setMyItems(items.filter((i: Item) => !i.is_equipped));
    setMyConsumables(consumables.filter((c: ConsumableInfo) => c.quantity > 0));
    setSelectedItems(new Set());
    setSelectedConsumables(new Set());
    setShowGiftUI(true);
  };

  const toggleItem = (ciId: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(ciId)) next.delete(ciId);
      else next.add(ciId);
      return next;
    });
  };

  const toggleConsumable = (type: string) => {
    setSelectedConsumables(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const handleSendGift = async () => {
    if (!selectedPlayer || (selectedItems.size === 0 && selectedConsumables.size === 0)) return;
    if (selectedPlayer.characterId === character.id) {
      alert('자기 자신에게는 보낼 수 없습니다.');
      return;
    }
    setSending(true);
    try {
      const errors: string[] = [];
      // 네트워크 아이템 전송: 아이템 데이터를 호스트에 보내고 로컬에서 삭제
      for (const ciId of selectedItems) {
        const item = myItems.find(i => i.ci_id === ciId);
        if (!item) continue;
        const targetPlayerId = selectedPlayer.isHost ? 'host' : selectedPlayer.id;
        const result = await client.send('gift:networkTransferItem', {
          item: { name: item.name, description: item.description, type: item.type, stat_type: item.stat_type, stat_bonus: item.stat_bonus, rarity: item.rarity, level_req: item.level_req, enhance_level: item.enhance_level },
          targetPlayerId,
          targetCharacterId: selectedPlayer.characterId,
          senderName: character.name,
        });
        if (result.success) {
          await window.api.discardItem({ ciId, characterId: character.id });
        } else {
          errors.push(result.message || '장비 전송 실패');
        }
      }
      // 네트워크 소모품 전송
      for (const type of selectedConsumables) {
        const c = myConsumables.find(c => c.type === type);
        if (!c) continue;
        const targetPlayerId = selectedPlayer.isHost ? 'host' : selectedPlayer.id;
        const result = await client.send('gift:networkTransferConsumable', {
          targetPlayerId,
          targetCharacterId: selectedPlayer.characterId,
          type,
          quantity: 1,
          senderName: character.name,
          consumableLabel: CONSUMABLE_LABELS[type] || type,
        });
        if (result.success) {
          await window.api.useConsumable({ characterId: character.id, type });
        } else {
          errors.push(result.message || '소모품 전송 실패');
        }
      }
      if (errors.length > 0) {
        alert('일부 전송 실패:\n' + errors.join('\n'));
      } else {
        alert(`${selectedPlayer.characterName}에게 아이템을 보냈습니다!`);
      }
      setShowGiftUI(false);
      setSelectedPlayer(null);
    } catch (e: any) {
      alert('전송 실패: ' + (e.message || '오류'));
    }
    setSending(false);
  };

  const handleSwitchTeam = (team: 'blue' | 'red') => {
    client.setTeam(team);
  };

  const handleDisconnect = () => {
    client.disconnect();
    onBack();
  };

  if (disconnected) {
    return (
      <div className="page client-lobby">
        <h1 className="title">연결 끊김</h1>
        <p className="subtitle">호스트와의 연결이 끊어졌습니다.</p>
        <button className="btn btn-primary" onClick={onBack}>돌아가기</button>
      </div>
    );
  }

  const infoChar = CHARACTER_INFO[character.character_type];
  const modeLabel = gameMode === 'pvp' ? '⚔️ PvP 팀전' : '🐉 보스 전투';
  const bluePlayers = players.filter(p => p.team === 'blue');
  const redPlayers = players.filter(p => p.team === 'red');
  const myPlayer = players.find(p => p.characterName === character.name);
  const myTeam = myPlayer?.team || 'blue';

  return (
    <div className="page client-lobby">
      <h1 className="title">🔗 네트워크 로비</h1>

      <div className="lobby-section">
        <h2 className="section-title">내 캐릭터</h2>
        <div className="selected-char-card">
          <span className="selected-char-emoji">
            {infoChar.image ? <img src={infoChar.image} className="character-avatar-img" alt="" /> : infoChar.emoji}
          </span>
          <span className="selected-char-name">{character.name}</span>
          <span className="selected-char-level">Lv.{character.level}</span>
          <span className={`team-badge-inline ${myTeam === 'blue' ? 'team-badge-blue' : 'team-badge-red'}`}>
            {myTeam === 'blue' ? '🔵 블루' : '🔴 레드'}
          </span>
        </div>
      </div>

      <div className="lobby-section">
        <h2 className="section-title">게임 모드</h2>
        <div className="game-mode-display">
          <span className="game-mode-current">{modeLabel}</span>
          <span className="game-mode-hint">호스트가 모드를 선택합니다</span>
        </div>
      </div>

      <div className="lobby-section">
        <h2 className="section-title">팀 선택</h2>
        <div className="team-switch-buttons">
          <button className={`btn btn-team-select ${myTeam === 'blue' ? 'active-blue' : ''}`} onClick={() => handleSwitchTeam('blue')}>
            🔵 블루팀
          </button>
          <button className={`btn btn-team-select ${myTeam === 'red' ? 'active-red' : ''}`} onClick={() => handleSwitchTeam('red')}>
            🔴 레드팀
          </button>
        </div>
      </div>

      <div className="lobby-section">
        <h2 className="section-title">팀 배치 ({players.length}명)</h2>
        <div className="team-layout">
          <div className="team-panel team-blue">
            <div className="team-header team-header-blue">🔵 블루팀 ({bluePlayers.length}명)</div>
            <div className="team-player-list">
              {bluePlayers.length === 0 && <p className="team-empty">팀원 없음</p>}
              {bluePlayers.map((p) => (
                <div key={p.id} className={`team-player-card ${p.isHost ? 'host' : ''}`} onClick={() => handlePlayerClick(p)} style={{ cursor: 'pointer' }}>
                  <div className="team-player-info">
                    <span className="player-emoji">{CHARACTER_INFO[p.characterType]?.emoji || '❓'}</span>
                    <span className="player-name">{p.characterName}</span>
                    <span className="player-level">Lv.{p.level}</span>
                    {p.isHost && <span className="host-badge">호스트</span>}
                    {p.easyMode && <span className="easy-badge">EASY</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="team-vs">VS</div>

          <div className="team-panel team-red">
            <div className="team-header team-header-red">🔴 레드팀 ({redPlayers.length}명)</div>
            <div className="team-player-list">
              {redPlayers.length === 0 && <p className="team-empty">팀원 없음</p>}
              {redPlayers.map((p) => (
                <div key={p.id} className={`team-player-card ${p.isHost ? 'host' : ''}`} onClick={() => handlePlayerClick(p)} style={{ cursor: 'pointer' }}>
                  <div className="team-player-info">
                    <span className="player-emoji">{CHARACTER_INFO[p.characterType]?.emoji || '❓'}</span>
                    <span className="player-name">{p.characterName}</span>
                    <span className="player-level">Lv.{p.level}</span>
                    {p.isHost && <span className="host-badge">호스트</span>}
                    {p.easyMode && <span className="easy-badge">EASY</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="waiting-indicator">
        <div className="waiting-dot-animation">
          <span>호스트가 게임을 시작할 때까지 대기 중</span>
          <span className="waiting-dots">...</span>
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-secondary" onClick={handleDisconnect}>연결 끊기</button>
      </div>

      {/* 플레이어 클릭 팝업: 전적 + 아이템 주기 */}
      {selectedPlayer && playerRecord && (
        <div className="pvp-record-overlay" onClick={() => { setSelectedPlayer(null); setShowGiftUI(false); }}>
          <div className="pvp-record-popup gift-popup" onClick={e => e.stopPropagation()}>
            <h3 className="pvp-record-title">{selectedPlayer.characterName}의 PvP 전적</h3>
            <div className="pvp-record-stats">
              <div className="pvp-record-stat">
                <span className="pvp-record-label">총 대전</span>
                <span className="pvp-record-value">{playerRecord.wins + playerRecord.losses}전</span>
              </div>
              <div className="pvp-record-stat win">
                <span className="pvp-record-label">승리</span>
                <span className="pvp-record-value">{playerRecord.wins}승</span>
              </div>
              <div className="pvp-record-stat loss">
                <span className="pvp-record-label">패배</span>
                <span className="pvp-record-value">{playerRecord.losses}패</span>
              </div>
              <div className="pvp-record-stat">
                <span className="pvp-record-label">승률</span>
                <span className="pvp-record-value">
                  {playerRecord.wins + playerRecord.losses > 0
                    ? `${Math.round((playerRecord.wins / (playerRecord.wins + playerRecord.losses)) * 100)}%`
                    : '-'}
                </span>
              </div>
            </div>

            {!showGiftUI ? (
              <div className="gift-buttons">
                {selectedPlayer.characterId !== character.id && (
                  <button className="btn btn-primary" onClick={handleOpenGiftUI}>🎁 아이템 주기</button>
                )}
                <button className="btn btn-secondary" onClick={() => { setSelectedPlayer(null); setShowGiftUI(false); }}>닫기</button>
              </div>
            ) : (
              <div className="gift-item-section">
                <h4 className="gift-section-title">보낼 아이템 선택</h4>

                {myItems.length === 0 && myConsumables.length === 0 && (
                  <p className="gift-empty">보낼 수 있는 아이템이 없습니다.</p>
                )}

                {myItems.length > 0 && (
                  <div className="gift-category">
                    <div className="gift-category-title">장비</div>
                    <div className="gift-item-list">
                      {myItems.map(item => (
                        <label key={item.ci_id} className={`gift-item-row ${selectedItems.has(item.ci_id) ? 'selected' : ''}`}>
                          <input type="checkbox" checked={selectedItems.has(item.ci_id)} onChange={() => toggleItem(item.ci_id)} />
                          <span className={`gift-item-name rarity-${item.rarity}`}>
                            Lv.{item.level_req} {item.name}{item.enhance_level > 0 ? ` +${item.enhance_level}` : ''}
                          </span>
                          <span className="gift-item-stat">{item.stat_type} +{item.stat_bonus}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {myConsumables.length > 0 && (
                  <div className="gift-category">
                    <div className="gift-category-title">소모품</div>
                    <div className="gift-item-list">
                      {myConsumables.map(c => (
                        <label key={c.type} className={`gift-item-row ${selectedConsumables.has(c.type) ? 'selected' : ''}`}>
                          <input type="checkbox" checked={selectedConsumables.has(c.type)} onChange={() => toggleConsumable(c.type)} />
                          <span className="gift-item-name">{CONSUMABLE_LABELS[c.type] || c.type}</span>
                          <span className="gift-item-stat">x{c.quantity}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="gift-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={handleSendGift}
                    disabled={sending || (selectedItems.size === 0 && selectedConsumables.size === 0)}
                  >
                    {sending ? '전송 중...' : `보내기 (${selectedItems.size + selectedConsumables.size}개)`}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowGiftUI(false)}>취소</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
