import http from "@/http-common";
import type WarcraftLogsReportResponse from "@/types/WarcraftLogsReportResponse";

class WarcraftLogsReportService {
    get(reportId: string): Promise<WarcraftLogsReportResponse> {
      return http.get(`/report/?reportId=${reportId}`);
    }
}

export default new WarcraftLogsReportService();
