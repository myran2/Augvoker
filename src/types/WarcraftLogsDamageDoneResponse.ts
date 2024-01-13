export default interface WarcraftLogsDamageDoneResponseEntry {
    name: string;
    total: number;
    icon: string;
}

export default interface WarcraftLogsDamageDoneResponse {
    data: {
        entries: WarcraftLogsDamageDoneResponseEntry[];
        gameVersion: number;
        logVersion: number;
        totalTime: number;
    }
}
