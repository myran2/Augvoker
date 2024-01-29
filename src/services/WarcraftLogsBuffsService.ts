import http from "@/http-common";
import type TimeRangeMiliseconds from "@/types/TimeRangeMiliseconds";

class WarcraftLogsBuffsService {
  get(reportId: string, segment: TimeRangeMiliseconds, abilityId: number): Promise<any> {
    let request:string = `/buffs/?reportId=${reportId}&start=${segment.start}&end=${segment.end}&abilityId=${abilityId}`;
    return http.get(request);
  }
}

export default new WarcraftLogsBuffsService();
