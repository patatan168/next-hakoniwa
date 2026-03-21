export function isOwnIslandSelectedInSelect(targetIslandUuid: string, ownIslandUuid: string) {
  return ownIslandUuid !== '' && targetIslandUuid === ownIslandUuid;
}

export function shouldSyncSelectedIslandFromSelect({
  targetIslandUuid,
  previousTargetIslandUuid,
}: {
  targetIslandUuid: string;
  previousTargetIslandUuid: string;
}) {
  return targetIslandUuid !== '' && targetIslandUuid !== previousTargetIslandUuid;
}

export function resolveOtherIslandFallback({
  lastOtherIslandUuid,
  firstOtherIslandUuid,
  ownIslandUuid,
}: {
  lastOtherIslandUuid: string;
  firstOtherIslandUuid: string;
  ownIslandUuid: string;
}) {
  return lastOtherIslandUuid || firstOtherIslandUuid || ownIslandUuid;
}
