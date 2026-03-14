import React, { useState, useEffect } from 'react';
import { NetworkClient } from '../network-client';

interface SavedServer {
  nickname: string;
  address: string;
}

const STORAGE_KEY = 'bible-game-saved-servers';

function loadSavedServers(): SavedServer[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveSavedServers(servers: SavedServer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
}

interface Props {
  onConnected: (client: NetworkClient) => void;
  onBack: () => void;
}

export function ClientConnect({ onConnected, onBack }: Props) {
  const [address, setAddress] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [savedServers, setSavedServers] = useState<SavedServer[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveNickname, setSaveNickname] = useState('');

  useEffect(() => {
    setSavedServers(loadSavedServers());
  }, []);

  const connectToAddress = async (addr: string) => {
    const parts = addr.trim().split(':');
    const host = parts[0];
    const port = parseInt(parts[1] || '7777');

    if (!host || isNaN(port)) {
      setError('올바른 주소를 입력하세요 (예: 192.168.0.5:7777)');
      return;
    }

    setConnecting(true);
    setError('');

    const client = new NetworkClient();
    try {
      await client.connect(host, port);
      onConnected(client);
    } catch (e: any) {
      setError(e.message || '연결 실패');
      setConnecting(false);
    }
  };

  const handleConnect = () => {
    if (!address.trim()) {
      setError('주소를 입력하세요');
      return;
    }
    connectToAddress(address.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConnect();
  };

  const handleSave = () => {
    if (!address.trim()) {
      setError('저장할 주소를 먼저 입력하세요');
      return;
    }
    setShowSaveDialog(true);
    setSaveNickname('');
  };

  const handleSaveConfirm = () => {
    if (!saveNickname.trim()) return;
    const newServer: SavedServer = { nickname: saveNickname.trim(), address: address.trim() };
    const existing = savedServers.filter(s => s.nickname !== newServer.nickname);
    const updated = [newServer, ...existing];
    saveSavedServers(updated);
    setSavedServers(updated);
    setShowSaveDialog(false);
  };

  const handleDelete = (nickname: string) => {
    const updated = savedServers.filter(s => s.nickname !== nickname);
    saveSavedServers(updated);
    setSavedServers(updated);
  };

  const handleSavedConnect = (addr: string) => {
    setAddress(addr);
    connectToAddress(addr);
  };

  return (
    <div className="page client-connect">
      <h1 className="title">🔗 방 참가하기</h1>

      {savedServers.length > 0 && (
        <div className="saved-servers">
          <h2 className="section-title">저장된 서버</h2>
          <div className="saved-server-list">
            {savedServers.map(s => (
              <div key={s.nickname} className="saved-server-item">
                <div className="saved-server-info" onClick={() => handleSavedConnect(s.address)}>
                  <span className="saved-server-name">{s.nickname}</span>
                  <span className="saved-server-addr">{s.address}</span>
                </div>
                <button className="saved-server-delete" onClick={() => handleDelete(s.nickname)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="form-group">
        <label>접속 주소</label>
        <div className="address-input-row">
          <input
            type="text"
            className="input"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="192.168.0.5:7777"
            disabled={connecting}
          />
          <button className="btn btn-save-server" onClick={handleSave} disabled={connecting || !address.trim()}>
            저장
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>

      {showSaveDialog && (
        <div className="save-dialog">
          <input
            type="text"
            className="input"
            value={saveNickname}
            onChange={e => setSaveNickname(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveConfirm(); }}
            placeholder="서버 이름 (예: 교회, 집)"
            autoFocus
          />
          <div className="save-dialog-buttons">
            <button className="btn btn-primary" onClick={handleSaveConfirm} disabled={!saveNickname.trim()}>저장</button>
            <button className="btn btn-secondary" onClick={() => setShowSaveDialog(false)}>취소</button>
          </div>
        </div>
      )}

      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? '연결 중...' : '연결'}
        </button>
        <button className="btn btn-secondary" onClick={onBack} disabled={connecting}>
          돌아가기
        </button>
      </div>
    </div>
  );
}
