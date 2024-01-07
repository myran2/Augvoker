import http from "@/http-common";

class WarcraftLogsBuffsService {
  get(reportId: string, segmentStart: number, segmentEnd: number, abilityId: number): Promise<any> {
    let request:string = `/buffs/?reportId=${reportId}&start=${segmentStart}&end=${segmentEnd}&abilityId=${abilityId}`;
    return http.get(request);
  }
}

export default new WarcraftLogsBuffsService();
