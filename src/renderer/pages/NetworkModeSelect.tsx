import React from 'react';

interface Props {
  onHost: () => void;
  onJoin: () => void;
  onBack: () => void;
}

export function NetworkModeSelect({ onHost, onJoin, onBack }: Props) {
  return (
    <div className="page network-mode-select">
      <h1 className="title">🌐 네트워크 모드</h1>
      <p className="subtitle">같은 네트워크(Wi-Fi)에서 여러 명이 함께 플레이!</p>

      <div className="network-options">
        <div className="network-option-card" onClick={onHost}>
          <div className="network-option-icon">🏠</div>
          <div className="network-option-name">방 만들기</div>
          <div className="network-option-desc">호스트가 되어 다른 플레이어를 초대합니다</div>
        </div>
        <div className="network-option-card" onClick={onJoin}>
          <div className="network-option-icon">🔗</div>
          <div className="network-option-name">방 참가하기</div>
          <div className="network-option-desc">호스트의 IP를 입력하여 접속합니다</div>
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-secondary" onClick={onBack}>돌아가기</button>
      </div>
    </div>
  );
}
