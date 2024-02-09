import type WarcraftLogsFightPhase from '@/types/WarcraftLogsFightPhase';

export default interface WarcraftLogsFight {
    id: number;
    displayNumber?: number;
    boss: number;
    start_time: number;
    end_time: number;
    name: string;
    zoneID: string;
    zoneName: string;
    zoneDifficulty: number;
    size?: number;
    difficulty?: number;
    kill?: boolean;
    partial?: number;
    inProgress?: boolean;
    bossPercentage?: number;
    fightPercentage?: number;
    lastPhaseAsAbsoluteIndex?: number;
    lastPhaseForPercentageDisplay?: number;
    phases?: WarcraftLogsFightPhase[];
    maps?: number[];
}
