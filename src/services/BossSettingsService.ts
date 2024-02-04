import { type BossConfiguration } from "@/types/BossConfiguration";
import type FightLocalizedTimeRange from "@/types/FightLocalizedTimeRange";

const defaultSettings: { [encounterId: number] : BossConfiguration} = {
    // Scalecommander Sarkareth
    2685: {
        skipTimes: [
            // P1 -> P2 intermission
            { start: 105, end: 135 },
            // P2 -> P3 intermission
            { start: 235, end: 255 },
        ]
    },

    // Nymue
    2708: {
        essentialTargetIds: [
            206172, // Nymue
            209800, // Cycle Warden - Left/Right Intermission Adds
            213143, // Manifested Dream - Back Mythic Intermission Adds
        ]
    },

    // Tindral Sageswift
    2786: {
        skipTimes: [
            // P1 -> P2 intermission
            { start: 82, end: 120 },
            // P2 -> P3 interission
            { start: 230, end: 259 }
        ]
    },

    // Fyrakk
    2677: {
        skipTimes: [

        ],
        essentialTargetIds: [
            204931, // Fyrakk
            207796, // Burning Colossus
            214012, // Dark Colossus
        ]
    }
}

class BossDefaultSettings {
    getDefaultSkipTimes(encounterId: number): FightLocalizedTimeRange[] {
        if (!defaultSettings[encounterId]) {
            return [];
        }

        return defaultSettings[encounterId].skipTimes ?? [];
    }

    getEssentialTargets(encounterId: number): Number[] {
        if (!defaultSettings[encounterId]) {
            return [];
        }

        return defaultSettings[encounterId].essentialTargetIds ?? [];
    }
}

export default new BossDefaultSettings();
