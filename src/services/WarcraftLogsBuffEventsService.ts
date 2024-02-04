import http from "@/http-common";
import type WarcraftLogsBuffEventsResponse from "@/types/WarcraftLogsBuffEventsResponse";
import type TimeRangeMiliseconds from "@/types/TimeRangeMiliseconds";

class WarcraftLogsBuffsService {
  get(reportId: string, segment: TimeRangeMiliseconds, abilityId: number, source: number): Promise<WarcraftLogsBuffEventsResponse> {
    let request:string = `/buff-events/?reportId=${reportId}&start=${segment.start}&end=${segment.end}&abilityId=${abilityId}&source=${source}`;
    return http.get(request);
  }
}

export default new WarcraftLogsBuffsService();
