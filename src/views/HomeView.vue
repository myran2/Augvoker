<template>
    <div class="home">
        <WarcraftLogsInput @select-fight="wclFightSelected" />
        <template v-if="fight">
            <TimeSelector :durationSeconds="fight.end_time - fight.start_time" @update-skip-interval="updateSkipTimeIntervals"/>

            <div>
                <Button label="Calculate" :loading="loading" @click="fillDamageDoneTable()"/>
            </div>
        </template>

        <template v-if="mrtNote">
                <Textarea v-model="mrtNote" cols="100" autoResize />
        </template>
    </div>
</template>
  
<script lang="ts">
import { defineComponent } from 'vue'
import WarcraftLogsInput, { type SelectFightPayload } from '@/components/WarcraftLogsInput.vue';
import WarcraftLogsDamageDoneService from '@/services/WarcraftLogsDamageDoneService';
import type WarcraftLogsDamageDoneResponse from '@/types/WarcraftLogsDamageDoneResponse';
import TimeSelector from '@/components/TimeSelector.vue';
import { type TimeIntervalSeconds } from '@/components/HumanReadableSeconds.vue';
import type WarcraftLogsFight from '@/types/WarcraftLogsFight';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';

interface WclDamager {
    name: string;
    damage: number;
    class: string;
}

interface DamagerInterval {
    start: number;
    end: number;
    damagers: WclDamager[];
}

export default defineComponent({
    name: 'HomeView',
    components: {
        WarcraftLogsInput,
        TimeSelector,
        Button,
        Textarea,
    },
    data() : {
        reportId: string,
        fight: WarcraftLogsFight | null
        bossOnly: boolean,
        timeInterval: number,
        skipTimeIntervals: TimeIntervalSeconds[],
        topDamagersByTime: DamagerInterval[],
        loading: boolean,
        mrtNote: string
    } {
        return {
            'reportId': '',
            'fight': null,
            'bossOnly': true,
            timeInterval: 30,
            skipTimeIntervals: [],
            topDamagersByTime: [],
            loading: false,
            mrtNote: ""
        };
    },
    methods: {
        wclFightSelected(payload: SelectFightPayload) {
            this.reportId = payload.reportId;
            this.fight = payload.fight;
            this.bossOnly = payload.bossOnly;
        },

        updateSkipTimeIntervals(payload: TimeIntervalSeconds[]) {
            this.skipTimeIntervals = payload;
        },

        async storeTopDamagersForInterval(start: number, end: number): Promise<any> {
            return WarcraftLogsDamageDoneService.get(this.reportId, start, end, this.bossOnly)
            .then((response: WarcraftLogsDamageDoneResponse) => {
                const sortedPlayers = response.data.entries.sort((a:any, b:any) => {
                    if (a.icon == 'Evoker-Augmentation') {
                        return 1;
                    }
                    if (b.icon == 'Evoker-Augmentation') {
                        return -1;
                    }

                    return b.total - a.total;
                });

                let damagersByTime:DamagerInterval = {
                    start: (start - this.fight!.start_time) / 1000,
                    end: (end - this.fight!.start_time) / 1000,
                    damagers: sortedPlayers.slice(0, 4).map(player => {
                        return {
                            name: player.name,
                            class: player.icon.split('-')[0],
                            damage: player.total,
                        } as WclDamager;
                    })
                }

                this.topDamagersByTime.push(damagersByTime);
            })
            .catch((e: Error) => {
                console.log(e);
            });
        },

        secondsToTime(seconds: number): string {
            const min = Math.floor(seconds / 60);
            const sec = seconds % 60;
            return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        },

        colorize(playerName: string, playerClass: string): string {
            playerClass = playerClass.toLowerCase()
            let colorString = ""
            switch(playerClass) {
                case "deathknight":
                    colorString = "C41E3A";
                    break;
                case "demonhunter":
                    colorString = "A330C9";
                    break;
                case "druid":
                    colorString = "FF7C0A";
                    break;
                case "evoker":
                    colorString = "33937F";
                    break;
                case "hunter":
                    colorString = "AAD372";
                    break;
                case "mage":
                    colorString = "3FC7EB";
                    break;
                case "monk":
                    colorString = "00FF98";
                    break;
                case "paladin":
                    colorString = "F48CBA";
                    break;
                case "priest":
                    colorString = "FFFFFF";
                    break;
                case "rogue":
                    colorString = "FFF468";
                    break;
                case "shaman":
                    colorString = "0070DD";
                    break;
                case "warlock":
                    colorString = "8788EE";
                    break;
                case "warrior":
                    colorString = "C69B6D";
                    break;
                default:
                    colorString = "FFFFFF";
                    break;
            }

            return `|cff${colorString.toLowerCase()}${playerName}|r`;
        },

        makeMrtNote() {
            if (!this.topDamagersByTime) {
                return;
            }

            let mrtLines: string[] = ['prescGlowsStart'];
            this.topDamagersByTime.forEach(interval => {
                let timeStr = this.secondsToTime(interval.start);
                if (timeStr === "00:00") {
                    timeStr = "PREPULL";
                }

                let firstName = this.colorize(interval.damagers[1].name, interval.damagers[1].class);
                let secondName = this.colorize(interval.damagers[0].name, interval.damagers[0].class);
                mrtLines.push(`${timeStr} - ${firstName} ${secondName}`);
            })

            mrtLines.push('prescGlowsEnd');
            this.mrtNote = mrtLines.join('\n');
        },

        fillDamageDoneTable() {
            if (!this.fight) {
                return;
            }

            const fightStartTime = this.fight.start_time;
            const fightEndTime = this.fight.end_time;


            this.topDamagersByTime = [];
            let start = 0;
            let end = this.timeInterval;
            this.loading = true;
            let damageDoneRequests = [];
            while (start < (fightEndTime - fightStartTime) / 1000) {
                damageDoneRequests.push(this.storeTopDamagersForInterval(fightStartTime + (start * 1000), Math.min(fightEndTime, fightStartTime + (end * 1000))));

                start = end
                end += this.timeInterval;

                this.skipTimeIntervals.forEach(interval => {
                    // current interval starts inside of a skipped interval:
                    // change start to end of skipped interval
                    if (interval.start <= start && start <= interval.end) {
                        start = interval.end;
                        end = start + this.timeInterval;
                    }

                    // current interval ends inside of a skipped interval:
                    // change end to beginning of interval.
                    if (interval.start <= end && end <= interval.end) {
                        end = interval.start;
                    }
                });
            }

            Promise.all(damageDoneRequests).then(results => {
                this.loading = false;
                this.topDamagersByTime.sort((a, b) => {
                    return a.start - b.start;
                });
                this.makeMrtNote();
            });
        }
    }
})
</script>
  