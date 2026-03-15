import React, { useEffect, useState, useRef } from 'react';
import type { Character, NetworkPlayerInfo, Item } from '../types';
import { CHARACTER_INFO } from '../constants';
import { useApi } from '../api-context';

interface Props {
  character: Character;
  onStartGame: (character: Character, mode: string) => void;
  onBack: () => void;
}

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

export function HostLobby({ character, onStartGame, onBack }: Props) {
  const { api } = useApi();
  const [serverInfo, setServerInfo] = useState<{ ip: string; port: number } | null>(null);
  const [players, setPlayers] = useState<NetworkPlayerInfo[]>([]);
  const [gameMode, setGameMode] = useState<'pvp' | 'boss'>('pvp');
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [verseNumbers, setVerseNumbers] = useState<number[]>([]);
  const [startVerse, setStartVerse] = useState<number>(0);
  const [endVerse, setEndVerse] = useState<number>(0);
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
    startHosting();
    loadVerseNumbers();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const loadVerseNumbers = async () => {
    const nums = await window.api.getVerseNumbers();
    if (nums && nums.length > 0) {
      setVerseNumbers(nums);
      setStartVerse(nums[0]);
      setEndVerse(nums[nums.length - 1]);
      await window.api.networkSetPvpVerseRange({ startVerse: nums[0], endVerse: nums[nums.length - 1] });
    }
  };

  const handleStartVerseChange = async (v: number) => {
    setStartVerse(v);
    const newEnd = endVerse < v ? v : endVerse;
    setEndVerse(newEnd);
    await window.api.networkSetPvpVerseRange({ startVerse: v, endVerse: newEnd });
  };

  const handleEndVerseChange = async (v: number) => {
    setEndVerse(v);
    await window.api.networkSetPvpVerseRange({ startVerse: startVerse, endVerse: v });
  };

  const startHosting = async () => {
    try {
      await window.api.networkSetHostPlayer({
        characterId: character.id,
        characterName: character.name,
        characterType: character.character_type,
        level: character.level,
      });

      const existingInfo = await window.api.networkGetServerInfo();
      if (existingInfo && existingInfo.ip) {
        setServerInfo({ ip: existingInfo.ip, port: existingInfo.port });
        pollRef.current = setInterval(async () => {
          const p = await window.api.networkGetPlayers();
          setPlayers(p);
        }, 1000);
        return;
      }

      const result = await window.api.networkStartServer(7777);
      if (result.success) {
        setServerInfo({ ip: result.ip!, port: result.port! });
        pollRef.current = setInterval(async () => {
          const p = await window.api.networkGetPlayers();
          setPlayers(p);
        }, 1000);
      } else {
        setError(result.error || '서버 시작 실패');
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleModeChange = async (mode: 'pvp' | 'boss') => {
    setGameMode(mode);
    await window.api.networkSetRoomMode(mode);
  };

  const handleStartGame = async () => {
    const bluePlayers = players.filter(p => p.team === 'blue');
    const redPlayers = players.filter(p => p.team === 'red');
    if (gameMode === 'pvp' && (bluePlayers.length === 0 || redPlayers.length === 0)) {
      alert('양 팀에 최소 1명씩 있어야 합니다!');
      return;
    }
    if (gameMode === 'pvp' && players.length < 2) {
      alert('최소 2명이 필요합니다!');
      return;
    }
    await window.api.networkStartGame();
    onStartGame(character, gameMode);
  };

  const handleClose = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    await window.api.networkStopServer();
    onBack();
  };

  const handleToggleEasy = async (playerId: string, easy: boolean) => {
    await window.api.networkSetPvpEasyMode({ playerId, easy });
  };

  const handleSetTeam = async (playerId: string, team: 'blue' | 'red') => {
    await window.api.networkSetPlayerTeam({ playerId, team });
  };

  const handlePlayerClick = async (p: NetworkPlayerInfo) => {
    setSelectedPlayer(p);
    setShowGiftUI(false);
    setSelectedItems(new Set());
    setSelectedConsumables(new Set());
    const record = await window.api.getPvpRecord(p.characterName);
    setPlayerRecord(record);
  };

  const handleOpenGiftUI = async () => {
    const items = await api.getItems(character.id);
    const consumables = await api.getConsumables(character.id);
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
      // 장비 아이템 전송: 클라이언트 플레이어에게 네트워크로 전송
      for (const ciId of selectedItems) {
        const item = myItems.find(i => i.ci_id === ciId);
        if (!item) continue;
        const result = await window.api.networkGiftItem({
          targetPlayerId: selectedPlayer.id,
          characterId: selectedPlayer.characterId,
          item: { name: item.name, description: item.description, type: item.type, stat_type: item.stat_type, stat_bonus: item.stat_bonus, rarity: item.rarity, level_req: item.level_req, enhance_level: item.enhance_level },
        });
        if (result.success) {
          await api.discardItem({ ciId, characterId: character.id });
        } else {
          errors.push(result.message || '장비 전송 실패');
        }
      }
      // 소모품 전송
      for (const type of selectedConsumables) {
        const c = myConsumables.find(c => c.type === type);
        if (!c) continue;
        const result = await window.api.networkGiftConsumable({
          targetPlayerId: selectedPlayer.id,
          characterId: selectedPlayer.characterId,
          type,
          quantity: 1,
        });
        if (result.success) {
          await api.useConsumable({ characterId: character.id, type });
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

  const copyAddress = () => {
    if (serverInfo) {
      navigator.clipboard.writeText(`${serverInfo.ip}:${serverInfo.port}`);
      alert('주소가 복사되었습니다!');
    }
  };

  if (error) {
    return (
      <div className="page host-lobby">
        <h1 className="title">서버 오류</h1>
        <p className="error-text">{error}</p>
        <button className="btn btn-secondary" onClick={onBack}>돌아가기</button>
      </div>
    );
  }

  const info = CHARACTER_INFO[character.character_type];
  const endVerseOptions = verseNumbers.filter(n => n >= startVerse);
  const bluePlayers = players.filter(p => p.team === 'blue');
  const redPlayers = players.filter(p => p.team === 'red');
  const canStart = gameMode === 'pvp' && bluePlayers.length > 0 && redPlayers.length > 0 && players.length >= 2;

  return (
    <div className="page host-lobby">
      <h1 className="title">🏠 호스트 로비</h1>

      {serverInfo && (
        <div className="server-info-box">
          <div className="server-info-label">접속 주소 (다른 PC에서 입력)</div>
          <div className="server-info-address" onClick={copyAddress}>
            {serverInfo.ip}:{serverInfo.port}
          </div>
          <div className="server-info-hint">클릭하면 복사됩니다</div>
        </div>
      )}

      <div className="lobby-section">
        <h2 className="section-title">내 캐릭터</h2>
        <div className="selected-char-card">
          <span className="selected-char-emoji">
            {info.image ? <img src={info.image} className="character-avatar-img" alt="" /> : info.emoji}
          </span>
          <span className="selected-char-name">{character.name}</span>
          <span className="selected-char-level">Lv.{character.level}</span>
        </div>
      </div>

      <div className="lobby-section">
        <h2 className="section-title">게임 모드</h2>
        <div className="game-mode-selector">
          <div
            className={`game-mode-option ${gameMode === 'pvp' ? 'active' : ''}`}
            onClick={() => handleModeChange('pvp')}
          >
            <span className="game-mode-icon">⚔️</span>
            <span className="game-mode-name">PvP 팀전</span>
            <span className="game-mode-desc">팀 대 팀 대결</span>
          </div>
          <div className="game-mode-option disabled">
            <span className="game-mode-icon">🐉</span>
            <span className="game-mode-name">보스 전투 (준비중)</span>
            <span className="game-mode-desc">함께 보스에 도전</span>
          </div>
        </div>
      </div>

      {gameMode === 'pvp' && verseNumbers.length > 0 && (
        <div className="lobby-section">
          <h2 className="section-title">📖 암송 범위</h2>
          <div className="verse-range-selector">
            <div className="verse-range-row">
              <label>시작 절</label>
              <select
                className="verse-range-select"
                value={startVerse}
                onChange={e => handleStartVerseChange(Number(e.target.value))}
              >
                {verseNumbers.map(n => (
                  <option key={n} value={n}>{n}절</option>
                ))}
              </select>
            </div>
            <span className="verse-range-separator">~</span>
            <div className="verse-range-row">
              <label>끝 절</label>
              <select
                className="verse-range-select"
                value={endVerse}
                onChange={e => handleEndVerseChange(Number(e.target.value))}
              >
                {endVerseOptions.map(n => (
                  <option key={n} value={n}>{n}절</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 팀 배치 */}
      <div className="lobby-section">
        <h2 className="section-title">팀 배치 ({players.length}명)</h2>
        <p className="empty-text" style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
          팀 이름을 클릭하여 플레이어를 이동시킬 수 있습니다. 플레이어를 클릭하면 전적을 확인합니다.
        </p>
        <div className="team-layout">
          <div className="team-panel team-blue">
            <div className="team-header team-header-blue">🔵 블루팀 ({bluePlayers.length}명)</div>
            <div className="team-player-list">
              {bluePlayers.length === 0 && <p className="team-empty">팀원 없음</p>}
              {bluePlayers.map((p) => (
                <div key={p.id} className={`team-player-card ${p.isHost ? 'host' : ''}`}>
                  <div className="team-player-info" onClick={() => handlePlayerClick(p)} style={{ cursor: 'pointer' }}>
                    <span className="player-emoji">{CHARACTER_INFO[p.characterType]?.emoji || '❓'}</span>
                    <span className="player-name">{p.characterName}</span>
                    <span className="player-level">Lv.{p.level}</span>
                    {p.isHost && <span className="host-badge">호스트</span>}
                    {p.easyMode && <span className="easy-badge">EASY</span>}
                  </div>
                  <div className="team-player-actions">
                    <button className="btn btn-team-move" onClick={() => handleSetTeam(p.id, 'red')} title="레드팀으로 이동">→ 🔴</button>
                    <button className={`btn btn-easy-toggle-sm ${p.easyMode ? 'active' : ''}`} onClick={() => handleToggleEasy(p.id, !p.easyMode)}>E</button>
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
                <div key={p.id} className={`team-player-card ${p.isHost ? 'host' : ''}`}>
                  <div className="team-player-info" onClick={() => handlePlayerClick(p)} style={{ cursor: 'pointer' }}>
                    <span className="player-emoji">{CHARACTER_INFO[p.characterType]?.emoji || '❓'}</span>
                    <span className="player-name">{p.characterName}</span>
                    <span className="player-level">Lv.{p.level}</span>
                    {p.isHost && <span className="host-badge">호스트</span>}
                    {p.easyMode && <span className="easy-badge">EASY</span>}
                  </div>
                  <div className="team-player-actions">
                    <button className="btn btn-team-move" onClick={() => handleSetTeam(p.id, 'blue')} title="블루팀으로 이동">🔵 ←</button>
                    <button className={`btn btn-easy-toggle-sm ${p.easyMode ? 'active' : ''}`} onClick={() => handleToggleEasy(p.id, !p.easyMode)}>E</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-primary" onClick={handleStartGame} disabled={!canStart}>
          {canStart
            ? `게임 시작 (${bluePlayers.length} vs ${redPlayers.length})`
            : `팀 배치 필요 (블루 ${bluePlayers.length} / 레드 ${redPlayers.length})`}
        </button>
        <button className="btn btn-secondary" onClick={handleClose}>방 닫기</button>
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
