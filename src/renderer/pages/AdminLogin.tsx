import React, { useState } from 'react';
import { useApi } from '../api-context';
import { useInputFocus } from '../hooks';

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

export function AdminLogin({ onSuccess, onBack }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { api } = useApi();
  const [inputRef, inputHandlers] = useInputFocus();

  const handleLogin = async () => {
    const result = await api.adminLogin(password);
    if (result) {
      onSuccess();
    } else {
      setError('비밀번호가 틀렸습니다.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="page admin-login">
      <h1 className="title">🔐 관리자 모드</h1>

      <div className="form-group">
        <label>비밀번호</label>
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          {...inputHandlers}
          placeholder="관리자 비밀번호 입력"
          className="input"
        />
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="button-group">
        <button className="btn btn-primary" onClick={handleLogin}>로그인</button>
        <button className="btn btn-secondary" onClick={onBack}>돌아가기</button>
      </div>
    </div>
  );
}
