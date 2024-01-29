import http from "@/http-common";
import type TimeRangeMiliseconds from "@/types/TimeRangeMiliseconds";
import DamageTargetOptions from "@/types/DamageTargetOptions";

class WarcraftLogsDamageDoneService {
  get(reportId: string, segment: TimeRangeMiliseconds, abilitiyBlacklist: Number[], damageTarget: DamageTargetOptions, essentialNpcIds?: Number[]): Promise<any> {
    let request:string = `/damage-done/?reportId=${reportId}&start=${segment.start}&end=${segment.end}`;
    let filters:string[] = [];

    if (damageTarget === DamageTargetOptions.BossOnly) {
      request += '&targetclass=Boss';
    }
    else if (damageTarget === DamageTargetOptions.Essential) {
      if (essentialNpcIds && essentialNpcIds.length > 0) {
        filters.push(`target.id IN (${essentialNpcIds.join(', ')})`);
      } else {
        request += '&targetclass=Boss';
      }
    }

    if (abilitiyBlacklist.length > 0) {
      filters.push(`ability.id NOT IN (${abilitiyBlacklist.join(', ')})`);
    }

    if (filters.length > 0) {
      request += `&filter=${filters.join(' AND ')}`;
    }
    return http.get(request);
  }
}

export default new WarcraftLogsDamageDoneService();
