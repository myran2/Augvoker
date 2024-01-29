import type FightLocalizedTimeRange from "@/types/FightLocalizedTimeRange";

export type BossConfiguration = {
    skipTimes?: FightLocalizedTimeRange[],
    essentialTargetIds?: Number[],
}
