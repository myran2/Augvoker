import type WarcraftLogsFight from "./WarcraftLogsFight";
import type WarcraftLogsFriendly from "./WarcraftLogsFriendly";

export default interface WarcraftLogsReportResponse {
    data: {
        lang: string;
        fights: WarcraftLogsFight[];
        friendlies: WarcraftLogsFriendly[];
    }
}
  