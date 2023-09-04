import http from "@/http-common";

class WarcraftLogsDamageDoneService {
  get(reportId: string, segmentStart: number, segmentEnd: number, bossOnly: boolean): Promise<any> {
    let request:string = `/report/tables/damage-done/${reportId}?start=${segmentStart}&end=${segmentEnd}`;
    if (bossOnly) {
      request += '&targetclass=Boss';
    }
    return http.get(request);
  }
}

export default new WarcraftLogsDamageDoneService();
