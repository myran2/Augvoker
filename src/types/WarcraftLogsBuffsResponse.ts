export default interface WarcraftLogsBuffsResponse {
    data: {
        auras: {
            name: string;
            id: number;
            totalUses: number,
            bands: {
                startTime: number,
                endTime: number,
            }[]
        }[];
        gameVersion: number;
        logVersion: number;
        totalTime: number;
    }
}
