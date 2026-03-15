'use client';

import Button from '@/global/component/Button';
import { SelectRHF } from '@/global/component/SelectRHF';
import { TextFieldRHF } from '@/global/component/TextFieldRHF';
import { useClientFetch } from '@/global/function/fetch/clientFetch';
import { developmentSettingsStore } from '@/global/store/api/auth/developmentSettings';
import { createDevelopmentSettingsSchema } from '@/global/valid/developmentSettings';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { IoSendSharp } from 'react-icons/io5';

type Props = {
  currentIslandName?: string;
  currentIslandNamePrefix?: string;
  currentTitleType?: string;
  currentTitleName?: string;
  availableTitles?: Array<{ type: string; name: string }>;
  canChangeIslandName?: boolean;
  nextIslandNameChangeAt?: number;
  onSaved: () => void;
};

const POST_HEADER = {
  headers: { 'Content-Type': 'application/json' },
};

type DevelopmentSettingsForm = {
  islandName: string;
  islandNamePrefix: string;
  title: string;
};

const hasSaveSucceeded = (data: unknown) => !!(data as { result?: boolean } | undefined)?.result;

const getIslandNameHelperText = (
  canChangeIslandName?: boolean,
  nextIslandNameChangeAt?: number
) => {
  if (canChangeIslandName !== false || !nextIslandNameChangeAt) return undefined;
  return `${new Date(nextIslandNameChangeAt * 1000).toLocaleDateString('ja-JP')} 以降に変更できます`;
};

const canSubmitSettings = (
  currentIslandName: string,
  currentIslandNamePrefix: string,
  currentTitleType: string,
  islandName: string,
  islandNamePrefix: string,
  titleType: string,
  canChangeIslandName: boolean
) => {
  const islandNameChanged = canChangeIslandName && islandName.trim() !== currentIslandName;
  return (
    islandNameChanged ||
    islandNamePrefix.trim() !== currentIslandNamePrefix ||
    titleType !== currentTitleType
  );
};

const buildPayload = (
  values: DevelopmentSettingsForm,
  currentIslandName: string,
  currentIslandNamePrefix: string,
  currentTitleType: string,
  canChangeIslandName: boolean
) => {
  const payload: { islandName?: string; islandNamePrefix?: string; title?: string } = {};
  if (canChangeIslandName && values.islandName.trim() !== currentIslandName) {
    payload.islandName = values.islandName.trim();
  }
  if (values.islandNamePrefix.trim() !== currentIslandNamePrefix) {
    payload.islandNamePrefix = values.islandNamePrefix.trim();
  }
  if (values.title !== currentTitleType) {
    payload.title = values.title;
  }
  return payload;
};

export default function IslandSettingsPanel({
  currentIslandName,
  currentIslandNamePrefix,
  currentTitleType,
  currentTitleName,
  availableTitles,
  canChangeIslandName,
  nextIslandNameChangeAt,
  onSaved,
}: Props) {
  const { fetch, data, error, isLoading } = useClientFetch(developmentSettingsStore);
  const schema = useMemo(
    () => createDevelopmentSettingsSchema(currentIslandName ?? ''),
    [currentIslandName]
  );
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<DevelopmentSettingsForm>({
    defaultValues: {
      islandName: currentIslandName ?? '',
      islandNamePrefix: currentIslandNamePrefix ?? '',
      title: currentTitleType ?? '',
    },
    mode: 'onChange',
    resolver: zodResolver(schema),
  });
  const [islandName, islandNamePrefix, title] = useWatch({
    control,
    name: ['islandName', 'islandNamePrefix', 'title'],
  });
  const canChange = canChangeIslandName !== false;
  const helperText = getIslandNameHelperText(canChangeIslandName, nextIslandNameChangeAt);
  const saveSucceeded = hasSaveSucceeded(data.put);
  const titleOptions = useMemo(
    () => [
      { value: '', children: 'なし' },
      ...(availableTitles ?? []).map((item) => ({ value: item.type, children: item.name })),
    ],
    [availableTitles]
  );

  useEffect(() => {
    if (saveSucceeded) {
      onSaved();
    }
  }, [onSaved, saveSucceeded]);

  const canSubmit = useMemo(() => {
    return canSubmitSettings(
      currentIslandName ?? '',
      currentIslandNamePrefix ?? '',
      currentTitleType ?? '',
      islandName,
      islandNamePrefix,
      title,
      canChange
    );
  }, [
    canChange,
    currentIslandName,
    currentIslandNamePrefix,
    currentTitleType,
    islandName,
    islandNamePrefix,
    title,
  ]);

  const submitSettings = (values: DevelopmentSettingsForm) => {
    if (!canSubmit || isLoading.put) return;

    const payload = buildPayload(
      values,
      currentIslandName ?? '',
      currentIslandNamePrefix ?? '',
      currentTitleType ?? '',
      canChange
    );

    fetch({ ...POST_HEADER, method: 'PUT', body: JSON.stringify(payload) });
  };

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-xs">
        <h3 className="mb-3 text-lg font-bold text-red-900">島の設定</h3>

        {saveSucceeded && (
          <p className="mb-3 rounded-md bg-green-100 p-2 text-sm text-green-700">保存しました。</p>
        )}
        {error.put?.detail && (
          <p className="mb-3 rounded-md bg-red-100 p-2 text-sm text-red-700">{error.put.detail}</p>
        )}

        <form onSubmit={handleSubmit(submitSettings)} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-gray-700">島の名前</span>
            <TextFieldRHF
              name="islandName"
              control={control}
              id="development-island-name"
              placeholder="島の名前を入力"
              autoComplete="off"
              disabled={!canChange}
              helperText={helperText}
              isBottomSpace={true}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold text-gray-700">島名Prefix（同盟表示用）</span>
            <TextFieldRHF
              name="islandNamePrefix"
              control={control}
              id="development-island-name-prefix"
              placeholder="6文字まで"
              autoComplete="off"
              isBottomSpace={true}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold text-gray-700">表示称号</span>
            <SelectRHF
              name="title"
              control={control}
              className="w-full"
              options={titleOptions}
              isBottomSpace={true}
            />
            {currentTitleName && currentTitleName.trim() !== '' ? (
              <p className="pt-1 text-xs text-gray-500">現在: {currentTitleName}</p>
            ) : null}
          </label>

          <div className="flex justify-end">
            <Button
              disabled={!canSubmit || !isValid || !!isLoading.put}
              type="submit"
              icons={<IoSendSharp />}
            >
              保存
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
