/**
 * @module PlanList.types
 * @description PlanList/PlanItemコンポーネント用の型定義。
 */
import { Plan } from '@/db/kysely';
import { CSSProperties, Ref } from 'react';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type LocalPlanItem = Plan & {
  id: number;
  edit: boolean;
};

export type PlanItemProps = {
  isChange: boolean;
  islandOptions: Array<{ label: string; value: string }>;
  item: Omit<LocalPlanItem, 'from_uuid'>;
  onUpdate: (id: number, data: Partial<LocalPlanItem>) => void;
  turn: number;
  onDelete: (id: number) => void;
  isDragged: boolean;
  /** ドラッグハンドルのpointerdownイベント */
  onPointerDown: (e: React.PointerEvent, id: number) => void;
};

export type PlanListProps = {
  ref?: Ref<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
  islandList?: { uuid: string; island_name: string }[];
  isPlanLoading: boolean;
  turn?: number;
  uuid?: string;
  initPlanData?: Array<Plan>;
};
