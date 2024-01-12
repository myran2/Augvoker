<template>
    <div class="home">
        <h1>Augvoker Log Analysis Thing</h1>
        <Message severity="info">
            Damage attribution in 10.2 is still pretty wacky. Expect some inaccuracies.<br>
            You can check <a target="_blank" href="https://gist.github.com/ljosberinn/a2f08a53cfe8632a18350eea44e9da3e">this doc</a> or the <span style="font-family: monospace; font-weight: bold;">#augmentation</span> channel of the <a target="_blank" href="https://discord.gg/evoker">Evoker discord</a> for updates.
        </Message>
        <WarcraftLogsInput @select-fight="wclFightSelected" @select-augvoker="augvokerSelected"/>
        <template v-if="fight">
            <div class="advanced-ebon-might-timings-toggle">
                <InputSwitch v-model="advancedEbonMightTimings" />
                <label>Advanced Ebon Might Timings</label>
            </div>

            <EbonMightTimeSelector v-if="advancedEbonMightTimings"
                :report-id="reportId"
                :start-timestamp="fight.start_time"
                :end-timestamp="fight.end_time"
                :augvokerName="augvokerName"
                @ebonMightTimingsChanged="onEbonMightTimingsUpdated"
            />

            <SkipIntervalSelector v-else
                :durationSeconds="fight.end_time - fight.start_time" 
                :skipTimeIntervals="skipTimeIntervals"
                :timeInterval="timeInterval"
                @updateTimeInterval="onTimeIntervalUpdate"
            />

            <div>
                <Button
                    :loading="loading"
                    :disabled="(advancedEbonMightTimings && !ebonMightCasts.length) || augvokerName == ''"
                    @click="fillDamageDoneTable()"
                    id="calculate"
                    label="Calculate"
                    severity="success" 
                />
            </div>
        </template>

        <div class="mrt-note" v-if="mrtNote">
            <h2>MRT Note</h2>
            <span>Intended for use with <a target="_blank" href="https://wago.io/yrmx6ZQSG">this WeakAura</a>.</span><br>
            <span>Ebon Might Reminders are formatted for use with <a target="_blank" href="https://wago.io/n7l5uN3YM">Kaze's MRT WeakAura.</a></span>
            <Textarea v-model="mrtNote" readonly cols="100" autoResize />
        </div>

        <div v-if="tableValues.length > 0" class="damage-done-table">
            <DataTable stripedRows :value="tableValues">
                <Column field="timeRange" header="Time"></Column>
                <Column field="player1" header="Player - Damage">
                    <template #body="slotProps">
                        <span :style="{'color': getColor(slotProps.data.player1.class)}">{{ slotProps.data.player1.name }}</span>
                        - 
                        {{ formatDamageNumber(slotProps.data.player1.damage) }}
                    </template>
                </Column>
                <Column field="player2" header="Player - Damage">
                    <template #body="slotProps">
                        <span :style="{'color': getColor(slotProps.data.player2.class)}">{{ slotProps.data.player2.name }}</span>
                        -
                        {{ formatDamageNumber(slotProps.data.player2.damage) }}
                    </template>
                </Column>
                <Column field="player3" header="Player - Damage">
                    <template #body="slotProps">
                        <span :style="{'color': getColor(slotProps.data.player3.class)}">{{ slotProps.data.player3.name }}</span>
                        -
                        {{ formatDamageNumber(slotProps.data.player3.damage) }}
                    </template>
                </Column>
                <Column field="player4" header="Player - Damage">
                    <template #body="slotProps">
                        <span :style="{'color': getColor(slotProps.data.player4.class)}">{{ slotProps.data.player4.name }}</span>
                        -
                        {{ formatDamageNumber(slotProps.data.player4.damage) }}
                    </template>
                </Column>
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
import EbonMightTimeSelector from '@/components/EbonMightTimeSelector.vue';
import type WarcraftLogsFight from '@/types/WarcraftLogsFight';
import type FightLocalizedTimeRange from "@/types/FightLocalizedTimeRange";
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
        EbonMightTimeSelector,
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
        skipTimeIntervals: FightLocalizedTimeRange[],
        ebonMightCasts: FightLocalizedTimeRange[],
        topDamagersByTime: DamagerInterval[],
        tableValues: Array<Object>,
        ignoreSpellIds: number[],
        loading: boolean,
        mrtNote: string,
        damagersPerEbonMight: number,
        prescienceCooldownSeconds: number,
        augvokerName: string,
    } {
        return {
            'reportId': '',
            'fight': null,
            'bossOnly': true,
            'advancedEbonMightTimings': false,
            timeInterval: 30,
            skipTimeIntervals: [],
            ebonMightCasts: [],
            topDamagersByTime: [],
            tableValues: [],
            loading: false,
            mrtNote: "",
            ignoreSpellIds: BlacklistedAbilities,
            damagersPerEbonMight: 3,
            prescienceCooldownSeconds: 11,
            augvokerName: '',
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

        augvokerSelected(payload: string) {
            this.augvokerName = payload;
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
                console.error(e);
            });
        },

        secondsToTime(seconds: number): string {
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        },

        formatThousands(number: number): string {
            // If env variable LOCALE is set, use that locale for formatting.
            return Math.round(number || 0).toLocaleString("en");
        },

        formatDamageNumber(number: number): string {
            if (number > 1000000) {
                return `${(number / 1000000).toFixed(2)}m`;
            }
            if (number > 10000) {
                return `${Math.round(number / 1000)}k`;
            }
            return this.formatThousands(number);
        },

        getColor(playerClass: string): string {
            switch(playerClass.toLowerCase()) {
                case "deathknight":
                    return "#C41E3A";
                case "demonhunter":
                    return "#A330C9";
                case "druid":
                    return "#FF7C0A";
                case "evoker":
                    return "#33937F";
                case "hunter":
                    return "#AAD372";
                case "mage":
                    return "#3FC7EB";
                case "monk":
                    return "#00FF98";
                case "paladin":
                    return "#F48CBA";
                case "priest":
                    return "#FFFFFF";
                case "rogue":
                    return "#FFF468";
                case "shaman":
                    return "#0070DD";
                case "warlock":
                    return "#8788EE";
                case "warrior":
                    return "#C69B6D";
                default:
                    return "#FFFFFF";
            }
        },

        colorize(playerName: string, playerClass: string, html: boolean = false): string {
            let colorString = this.getColor(playerClass).substring(1);
            return `|cff${colorString.toLowerCase()}${playerName}|r`;
        },

        makeMrtNote(damagersPerEbonMight: number) {
            if (!this.topDamagersByTime || !this.topDamagersByTime.length) {
                return;
            }

            let mrtLines: string[] = ['prescGlowsStart'];
            let ebonMightLines: string[] = ['|cffff00ff--- Ebon Might Reminders---|r'];

            let prescCount: number = 0;
            this.topDamagersByTime.forEach((interval, index) => {
                ebonMightLines.push(`{time:${this.secondsToTime(interval.start)}}EM - ${this.colorize(this.augvokerName, 'evoker')} {spell:404269}  `);
                // 2 casts right on pull
                if (index === 0) {
                    let mrtLine: Array<string> = [];
                    interval.damagers.slice(0, 2).forEach(damager => {
                        mrtLine.push(this.colorize(damager.name, damager.class));
                    });
                    mrtLines.push(`PULL - ${mrtLine.join(' ')}`);
                    prescCount += 2;
                    return;
                }

                if (interval.damagers.length < damagersPerEbonMight) {
                    console.warn("Not enough damagers for interval:", interval);
                    return;
                }

                let prescOrder: number[] = [0, 2, 1];
                prescOrder.forEach(i => {
                    prescCount += 1;
                    const damager = interval.damagers[i];
                    const prescTimestamp: string = this.secondsToTime(((prescCount - 2) * this.prescienceCooldownSeconds) + 1);

                    mrtLines.push(`${prescTimestamp} - ${this.colorize(damager.name, damager.class)}`)
                });
            })

            mrtLines.push('prescGlowsEnd\n');
            mrtLines.push(ebonMightLines.join('\n'));
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
                    player1: row.damagers[0],
                    player2: row.damagers[1],
                    player3: row.damagers[2],
                    player4: row.damagers[3],
                });
            });
        },

        generateEbonMightTimings(): Array<[number, number]> {
            let timings: Array<[number, number]> = [];

            const fightStartTime = this.fight!.start_time;
            const fightEndTime = this.fight!.end_time;

            let start = 5;
            let end = start + this.timeInterval;
            while (start < (fightEndTime - fightStartTime) / 1000) {
                const startTimestamp = fightStartTime + (start * 1000);
                const endTimestamp = Math.min(fightEndTime, fightStartTime + (end * 1000));

                timings.push([startTimestamp, endTimestamp]);

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

            return timings;
        },

        fillDamageDoneTable() {
            if (!this.fight) {
                return;
            }

            this.loading = true;
            this.topDamagersByTime = [];
            let damageDoneRequests: Promise<any>[] = [];

            let ebonMightTimings: Array<[number, number]> = [];

            if (this.advancedEbonMightTimings) {
                ebonMightTimings = this.ebonMightCasts.map((interval) => {
                    return [
                        this.fight!.start_time + (interval.start * 1000),
                        this.fight!.start_time + (interval.end * 1000)
                    ];
                });
            } else {
                ebonMightTimings = this.generateEbonMightTimings();
            }

            ebonMightTimings.forEach((interval) => {
                damageDoneRequests.push(this.storeTopDamagersForInterval(interval[0], interval[1]));
            });

            Promise.all(damageDoneRequests).then(results => {
                this.topDamagersByTime.sort((a, b) => {
                    return a.start - b.start;
                });

                this.makeMrtNote(this.damagersPerEbonMight);

                this.formatDamagersForPresentation();

                this.loading = false;
            });
        },

        onTimeIntervalUpdate(payload: number) {
            this.timeInterval = payload;
        },

        onEbonMightTimingsUpdated(payload: FightLocalizedTimeRange[]) {
            this.ebonMightCasts = payload;
        }
    },

    watch: {
        augvokerName(newVal, oldVal) {
            if (this.loading || !this.topDamagersByTime.length) {
                return;
            }

            this.makeMrtNote(this.damagersPerEbonMight);
        }
    }
})
</script>
  