import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import fs from 'fs';
import path from 'path';
import { initDatabase } from './db';
import { createHandlers } from './handlers';
import { startServer, stopServer, isServerRunning, getLocalIP, setHostPlayer, getServerPlayers, setRoomMode, getRoomInfo, broadcastGameStart, GameMode, setHostEventSender, pvpReady, pvpAttack, pvpEnd, setPvpVerseRange, getPvpVerseRange, setPvpEasyMode, setPlayerTeam, sendGiftFromHost } from './network-server';

// 앱 이름 고정 (실행 방식에 관계없이 동일한 userData 경로 사용)
app.setName('bible-game');

// --multi 파라미터가 없으면 중복 실행 방지
const isMultiMode = process.argv.includes('--multi');
if (!isMultiMode) {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
  }
}

let mainWindow: BrowserWindow | null = null;

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: '암송킹',
    resizable: true,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
  });
  mainWindow.setMenuBarVisibility(false);

  // Set up host event sender for PvP push events and gift notifications
  setHostEventSender((msg: any) => {
    if (msg.type === 'gift:notification') {
      mainWindow?.webContents.send('gift:notification', msg);
    } else {
      mainWindow?.webContents.send('pvp:event', msg);
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  await initDatabase();
  registerIpcHandlers();
  createWindow();

  // 최초 설치 후 실행 안내
  if (process.argv.includes('--squirrel-firstrun') || process.argv.some(a => a.includes('--updated'))) {
    mainWindow?.webContents.once('did-finish-load', () => {
      dialog.showMessageBox(mainWindow!, {
        type: 'info',
        title: '암송킹 설치 완료!',
        message: '암송킹이 설치되었습니다.\n바탕화면의 "암송킹" 바로가기로 실행할 수 있습니다.',
        buttons: ['확인'],
      });
    });
  }

  // 자동 업데이트 체크
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update:status', { type: 'available', version: info.version });
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update:status', { type: 'progress', percent: Math.round(progress.percent) });
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update:status', { type: 'downloaded' });
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: '업데이트 준비 완료',
      message: '새 버전이 다운로드되었습니다. 앱을 재시작하면 업데이트가 적용됩니다.',
      buttons: ['지금 재시작', '나중에'],
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.log('Auto-update error:', err.message);
  });

  // 개발 모드가 아닐 때만 업데이트 체크
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdates().catch(() => {});
  }
});

app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') app.quit();
});

function registerIpcHandlers() {
  const handlers = createHandlers();

  // 모든 게임 핸들러를 일괄 등록
  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, (_event, data) => handler(data));
  }

  // ===== 네트워크 관련 IPC =====
  ipcMain.handle('network:startServer', (_event, port: number) => {
    try {
      const info = startServer(port || 7777);
      return { success: true, ...info };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('network:stopServer', () => {
    stopServer();
    return true;
  });

  ipcMain.handle('network:getServerInfo', () => {
    const running = isServerRunning();
    return {
      running,
      ip: running ? getLocalIP() : null,
      port: 7777,
    };
  });

  ipcMain.handle('network:setHostPlayer', (_event, data: { characterId: number; characterName: string; characterType: number; level: number }) => {
    setHostPlayer(data.characterId, data.characterName, data.characterType, data.level);
    return true;
  });

  ipcMain.handle('network:getPlayers', () => {
    return getServerPlayers();
  });

  ipcMain.handle('network:setRoomMode', (_event, mode: string) => {
    setRoomMode(mode as GameMode);
    return true;
  });

  ipcMain.handle('network:setPvpVerseRange', (_event, range: { startVerse: number; endVerse: number }) => {
    setPvpVerseRange(range);
    return true;
  });

  ipcMain.handle('network:getPvpVerseRange', () => {
    return getPvpVerseRange();
  });

  ipcMain.handle('network:setPvpEasyMode', (_event, data: { playerId: string; easy: boolean }) => {
    setPvpEasyMode(data.playerId, data.easy);
    return true;
  });

  ipcMain.handle('network:setPlayerTeam', (_event, data: { playerId: string; team: string }) => {
    setPlayerTeam(data.playerId, data.team as 'blue' | 'red');
    return true;
  });

  ipcMain.handle('network:startGame', () => {
    broadcastGameStart();
    return true;
  });

  // 네트워크 선물 (호스트 → 클라이언트): 호스트 DB에 직접 저장 + 알림
  ipcMain.handle('network:giftItem', (_event, data: { targetPlayerId: string; characterId: number; item: any; senderName: string }) => {
    return sendGiftFromHost(data.targetPlayerId, data.characterId, 'item', data.item, data.senderName);
  });

  ipcMain.handle('network:giftConsumable', (_event, data: { targetPlayerId: string; characterId: number; type: string; quantity: number; senderName: string; consumableLabel: string }) => {
    return sendGiftFromHost(data.targetPlayerId, data.characterId, 'consumable', { type: data.type, quantity: data.quantity }, data.senderName, data.consumableLabel);
  });

  ipcMain.handle('network:getRoomInfo', () => {
    return getRoomInfo();
  });

  // ===== 파일 내보내기/가져오기 =====
  ipcMain.handle('file:exportVerses', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { success: false };
    const data = await handlers['file:getExportData'](null);
    const result = await dialog.showSaveDialog(win, {
      title: '암송 데이터 내보내기',
      defaultPath: `${data.settings.book}_${data.settings.chapter}편.bible.json`,
      filters: [{ name: '암송 데이터', extensions: ['bible.json'] }],
    });
    if (result.canceled || !result.filePath) return { success: false };
    const exportData = {
      type: 'bible-game-verses',
      version: 1,
      settings: data.settings,
      verses: data.verses,
    };
    fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    return { success: true, path: result.filePath };
  });

  ipcMain.handle('file:importVerses', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { success: false };
    const result = await dialog.showOpenDialog(win, {
      title: '암송 데이터 가져오기',
      filters: [{ name: '암송 데이터', extensions: ['bible.json', 'json'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths.length) return { success: false };
    try {
      const content = fs.readFileSync(result.filePaths[0], 'utf-8');
      const json = JSON.parse(content);
      if (json.type !== 'bible-game-verses') return { success: false, error: '올바른 암송 데이터 파일이 아닙니다.' };
      handlers['file:importData'](json);
      return { success: true };
    } catch {
      return { success: false, error: '파일을 읽을 수 없습니다.' };
    }
  });

  ipcMain.handle('file:exportCharacter', async (_event, characterId: number) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { success: false };
    const data = await handlers['file:getCharacterExportData'](characterId);
    if (!data) return { success: false, error: '캐릭터를 찾을 수 없습니다.' };
    const result = await dialog.showSaveDialog(win, {
      title: '캐릭터 내보내기',
      defaultPath: `${data.character.name}.character.json`,
      filters: [{ name: '캐릭터 데이터', extensions: ['character.json'] }],
    });
    if (result.canceled || !result.filePath) return { success: false };
    const exportData = {
      type: 'bible-game-character',
      version: 1,
      character: data.character,
      items: data.items,
    };
    fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    return { success: true, path: result.filePath };
  });

  // ===== PvP IPC (호스트용) =====
  ipcMain.handle('network:pvpReady', (_event, data: { characterName: string; characterType: number; stats: any }) => {
    pvpReady('host', data);
    return true;
  });

  ipcMain.handle('network:pvpAttack', () => {
    return pvpAttack('host');
  });

  ipcMain.handle('network:pvpEnd', () => {
    pvpEnd('host');
    return true;
  });

  ipcMain.handle('file:importCharacter', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { success: false };
    const result = await dialog.showOpenDialog(win, {
      title: '캐릭터 가져오기',
      filters: [{ name: '캐릭터 데이터', extensions: ['character.json', 'json'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths.length) return { success: false };
    try {
      const content = fs.readFileSync(result.filePaths[0], 'utf-8');
      const json = JSON.parse(content);
      if (json.type !== 'bible-game-character') return { success: false, error: '올바른 캐릭터 데이터 파일이 아닙니다.' };
      const importResult = handlers['file:importCharacterData'](json);
      return importResult;
    } catch {
      return { success: false, error: '파일을 읽을 수 없습니다.' };
    }
  });
}
