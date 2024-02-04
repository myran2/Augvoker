import http from "@/http-common";
import type WarcraftLogsBuffsResponse from "@/types/WarcraftLogsBuffsResponse";
import type TimeRangeMiliseconds from "@/types/TimeRangeMiliseconds";

class WarcraftLogsBuffsService {
  get(reportId: string, segment: TimeRangeMiliseconds, abilityId: number, source: number): Promise<WarcraftLogsBuffsResponse> {
    let request:string = `/buffs/?reportId=${reportId}&start=${segment.start}&end=${segment.end}&abilityId=${abilityId}&source=${source}`;
    return http.get(request);
  }
}

export default new WarcraftLogsBuffsService();
