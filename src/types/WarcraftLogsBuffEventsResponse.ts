export default interface WarcraftLogsBuffEventssResponse {
    data: {
        events: {
            ability: {
                abilityIcon: string,
                guid: number,
                name: string,
                type: number,
            },
            fight: number,
            sourceID: number,
            sourceIsFriendly: boolean,
            targetID: number,
            targetIsFriendly: boolean,
            timestamp: number,
            type: string,
        }[];
        count: number;
    }
}
