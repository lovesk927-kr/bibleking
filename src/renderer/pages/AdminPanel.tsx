import React, { useEffect, useState } from 'react';
import type { Verse } from '../types';
import { useApi } from '../api-context';

interface Props {
  onBack: () => void;
}

export function AdminPanel({ onBack }: Props) {
  const { api } = useApi();
  const [book, setBook] = useState('시편');
  const [chapter, setChapter] = useState('119');
  const [startVerse, setStartVerse] = useState(1);
  const [verseCount, setVerseCount] = useState(10);
  const [verses, setVerses] = useState<{ verse_number: number; content: string }[]>([]);
  const [saved, setSaved] = useState(false);
  const [blankMode, setBlankMode] = useState(false);
  const [blanks, setBlanks] = useState<{ verse_number: number; blank_template: string }[]>([]);
  const [blankSaved, setBlankSaved] = useState(false);
  const [fileMessage, setFileMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const settings = await api.adminGetSettings();
    setBook(settings.book);
    setChapter(settings.chapter);
    setStartVerse(settings.startVerse);
    setVerseCount(settings.verseCount);

    const existing = await api.adminGetVerses();
    generateVerseInputs(settings.startVerse, settings.verseCount, existing);
  };

  const generateVerseInputs = (start: number, count: number, existing: Verse[] = []) => {
    const list: { verse_number: number; content: string }[] = [];
    for (let i = 0; i < count; i++) {
      const vn = start + i;
      const found = existing.find((v) => v.verse_number === vn);
      list.push({ verse_number: vn, content: found?.content || '' });
    }
    setVerses(list);
  };

  const handleSettingsChange = (newStart: number, newCount: number) => {
    if (newCount < 1 || newCount > 176) return;
    if (newStart < 1) return;
    setStartVerse(newStart);
    setVerseCount(newCount);
    const currentVerses = [...verses];
    generateVerseInputs(newStart, newCount, currentVerses.map((v) => ({
      id: 0, book, chapter: parseInt(chapter),
      verse_number: v.verse_number, content: v.content, blank_template: '',
    })));
  };

  const handleVerseChange = (index: number, content: string) => {
    setVerses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], content };
      return updated;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    await api.adminSaveSettings({ book, chapter, startVerse, verseCount });
    await api.adminSaveVerses({
      book,
      chapter,
      verses: verses.filter((v) => v.content.trim()),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleOpenBlankMode = async () => {
    const existing = await api.adminGetBlankTemplates();
    const blankList = verses.map((v) => {
      const found = existing.find((e: any) => e.verse_number === v.verse_number);
      return {
        verse_number: v.verse_number,
        blank_template: found?.blank_template || v.content,
      };
    });
    setBlanks(blankList);
    setBlankMode(true);
  };

  const handleBlankChange = (index: number, value: string) => {
    setBlanks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], blank_template: value };
      return updated;
    });
    setBlankSaved(false);
  };

  const handleSaveBlanks = async () => {
    await api.adminSaveBlankTemplates(blanks);
    setBlankSaved(true);
    setTimeout(() => setBlankSaved(false), 2000);
  };

  const handleExport = async () => {
    const result = await api.exportVerses();
    if (result.success) {
      setFileMessage('내보내기 완료!');
    } else {
      setFileMessage(result.error || '내보내기 취소');
    }
    setTimeout(() => setFileMessage(''), 3000);
  };

  const handleImport = async () => {
    const result = await api.importVerses();
    if (result.success) {
      setFileMessage('가져오기 완료!');
      loadData();
    } else {
      setFileMessage(result.error || '가져오기 취소');
    }
    setTimeout(() => setFileMessage(''), 3000);
  };

  const handleClearDb = async () => {
    if (!confirm('정말 DB를 초기화하시겠습니까?\n모든 캐릭터, 아이템, 암송 데이터가 삭제됩니다!')) return;
    if (!confirm('이 작업은 되돌릴 수 없습니다.\n정말로 진행하시겠습니까?')) return;
    await window.api.adminClearDb();
    alert('DB가 초기화되었습니다. 설정을 다시 로드합니다.');
    setVerses([]);
    setBlanks([]);
    loadData();
  };

  const verseLabel = (vn: number) => `${book} ${chapter}:${vn}`;

  return (
    <div className="page admin-panel">
      <h1 className="title">⚙️ 관리자 패널</h1>

      <div className="admin-settings">
        <div className="form-group">
          <label>성경 말씀</label>
          <div className="bible-ref-inputs">
            <input
              type="text"
              className="input input-book"
              value={book}
              onChange={(e) => setBook(e.target.value)}
              placeholder="예: 시편"
            />
            <input
              type="text"
              className="input input-chapter"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="예: 119"
            />
            <span className="bible-ref-label">편</span>
          </div>
        </div>

        <div className="form-group">
          <label>시작 절</label>
          <div className="count-control">
            <button className="btn btn-small" onClick={() => handleSettingsChange(startVerse - 1, verseCount)}>-</button>
            <span className="count-display">{startVerse}절</span>
            <button className="btn btn-small" onClick={() => handleSettingsChange(startVerse + 1, verseCount)}>+</button>
          </div>
        </div>

        <div className="form-group">
          <label>절 수</label>
          <div className="count-control">
            <button className="btn btn-small" onClick={() => handleSettingsChange(startVerse, verseCount - 1)}>-</button>
            <span className="count-display">{verseCount}절</span>
            <button className="btn btn-small" onClick={() => handleSettingsChange(startVerse, verseCount + 1)}>+</button>
          </div>
          <p className="hint-text">{verseLabel(startVerse)} ~ {verseLabel(startVerse + verseCount - 1)} 출제</p>
        </div>
      </div>

      <div className="verse-editor">
        <h2 className="section-title">정답 입력</h2>
        {verses.map((v, index) => (
          <div key={v.verse_number} className="verse-edit-item">
            <label className="verse-label">{verseLabel(v.verse_number)}</label>
            <textarea
              className="verse-input"
              value={v.content}
              onChange={(e) => handleVerseChange(index, e.target.value)}
              placeholder={`${v.verse_number}절의 내용을 입력하세요...`}
              rows={2}
            />
          </div>
        ))}
      </div>

      <div className="button-group">
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? '✓ 저장 완료!' : '저장하기'}
        </button>
        <button className="btn btn-blank-setting" onClick={handleOpenBlankMode}>
          🔲 빈칸 셋팅하기
        </button>
        <button className="btn btn-export" onClick={handleExport}>
          내보내기
        </button>
        <button className="btn btn-import" onClick={handleImport}>
          가져오기
        </button>
        <button className="btn btn-secondary" onClick={onBack}>돌아가기</button>
        <button className="btn btn-danger" onClick={handleClearDb}>DB 초기화</button>
      </div>
      {fileMessage && <p className="file-message">{fileMessage}</p>}

      {blankMode && (
        <div className="blank-overlay">
          <div className="blank-modal">
            <h2 className="section-title">🔲 빈칸 셋팅</h2>
            <p className="hint-text">빈칸으로 만들 부분을 지우고 <strong>x</strong>로 입력하세요. (예: "행위가 x하여 여호와의 x을 따라")</p>

            <div className="verse-editor">
              {blanks.map((b, index) => {
                const original = verses.find((v) => v.verse_number === b.verse_number);
                return (
                  <div key={b.verse_number} className="verse-edit-item">
                    <label className="verse-label">{verseLabel(b.verse_number)}</label>
                    <div className="blank-original">정답: {original?.content || ''}</div>
                    <textarea
                      className="verse-input"
                      value={b.blank_template}
                      onChange={(e) => handleBlankChange(index, e.target.value)}
                      placeholder="빈칸으로 만들 부분을 x로 바꾸세요..."
                      rows={2}
                    />
                    <div className="blank-preview">
                      미리보기: {b.blank_template.split(/(?=x)|(?<=x)/g).map((part, i) =>
                        part === 'x'
                          ? <span key={i} className="blank-slot">[____]</span>
                          : <span key={i}>{part}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="button-group">
              <button className="btn btn-primary" onClick={handleSaveBlanks}>
                {blankSaved ? '✓ 저장 완료!' : '빈칸 저장하기'}
              </button>
              <button className="btn btn-secondary" onClick={() => setBlankMode(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
