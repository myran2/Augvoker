import http from "@/http-common";
import type WarcraftLogsReportResponse from "@/types/WarcraftLogsReportResponse";

class WarcraftLogsReportService {
    get(reportId: string): Promise<WarcraftLogsReportResponse> {
      return http.get(`/report/fights/${reportId}`);
    }
}

export default new WarcraftLogsReportService();
