import http from "@/http-common";

class WarcraftLogsDamageDoneService {
  get(reportId: string, segmentStart: number, segmentEnd: number, bossOnly: boolean, filter: string | null = null): Promise<any> {
    let request:string = `/damage-done/?reportId=${reportId}&start=${segmentStart}&end=${segmentEnd}`;
    if (bossOnly) {
      request += '&targetclass=Boss';
    }
    if (filter) {
      request += `&filter=${filter}`;
    }
    return http.get(request);
  }
}

export default new WarcraftLogsDamageDoneService();
