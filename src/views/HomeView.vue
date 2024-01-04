<template>
    <div class="home">
        <h1>Augvoker Log Analysis Thing</h1>
        <Message severity="info">
            Damage attribution in 10.2 is mostly fixed now. There are still a few inaccuracies, but it should be mostly fine.<br>
            You can check <a target="_blank" href="https://gist.github.com/ljosberinn/a2f08a53cfe8632a18350eea44e9da3e">this doc</a> or the <span style="font-family: monospace; font-weight: bold;">#augmentation</span> channel of the <a target="_blank" href="https://discord.gg/evoker">Evoker discord</a> for updates.
        </Message>
        <WarcraftLogsInput @select-fight="wclFightSelected" />
        <template v-if="fight">
            <div class="advanced-ebon-might-timings-toggle">
                <InputSwitch v-model="advancedEbonMightTimings" />
                <label>Advanced Ebon Might Timings</label>
            </div>

            <EbonMightTimeSelector v-if="advancedEbonMightTimings"
            />

            <SkipIntervalSelector v-else
                :durationSeconds="fight.end_time - fight.start_time" 
                :skipTimeIntervals="skipTimeIntervals"
                :timeInterval="timeInterval"
                @updateTimeInterval="onTimeIntervalUpdate"
            />

            <div>
                <Button id="calculate" label="Calculate" severity="success" :loading="loading" @click="fillDamageDoneTable()"/>
            </div>
        </template>

        <div class="mrt-note" v-if="mrtNote">
            <h2>MRT Note</h2>
            <span>Intended for use with <a target="_blank" href="https://wago.io/yrmx6ZQSG">this WeakAura</a>.</span>
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

    .advanced-ebon-might-timings-toggle {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        column-gap: 15px;
        padding-bottom: 15px;
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
import SkipIntervalSelector from '@/components/SkipIntervalSelector.vue';
import { type TimeIntervalSeconds } from '@/components/HumanReadableSeconds.vue';
import type WarcraftLogsFight from '@/types/WarcraftLogsFight';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Message from 'primevue/message';
import InputSwitch from 'primevue/inputswitch';
import { BlacklistedAbilities } from '@/constants/BlacklistedAbilities';
import { SkipTimeIntervals } from '@/constants/SkipTimeIntervals';

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
        SkipIntervalSelector,
        Button,
        Textarea,
        DataTable,
        Column,
        Message,
        InputSwitch,
    },
    data() : {
        reportId: string,
        fight: WarcraftLogsFight | null
        bossOnly: boolean,
        advancedEbonMightTimings: boolean,
        timeInterval: number,
        skipTimeIntervals: TimeIntervalSeconds[],
        topDamagersByTime: DamagerInterval[],
        tableValues: Array<Object>,
        ignoreSpellIds: Array<Number>,
        loading: boolean,
        mrtNote: string,
        damagersPerRow: number,
    } {
        return {
            'reportId': '',
            'fight': null,
            'bossOnly': true,
            'advancedEbonMightTimings': false,
            timeInterval: 30,
            skipTimeIntervals: [],
            topDamagersByTime: [],
            tableValues: [],
            loading: false,
            mrtNote: "",
            ignoreSpellIds: BlacklistedAbilities,
            damagersPerRow: 3,
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

            // prefill some mythic fight skip intervals
            if (this.fight) {
                this.skipTimeIntervals = SkipTimeIntervals[this.fight.boss] ?? [];
            }
        },

        // TODO: run this again with only the blacklisted abilities, but cut everything by 50 (to account for damage gained by the vers buff)%
        async storeTopDamagersForInterval(start: number, end: number): Promise<any> {
            const abilityBlacklist = `ability.id NOT IN (${this.ignoreSpellIds.join(', ')})`;
            return WarcraftLogsDamageDoneService.get(this.reportId, start, end, this.bossOnly, abilityBlacklist)
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

        makeMrtNote(damagersPerRow: number) {
            if (!this.topDamagersByTime) {
                return;
            }

            let mrtLines: string[] = ['prescGlowsStart'];
            this.topDamagersByTime.forEach(interval => {
                let timeStr = this.secondsToTime(interval.start);
                if (timeStr === "00:00") {
                    timeStr = "PULL";
                }

                if (interval.damagers.length < damagersPerRow) {
                    return;
                }

                let mrtLine: Array<string> = [];
                interval.damagers.slice(0, damagersPerRow).forEach(damager => {
                    mrtLine.push(this.colorize(damager.name, damager.class));
                });

                mrtLines.push(`${timeStr} - ${mrtLine.join(' ')}`);
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

                this.makeMrtNote(this.damagersPerRow);

                this.formatDamagersForPresentation();

                this.loading = false;
            });
        },

        onTimeIntervalUpdate(payload: number) {
            this.timeInterval = payload;
        }
    }
})
</script>
  