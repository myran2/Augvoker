<template>
    <div class="home">
        <h1>Augvoker Log Analysis Thing</h1>
        <WarcraftLogsInput @select-fight="wclFightSelected" />
        <template v-if="fight">
            <TimeSelector 
                :durationSeconds="fight.end_time - fight.start_time" 
                :skipTimeIntervals="skipTimeIntervals"
            />

            <div>
                <Button id="calculate" label="Calculate" severity="success" :loading="loading" @click="fillDamageDoneTable()"/>
            </div>
        </template>

        <div class="mrt-note" v-if="mrtNote">
            <h2>MRT Note</h2>
            <Textarea v-model="mrtNote" cols="100" autoResize />
        </div>

        <div v-if="tableValues.length > 0" class="damage-done-table">
            <DataTable stripedRows :value="tableValues">
                <Column field="timeRange" header="Time"></Column>
                <Column field="player1" header="Player - Damage"></Column>
                <Column field="player2" header="Player - Damage"></Column>
                <Column field="player3" header="Player - Damage"></Column>
                <Column field="player4" header="Player - Damage"></Column>
            </DataTable>
        </div>
    </div>
</template>

<style scoped>
.home {
    #calculate {
        width: 100%;
    }

    .mrt-note {
        padding-top: 3%;
        textarea {
            width: 100%;
        }
    }

    .damage-done-table {
        padding-top: 3%;
    }
}
</style>
  
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
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

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
        DataTable,
        Column,
    },
    data() : {
        reportId: string,
        fight: WarcraftLogsFight | null
        bossOnly: boolean,
        timeInterval: number,
        skipTimeIntervals: TimeIntervalSeconds[],
        topDamagersByTime: DamagerInterval[],
        tableValues: Array<Object>,
        ignoreSpellIds: Array<Number>,
        loading: boolean,
        mrtNote: string
    } {
        return {
            'reportId': '',
            'fight': null,
            'bossOnly': true,
            timeInterval: 30,
            skipTimeIntervals: [{start: 0, end: 0}],
            topDamagersByTime: [],
            tableValues: [],
            loading: false,
            mrtNote: "",
            ignoreSpellIds: [
                402583, // Beacon to the Beyond (An'shuul, the Cosmic Wanderer)
                408671, // Dragonfire Bomb Dispenser
                408682, // Dragonfire Bomb Dispenser
                401324, // Pocket Anvil (Echoed Flare)
                401306, // Pocket Anvil (Anvil Strike)
                401422, // Vessel of Searing Shadow (Shadow Spike)
                401428, // Vessel of Searing Shadow (Ravenous Shadowflame)
                418774, // Mirror of Fractured Tomorrows ()
                418588, // Mirror of Fractured Tomorrows (Sand Cleave)
                419591, // Mirror of Fractured Tomorrows (Auto Attack)
                418607, // Mirror of Fractured Tomorrows (Sand Bolt)
                406251, // Roiling Shadowflame
                400223, // Thorns of Iron
                322109, // Touch of Death
                124280, // Touch of Karma
                184689, // Shield of Vengeance
                379403, // Toxic Thorn Footwraps (Launched Thorns)
                408791, // Ashkandur, Fall of the Brotherhood
                378423, // Slimy Expulsion Boots (Coated in Slime)
                378426, // Slimy Expulsion Boots boots (Corrosive Slime)
                381006, // Acidic Hailstone Treads (Deep Chill)
                381700, // Forgestorm (Forgestorm Ignited)
                406764, // Shadowflame Wreathe
                394453, // Broodkeeper's Blaze
                370794, // Unstable Frostfire Belt (Lingering Frostspark)
                408836, // Djaruun, Pillar of the Elder Flame
                408815, // Djaruun, Pillar of the Elder Flame
                381475, // Erupting Spear Fragment
                281721, // Bile-Stained Crawg Tusks (Vile Bile)
                214397, // Mark of Dargrul (Landslide)
            ],
        };
    },
    methods: {
        wclFightSelected(payload: SelectFightPayload) {
            this.reportId = payload.reportId;
            this.fight = payload.fight;
            this.bossOnly = payload.bossOnly;
            this.skipTimeIntervals = [];
            this.mrtNote = "";
            this.tableValues = [];
            this.topDamagersByTime = [];

            if (this.fight && this.fight.name == "Scalecommander Sarkareth") {
                // Prefill skip intervals for P1->P2 and P2->P3 intermissions by default.
                this.skipTimeIntervals = [{ start: 105, end:135 }, { start: 235, end: 255 }];
            }
        },

        async storeTopDamagersForInterval(start: number, end: number): Promise<any> {
            let trinketFilter = `ability.id NOT IN (${this.ignoreSpellIds.join(', ')})`;
            return WarcraftLogsDamageDoneService.get(this.reportId, start, end, this.bossOnly, trinketFilter)
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
            const sec = Math.floor(seconds % 60);
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

                if (interval.damagers.length < 2) {
                    return;
                }

                let firstName = this.colorize(interval.damagers[1].name, interval.damagers[1].class);
                let secondName = this.colorize(interval.damagers[0].name, interval.damagers[0].class);
                mrtLines.push(`${timeStr} - ${firstName} ${secondName}`);
            })

            mrtLines.push('prescGlowsEnd');
            this.mrtNote = mrtLines.join('\n');
        },

        formatDamagersForPresentation() {
            this.tableValues = [];
            this.topDamagersByTime.forEach((row: DamagerInterval) => {
                if (row.damagers.length < 4) {
                    return;
                }

                this.tableValues.push({
                    timeRange: `${this.secondsToTime(row.start)} - ${this.secondsToTime(row.end)}`,
                    player1: `${row.damagers[0].name} - ${row.damagers[0].damage.toLocaleString(undefined)}`,
                    player2: `${row.damagers[1].name} - ${row.damagers[1].damage.toLocaleString(undefined)}`,
                    player3: `${row.damagers[2].name} - ${row.damagers[2].damage.toLocaleString(undefined)}`,
                    player4: `${row.damagers[3].name} - ${row.damagers[3].damage.toLocaleString(undefined)}`,
                });
            });
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
                const startTimestamp = fightStartTime + (start * 1000);
                const endTimestamp = Math.min(fightEndTime, fightStartTime + (end * 1000));

                damageDoneRequests.push(this.storeTopDamagersForInterval(startTimestamp, endTimestamp));

                start = end
                end += this.timeInterval;

                this.skipTimeIntervals.forEach(interval => {
                    if (interval.start === interval.end) {
                        return;
                    }

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
                this.topDamagersByTime.sort((a, b) => {
                    return a.start - b.start;
                });

                this.makeMrtNote();

                this.formatDamagersForPresentation();

                this.loading = false;
            });
        }
    }
})
</script>
  