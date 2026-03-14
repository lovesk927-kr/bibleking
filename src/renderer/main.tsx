import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);

// React 렌더링 완료 후 로딩 화면 제거
const loadingScreen = document.getElementById('loading-screen');
if (loadingScreen) {
  loadingScreen.style.transition = 'opacity 0.3s';
  loadingScreen.style.opacity = '0';
  setTimeout(() => loadingScreen.remove(), 300);
}
