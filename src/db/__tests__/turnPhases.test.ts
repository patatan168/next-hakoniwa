import { describe, expect, test } from 'vitest';
import { runIslandTurnPhases } from '../turnPhases';

type TestIsland = {
  uuid: string;
  artificialMonster: number;
  seenArtificialMonster: number;
};

describe('runIslandTurnPhases', () => {
  test('後順の島から先順の島へ怪獣派遣しても同ターンの島全体イベントで反映される', () => {
    const islands: TestIsland[] = [
      { uuid: 'island-a', artificialMonster: 0, seenArtificialMonster: 0 },
      { uuid: 'island-b', artificialMonster: 0, seenArtificialMonster: 0 },
    ];

    runIslandTurnPhases({
      islands,
      randomIndices: [0, 1],
      incomeAndEatenPhase: () => undefined,
      planPhase: (island) => {
        if (island.uuid === 'island-b') {
          islands[0].artificialMonster += 1;
        }
      },
      mapScanPhase: () => undefined,
      wideIslandEventPhase: (island) => {
        island.seenArtificialMonster = island.artificialMonster;
      },
    });

    expect(islands[0].seenArtificialMonster).toBe(1);
  });
});
