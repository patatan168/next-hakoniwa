/**
 * @module admin/(panel)/log/log-page-client
 * @description 管理者ログ画面のクライアントコンポーネント。
 */
'use client';

import Button from '@/global/component/Button';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { fetcher } from '@/global/function/fetch/fetch';
import { useClientRect } from '@/global/function/useClientRect';
import { adminCredentialChangeForm, adminCredentialChangeSchema } from '@/global/valid/admin';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

type LogEntry = {
  path: string;
  type: 'file' | 'directory';
  size: number;
  updatedAt: string;
};

type LogsResponse = {
  entries: LogEntry[];
  selectedFile: string | null;
  content: string;
  isTruncated?: boolean;
};

type AdminLogPageClientProps = {
  initialMustChangeCredentials: boolean;
};

const JSON_HEADER = {
  'Content-Type': 'application/json',
};

const MAX_LOG_PREVIEW_CHARS = 200000;

export default function AdminLogPageClient({
  initialMustChangeCredentials,
}: Readonly<AdminLogPageClientProps>) {
  const [mustChangeCredentials, setMustChangeCredentials] = useState(initialMustChangeCredentials);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>('');

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [collapsedDirectories, setCollapsedDirectories] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<string>('');
  const [logTruncated, setLogTruncated] = useState(false);
  const [panelRect, panelRef] = useClientRect<HTMLElement>();
  const initializedCollapseRef = useRef(false);

  const changeForm = useForm<adminCredentialChangeForm>({
    defaultValues: {
      currentId: '',
      currentPassword: '',
      newId: '',
      newPassword: '',
      newPasswordConfirm: '',
      newUserName: '',
    },
    resolver: zodResolver(adminCredentialChangeSchema),
  });

  const loadLogs = useCallback(async (file?: string) => {
    const query = file ? `?file=${encodeURIComponent(file)}` : '';
    const res = await fetcher<LogsResponse>(`/api/admin/logs${query}`, { method: 'GET' });
    setEntries(res.entries);
    setSelectedFile(res.selectedFile);
    setLogContent(res.content);
    setLogTruncated(!!res.isTruncated);
  }, []);

  useEffect(() => {
    if (!mustChangeCredentials) {
      loadLogs().catch((e: Error) => {
        setMessage(e.message || 'ログ一覧の取得に失敗しました。');
      });
    }
  }, [mustChangeCredentials, loadLogs]);

  useEffect(() => {
    const currentDirectories = new Set(
      entries.filter((entry) => entry.type === 'directory').map((entry) => entry.path)
    );

    if (!initializedCollapseRef.current && currentDirectories.size > 0) {
      initializedCollapseRef.current = true;
      setCollapsedDirectories(new Set(currentDirectories));
      return;
    }

    setCollapsedDirectories((prev) => {
      const next = new Set<string>();
      for (const directory of prev) {
        if (currentDirectories.has(directory)) {
          next.add(directory);
        }
      }
      return next;
    });
  }, [entries]);

  const onChangeInitialCredentials = changeForm.handleSubmit(async (values) => {
    setBusy(true);
    setMessage('');
    try {
      await fetcher('/api/admin/change-initial-credentials', {
        method: 'PUT',
        headers: JSON_HEADER,
        body: JSON.stringify(values),
      });
      changeForm.reset();
      setMustChangeCredentials(false);
      setMessage('資格情報を更新しました。');
      await loadLogs();
    } catch (e) {
      setMessage((e as Error).message || '資格情報の更新に失敗しました。');
    } finally {
      setBusy(false);
    }
  });

  const fileEntries = useMemo(() => entries.filter((v) => v.type === 'file'), [entries]);
  const visibleEntries = useMemo(() => {
    const isHiddenByCollapsedDirectory = (entryPath: string): boolean => {
      const segments = entryPath.split('/');
      for (let i = 1; i < segments.length; i += 1) {
        const parentPath = segments.slice(0, i).join('/');
        if (collapsedDirectories.has(parentPath)) {
          return true;
        }
      }
      return false;
    };

    return entries.filter((entry) => !isHiddenByCollapsedDirectory(entry.path));
  }, [collapsedDirectories, entries]);
  const panelHeight = panelRect
    ? `max(20rem, calc(var(--real-vh-minus-footer) - ${panelRect.y}px - 2rem))`
    : 'calc(var(--real-vh-minus-footer) - 10.5rem)';
  const panelStyle = {
    '--admin-log-panel-height': panelHeight,
  } as CSSProperties;

  return (
    <>
      {message && <p className="mb-4 rounded-md bg-amber-100 p-3 text-amber-800">{message}</p>}

      {mustChangeCredentials ? (
        <section className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <h2 className="mb-2 text-lg font-semibold text-red-800">初回設定が必要です</h2>
          <p className="mb-4 text-sm text-red-700">
            初期IDと初期パスワードは使用できません。ID・パスワード・管理者ユーザー名を変更してください。
          </p>
          <form onSubmit={onChangeInitialCredentials} className="space-y-3">
            <TextFieldRHF
              required
              name="currentId"
              pattern="^[a-zA-Z0-9]+$"
              autoComplete="off"
              control={changeForm.control}
              id="admin-current-id"
              placeholder="現在のID"
              isBottomSpace={true}
            />
            <TextFieldRHF
              required
              name="currentPassword"
              autoComplete="off"
              control={changeForm.control}
              type="password"
              id="admin-current-password"
              placeholder="現在のパスワード"
              isBottomSpace={true}
            />
            <TextFieldRHF
              required
              name="newId"
              pattern="^[a-zA-Z0-9]+$"
              autoComplete="off"
              control={changeForm.control}
              id="admin-new-id"
              placeholder="新しいID"
              isBottomSpace={true}
            />
            <TextFieldRHF
              required
              name="newPassword"
              autoComplete="off"
              control={changeForm.control}
              type="password"
              id="admin-new-password"
              placeholder="新しいパスワード"
              isBottomSpace={true}
            />
            <TextFieldRHF
              required
              name="newPasswordConfirm"
              autoComplete="off"
              control={changeForm.control}
              type="password"
              id="admin-new-password-confirm"
              placeholder="新しいパスワード(確認)"
              isBottomSpace={true}
            />
            <TextFieldRHF
              required
              name="newUserName"
              autoComplete="off"
              control={changeForm.control}
              id="admin-new-user-name"
              placeholder="管理者ユーザー名"
              isBottomSpace={false}
            />
            <Button type="submit" disabled={busy}>
              資格情報を更新
            </Button>
          </form>
        </section>
      ) : (
        <section
          ref={panelRef}
          style={panelStyle}
          className="grid min-h-0 grid-cols-1 items-stretch gap-4 overflow-x-hidden rounded-lg border bg-white p-4 lg:h-[var(--admin-log-panel-height)] lg:max-h-[var(--admin-log-panel-height)] lg:grid-cols-[340px_minmax(0,1fr)]"
        >
          <div className="flex h-full min-h-0 min-w-0 flex-col">
            <h2 className="mb-2 text-lg font-semibold">log フォルダ一覧</h2>
            <div className="max-h-full min-h-0 flex-1 overflow-auto rounded border bg-gray-50 p-2">
              {entries.length === 0 && <p className="text-sm text-gray-500">ログがありません。</p>}
              <ul className="space-y-1">
                {visibleEntries.map((entry) => {
                  const depth = entry.path.split('/').length - 1;
                  const pad = depth * 12;
                  if (entry.type === 'directory') {
                    const folderName = entry.path.split('/').at(-1) ?? entry.path;
                    const isCollapsed = collapsedDirectories.has(entry.path);
                    return (
                      <li key={`d-${entry.path}`} className="min-w-0" style={{ paddingLeft: pad }}>
                        <button
                          type="button"
                          className="w-full min-w-0 cursor-pointer rounded px-2 py-1 text-left text-xs font-semibold text-gray-600 hover:bg-gray-100"
                          onClick={() => {
                            setCollapsedDirectories((prev) => {
                              const next = new Set(prev);
                              if (next.has(entry.path)) {
                                next.delete(entry.path);
                              } else {
                                next.add(entry.path);
                              }
                              return next;
                            });
                          }}
                          disabled={busy}
                          aria-label={`${folderName} を ${isCollapsed ? '展開' : '折りたたみ'}`}
                        >
                          <span className="mr-1 inline-block w-4">{isCollapsed ? '>' : 'v'}</span>
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="mr-1 inline-block h-3.5 w-3.5 text-amber-600"
                            fill="currentColor"
                          >
                            <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h4.1a2 2 0 0 1 1.4.58l.95.92h6.55A2.5 2.5 0 0 1 21 8v9.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z" />
                          </svg>
                          <span className="break-all">{folderName}</span>
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li key={`f-${entry.path}`} className="min-w-0" style={{ paddingLeft: pad }}>
                      <button
                        type="button"
                        onClick={() => {
                          setBusy(true);
                          setMessage('');
                          loadLogs(entry.path)
                            .catch((e: Error) =>
                              setMessage(e.message || 'ログの取得に失敗しました。')
                            )
                            .finally(() => setBusy(false));
                        }}
                        className={`w-full min-w-0 cursor-pointer rounded px-2 py-1 text-left text-sm break-all hover:bg-emerald-100 ${
                          selectedFile === entry.path ? 'bg-emerald-200 font-semibold' : ''
                        }`}
                        disabled={busy}
                      >
                        {entry.path}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <p className="mt-2 text-xs text-gray-500">ファイル数: {fileEntries.length}</p>
          </div>

          <div className="flex h-full min-h-0 min-w-0 flex-col">
            <h2 className="mb-2 text-lg font-semibold">ログ内容</h2>
            <p className="mb-2 text-xs break-all text-gray-500">
              {selectedFile
                ? `選択中: ${selectedFile}`
                : '左の一覧からログファイルを選択してください。'}
            </p>
            {logTruncated && (
              <p className="mb-2 text-xs text-amber-700">
                表示文字数が多いため、末尾 {MAX_LOG_PREVIEW_CHARS.toLocaleString()}{' '}
                文字のみ表示しています。
              </p>
            )}
            <pre className="min-h-0 flex-1 overflow-auto rounded border bg-gray-950 p-3 text-xs leading-relaxed break-all whitespace-pre-wrap text-green-200">
              {logContent || 'ログファイルが未選択です。'}
            </pre>
          </div>
        </section>
      )}
    </>
  );
}
