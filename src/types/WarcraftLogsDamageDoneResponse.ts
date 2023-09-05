export default interface WarcraftLogsDamageDoneResponse {
    data: {
        entries: {
            name: string;
            total: number;
            icon: string;
        }[];
        gameVersion: number;
        logVersion: number;
        totalTime: number;
    }
}
