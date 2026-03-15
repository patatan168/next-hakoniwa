'use client';
import Button from '@/global/component/Button';
import Modal from '@/global/component/Modal';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import META_DATA from '@/global/define/metadata';
import { getCookie } from '@/global/function/cookie';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { deleteAccountStore } from '@/global/store/api/account/delete';
import { changeAccountStore } from '@/global/store/api/account/update';
import type { changeAccountForm, deleteAccountForm } from '@/global/valid/account';
import { changeAccountSchema, deleteAccountSchema } from '@/global/valid/account';
import { sanitizeJsonStringify } from '@/global/valid/xss';
import { zodResolver } from '@hookform/resolvers/zod';
import { startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { IoSendSharp } from 'react-icons/io5';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { TbFingerprint, TbFingerprintOff } from 'react-icons/tb';

const POST_HEADER = {
  headers: { 'Content-Type': 'application/json' },
};

// --- セクションヘッダー ---

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="mb-4 border-b border-gray-300 pb-2 text-xl font-semibold text-gray-800">
      {title}
    </h2>
  );
}

// --- 結果メッセージ ---

function ResultMessage({ success, error }: { success: boolean; error: string | undefined }) {
  if (success) {
    return <p className="mb-4 rounded-md bg-green-100 p-3 text-green-700">変更しました。</p>;
  }
  if (error) {
    return <p className="mb-4 rounded-md bg-red-100 p-3 text-red-700">{error}</p>;
  }
  return null;
}

// --- チェックボックスフィールド ---

function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-3 transition-colors select-none hover:bg-gray-50"
    >
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 cursor-pointer accent-blue-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}

// --- アニメーション付き展開フィールド ---

function ExpandableFields({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-200 ease-in-out"
      style={{ gridTemplateRows: show ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">
        <div className="space-y-1 pt-1">{children}</div>
      </div>
    </div>
  );
}

// --- アカウント変更フォーム ---

function ChangeAccountSection() {
  const {
    subscribe,
    reset,
    control,
    trigger: formTrig,
    handleSubmit,
    formState: { isValid },
  } = useForm<changeAccountForm>({
    defaultValues: {
      currentId: '',
      currentPassword: '',
      changeId: false,
      newId: '',
      changeUserName: false,
      newUserName: '',
      changePassword: false,
      newPassword: '',
      newPasswordConfirm: '',
    },
    resolver: zodResolver(changeAccountSchema),
  });
  const [body, setBody] = useState('{}');
  const { fetch, data, error } = useClientFetch(changeAccountStore);

  const [changeId, changeUserName, changePassword] = useWatch({
    control,
    name: ['changeId', 'changeUserName', 'changePassword'],
  });

  const onSubmit = () => fetch({ ...POST_HEADER, method: 'PUT', body });

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ values }) => setBody(sanitizeJsonStringify(values)),
    });
    return () => unsubscribe();
  }, [subscribe]);

  useEffect(() => {
    formTrig();
  }, [body]);

  // 成功時にフォームリセット
  useEffect(() => {
    if ((data.put as { result?: boolean } | undefined)?.result) reset();
  }, [data.put]);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <SectionHeader title="アカウント情報変更" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <ul className="list-none space-y-3">
          <li>
            <ResultMessage
              success={!!(data.put as { result?: boolean } | undefined)?.result}
              error={error.put?.detail}
            />
          </li>
          <li>
            <TextFieldRHF
              required
              name="currentId"
              pattern="^[a-zA-Z0-9]+$"
              autoComplete="username"
              control={control}
              id="account-current-id"
              placeholder="現在のID"
              isBottomSpace={true}
            />
          </li>
          <li>
            <TextFieldRHF
              required
              name="currentPassword"
              pattern="^[\x00-\x7F]+$"
              autoComplete="current-password"
              control={control}
              type="password"
              id="account-current-password"
              placeholder="現在のパスワード"
              isBottomSpace={true}
            />
          </li>
          <li className="space-y-2">
            <p className="text-sm font-medium text-gray-600">変更する項目を選択</p>
            <Controller
              name="changeUserName"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  id="check-change-user-name"
                  label="ユーザー名を変更する"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <ExpandableFields show={changeUserName}>
              <TextFieldRHF
                name="newUserName"
                autoComplete="off"
                control={control}
                id="new-user-name"
                placeholder="新しいユーザー名"
                isBottomSpace={true}
              />
            </ExpandableFields>
            <Controller
              name="changeId"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  id="check-change-id"
                  label="ユーザーIDを変更する"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <ExpandableFields show={changeId}>
              <TextFieldRHF
                name="newId"
                pattern="^[a-zA-Z0-9]+$"
                autoComplete="off"
                control={control}
                id="new-id"
                placeholder="新しいユーザーID"
                isBottomSpace={true}
              />
            </ExpandableFields>
            <Controller
              name="changePassword"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  id="check-change-password"
                  label="パスワードを変更する"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <ExpandableFields show={changePassword}>
              <TextFieldRHF
                name="newPassword"
                pattern="^[\x00-\x7F]+$"
                autoComplete="new-password"
                control={control}
                type="password"
                id="new-password"
                placeholder="新しいパスワード"
                isBottomSpace={true}
              />
              <TextFieldRHF
                name="newPasswordConfirm"
                pattern="^[\x00-\x7F]+$"
                autoComplete="new-password"
                control={control}
                type="password"
                id="new-password-confirm"
                placeholder="新しいパスワード（確認）"
                isBottomSpace={true}
              />
            </ExpandableFields>
          </li>
          <li className="flex justify-end">
            <Button disabled={!isValid} type="submit" icons={<IoSendSharp />}>
              変更を保存
            </Button>
          </li>
        </ul>
      </form>
    </section>
  );
}

// --- アカウント削除セクション ---

function DeleteAccountSection() {
  const {
    subscribe,
    control,
    trigger: formTrig,
    handleSubmit,
    formState: { isValid },
  } = useForm<deleteAccountForm>({
    defaultValues: { currentId: '', currentPassword: '' },
    resolver: zodResolver(deleteAccountSchema),
  });
  const [body, setBody] = useState('{}');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();
  const { fetch, data, error } = useClientFetch(deleteAccountStore);

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ values }) => setBody(sanitizeJsonStringify(values)),
    });
    return () => unsubscribe();
  }, [subscribe]);

  useEffect(() => {
    formTrig();
  }, [body]);

  // 削除成功時にトップページへリダイレクト
  useEffect(() => {
    if ((data.delete as { result?: boolean } | undefined)?.result) {
      router.push('/');
    }
  }, [data.delete]);

  const onSubmit = () => setConfirmOpen(true);

  const executeDelete = () => {
    setConfirmOpen(false);
    fetch({ ...POST_HEADER, method: 'DELETE', body });
  };

  return (
    <section className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
      <SectionHeader title="アカウント削除（島の放棄）" />
      <p className="mb-4 text-sm text-gray-600">
        アカウントを削除すると、島のデータはすべて失われます。この操作は取り消せません。
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ul className="list-none space-y-1">
          <li>
            {error.delete && (
              <p className="mb-4 rounded-md bg-red-100 p-3 text-red-700">{error.delete.detail}</p>
            )}
          </li>
          <li>
            <TextFieldRHF
              required
              name="currentId"
              pattern="^[a-zA-Z0-9]+$"
              autoComplete="username"
              control={control}
              id="delete-account-id"
              placeholder="現在のID"
              isBottomSpace={true}
            />
          </li>
          <li>
            <TextFieldRHF
              required
              name="currentPassword"
              pattern="^[\x00-\x7F]+$"
              autoComplete="current-password"
              control={control}
              type="password"
              id="delete-account-password"
              placeholder="現在のパスワード"
              isBottomSpace={true}
            />
          </li>
          <li className="flex justify-end">
            <Button disabled={!isValid} type="submit" color="red" icons={<RiDeleteBin6Line />}>
              アカウント削除
            </Button>
          </li>
        </ul>
      </form>
      <Modal
        header="本当にアカウントを削除しますか？"
        body={
          <div className="space-y-4">
            <p className="text-gray-700">
              この操作は<span className="font-bold text-red-600">取り消すことができません。</span>
              島のデータはすべて削除されます。
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" category="outline" onClick={() => setConfirmOpen(false)}>
                キャンセル
              </Button>
              <Button type="button" color="red" onClick={executeDelete}>
                削除する
              </Button>
            </div>
          </div>
        }
        open={confirmOpen}
        openToggle={setConfirmOpen}
      />
    </section>
  );
}

// --- Passkey管理セクション ---

type PasskeyInfo = {
  credential_id: string;
  device_name: string;
  created_at: number;
};

function PasskeySection() {
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Passkey一覧を取得する */
  const loadPasskeys = async () => {
    const res = await fetch('/api/auth/passkey/list');
    if (!res.ok) return;
    const json = (await res.json()) as { passkeys: PasskeyInfo[] };
    setPasskeys(json.passkeys);
  };

  useEffect(() => {
    loadPasskeys();
  }, []);

  /** CSRFトークン付きのfetchヘルパー */
  const csrfFetch = (url: string, init: RequestInit) => {
    const csrf = getCookie('csrf-token') ?? getCookie('__Host-csrf-token') ?? '';
    const headers = new Headers(init.headers);
    headers.set('x-csrf-token', csrf);
    return fetch(url, { ...init, headers });
  };

  /**
   * フィンガープリントを生成する
   * 収集項目: UA / タイムゾーン / 言語 / CPUコア数 / 画面情報 / プラットフォーム
   * クライアント内でSHA-256ハッシュ化、生データはサーバーに送信しない
   */
  const buildFpHash = async (): Promise<string> => {
    const raw = JSON.stringify({
      ua: navigator.userAgent,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lang: navigator.language,
      cpu: navigator.hardwareConcurrency,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      platform: navigator.platform,
    });
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  /** Passkeyを登録する */
  const handleRegister = async () => {
    setStatus(null);

    // WebAuthnはSecure Context(HTTPSまたはlocalhost)でのみ利用可能
    if (!window.isSecureContext) {
      setStatus('Passkey登録にはHTTPS接続が必要です。');
      return;
    }

    if (typeof PublicKeyCredential === 'undefined') {
      setStatus('このブラウザはPasskeyに対応していません。');
      return;
    }

    const host = window.location.hostname;
    const rpId = META_DATA.RP_ID;
    const isRpMatched = host === rpId || host.endsWith(`.${rpId}`);
    if (!isRpMatched) {
      setStatus(`Passkey設定エラー: 現在のホスト(${host})とRP ID(${rpId})が一致していません。`);
      return;
    }

    setLoading(true);
    try {
      const startRes = await csrfFetch('/api/auth/passkey/register/start', { method: 'POST' });
      if (!startRes.ok) throw new Error('登録オプションの取得に失敗しました');
      const options = await startRes.json();

      const regResult = await startRegistration({ optionsJSON: options });

      const deviceName = navigator.platform || 'デバイス';
      const fpHash = await buildFpHash();
      const finishRes = await csrfFetch('/api/auth/passkey/register/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: regResult, deviceName, fpHash }),
      });

      if (finishRes.ok) {
        setStatus('Passkeyを登録しました');
        await loadPasskeys();
      } else {
        const json = (await finishRes.json()) as { error?: string };
        setStatus(json.error ?? '登録に失敗しました');
      }
    } catch (e) {
      const errorText = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      const lower = errorText.toLowerCase();

      const message = lower.includes('insecure')
        ? 'Passkey登録に失敗しました: セキュアでない接続です。HTTPSで開いて再試行してください。'
        : `Passkey登録に失敗しました: ${errorText}`;
      setStatus(message);
    } finally {
      setLoading(false);
    }
  };

  /** Passkeyを削除する */
  const handleDelete = async (credentialId: string) => {
    const res = await csrfFetch('/api/auth/passkey/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential_id: credentialId }),
    });
    if (res.ok) {
      setStatus('Passkeyを削除しました');
      await loadPasskeys();
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <SectionHeader title="Passkey管理" />
      <p className="mb-4 text-sm text-gray-600">
        指紋・顔認証などを使ったパスワードレスログインを設定できます。
      </p>
      {status && <p className="mb-3 rounded-md bg-blue-50 p-3 text-sm text-blue-700">{status}</p>}
      <ul className="mb-4 space-y-2">
        <li className="flex items-center justify-between text-sm text-gray-500">
          <span>登録済みPasskey</span>
          <span
            className={
              passkeys.length >= META_DATA.MAX_PASSKEYS
                ? 'font-semibold text-red-500'
                : 'font-semibold'
            }
          >
            {passkeys.length} / {META_DATA.MAX_PASSKEYS} 件
          </span>
        </li>
        {passkeys.length === 0 && (
          <li className="text-sm text-gray-400">登録済みのPasskeyがありません</li>
        )}
        {passkeys.map((pk) => (
          <li
            key={pk.credential_id}
            className="flex items-center justify-between rounded-md border border-gray-200 p-3"
          >
            <div className="flex items-center gap-2 text-sm">
              <TbFingerprint className="text-blue-500" size={18} />
              <span className="font-medium text-gray-800">{pk.device_name}</span>
              <span className="text-gray-400">
                {new Date(pk.created_at * 1000).toLocaleDateString('ja-JP')}
              </span>
            </div>
            <button
              type="button"
              aria-label="Passkeyを削除"
              className="flex cursor-pointer items-center gap-1 text-sm text-red-400 transition-colors hover:text-red-600"
              onClick={() => handleDelete(pk.credential_id)}
            >
              <TbFingerprintOff size={16} />
              削除
            </button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        icons={<TbFingerprint />}
        disabled={loading || passkeys.length >= META_DATA.MAX_PASSKEYS}
        onClick={handleRegister}
      >
        {loading ? '登録中...' : '新しいPasskeyを登録'}
      </Button>
    </section>
  );
}

// --- メインページ ---

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">アカウント設定</h1>
      <ChangeAccountSection />
      <PasskeySection />
      <DeleteAccountSection />
    </div>
  );
}
