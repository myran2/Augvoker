import { type TimeIntervalSeconds } from '@/components/HumanReadableTimeRange.vue';

export const SkipTimeIntervals: { [encounterId: number] : TimeIntervalSeconds[]} = {
    // Scalecommander Sarkareth
    2685: [
        // P1 -> P2 intermission
        { start: 105, end: 135 },

        // P2 -> P3 intermission
        { start: 235, end: 255 },
    ],

    // Tindral Sageswift
    2786: [
        // P1 -> P2 intermission
        { start: 82, end: 120 },

        // P2 -> P3 interission
        { start: 230, end: 259 }
    ]
};
