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

            <div class="columns">
                <SkipIntervalSelector
                    :durationSeconds="fight.end_time - fight.start_time" 
                    :skipTimeIntervals="skipTimeIntervals"
                />
                <div v-if="!advancedEbonMightTimings">
                    <h2>Ebon Might Interval Duration</h2>
                    <InputGroup>
                    <InputNumber
                        v-model="ebonMightDurationSeconds"
                        :step="1"
                        :min="15"
                        :max="45"
                    ></InputNumber>
                    <InputGroupAddon>Seconds</InputGroupAddon>
                    </InputGroup>
                </div>
            </div>

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

        <MrtNote
            :top-damagers-by-time="topDamagersByTime"
            :augvoker-name="augvokerName"
            :unclaimed-presciences="unclaimedPresciences"
        />

        <Message v-if="unclaimedPresciences.length > 0" severity="warn">
            Your selected Ebon Might timings will result in <strong>{{ unclaimedPresciences.length }}</strong> Presciences that will expire before you cast Ebon Might again.<br>
            In a future update, this service will automatically choose an optimal target.<br>
            For now, one of the players from the <span style="font-family: monospace; font-weight: bold;">defaultTargets</span> line will be used.<br>
        </Message>

        <EbonMightDamageTable
            :topDamagersByTime="topDamagersByTime"
        />
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

    .columns {
        display: flex;
        flex-flow: row nowrap;
        column-gap: 50px;
    }
}
</style>
  
<script lang="ts">
import { defineComponent } from 'vue'
import WarcraftLogsInput, { type SelectFightPayload } from '@/components/WarcraftLogsInput.vue';
import WarcraftLogsDamageDoneService from '@/services/WarcraftLogsDamageDoneService';
import SkipIntervalSelector from '@/components/SkipIntervalSelector.vue';
import EbonMightTimeSelector from '@/components/EbonMightTimeSelector.vue';
import MrtNote from '@/components/MrtNote.vue';
import EbonMightDamageTable from '@/components/EbonMightDamageTable.vue';
import type WarcraftLogsFight from '@/types/WarcraftLogsFight';
import type FightLocalizedTimeRange from "@/types/FightLocalizedTimeRange";
import type TimeRangeMiliseconds from "@/types/TimeRangeMiliseconds";
import type WarcraftLogsDamageDoneResponse from '@/types/WarcraftLogsDamageDoneResponse';
import type { Damager } from '@/types/Damager';
import type { DamagerInterval } from '@/types/DamagerInterval';
import { BlacklistedAbilities } from '@/constants/BlacklistedAbilities';
import { SkipTimeIntervals } from '@/constants/SkipTimeIntervals';
import { secondsToTime, getColor, colorize, formatDamageNumber } from '@/helpers/Format';
import Button from 'primevue/button';
import Message from 'primevue/message';
import InputSwitch from 'primevue/inputswitch';
import InputNumber from 'primevue/inputnumber';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';

type PrescienceCast = {
    duration: FightLocalizedTimeRange,
    claimed: boolean,
};

export default defineComponent({
    name: 'HomeView',
    components: {
        WarcraftLogsInput,
        SkipIntervalSelector,
        EbonMightTimeSelector,
        MrtNote,
        EbonMightDamageTable,
        Button,
        Message,
        InputSwitch,
        InputGroup,
        InputGroupAddon,
        InputNumber,
    },
    data() : {
        reportId: string,
        fight: WarcraftLogsFight | null
        bossOnly: boolean,
        advancedEbonMightTimings: boolean,
        ebonMightDurationSeconds: number,
        skipTimeIntervals: FightLocalizedTimeRange[],
        ebonMightCasts: FightLocalizedTimeRange[],
        topDamagersByTime: Array<DamagerInterval>,
        unclaimedPresciences: Array<FightLocalizedTimeRange>
        tableValues: Array<Object>,
        ignoreSpellIds: number[],
        loading: boolean,
        mrtNote: string,
        damagersPerEbonMight: number,
        prescienceCooldownSeconds: number,
        estimatedPrescienceDurationSeconds: number,
        augvokerName: string,
        presciencePrecast: boolean,
    } {
        return {
            'reportId': '',
            'fight': null,
            'bossOnly': true,
            'advancedEbonMightTimings': false,
            ebonMightDurationSeconds: 27,
            skipTimeIntervals: [],
            ebonMightCasts: [],
            topDamagersByTime: [],
            unclaimedPresciences: [],
            tableValues: [],
            loading: false,
            mrtNote: "",
            ignoreSpellIds: BlacklistedAbilities,
            damagersPerEbonMight: 3,
            prescienceCooldownSeconds: 11,
            estimatedPrescienceDurationSeconds: 22,
            augvokerName: '',
            presciencePrecast: false,
        };
    },
    methods: {
        getColor,
        formatDamageNumber,
        secondsToTime,

        wclFightSelected(payload: SelectFightPayload) {
            this.reportId = payload.reportId;
            this.fight = payload.fight;
            this.bossOnly = payload.bossOnly;
            this.skipTimeIntervals = [];
            this.mrtNote = "";
            this.tableValues = [];
            this.topDamagersByTime = [];
            this.unclaimedPresciences = [];

            // prefill some mythic fight skip intervals
            if (this.fight) {
                this.skipTimeIntervals = SkipTimeIntervals[this.fight.boss] ?? [];
            }
        },

        augvokerSelected(payload: string) {
            this.augvokerName = payload;
        },

        // TODO: run this again with only the blacklisted abilities, but cut everything by 50 (to account for damage gained by the vers buff)%
        async storeTopDamagersForInterval(interval: TimeRangeMiliseconds, storage: Array<DamagerInterval>): Promise<any> {
            const abilityBlacklist = `ability.id NOT IN (${this.ignoreSpellIds.join(', ')})`;
            return WarcraftLogsDamageDoneService.get(this.reportId, interval.start, interval.end, this.bossOnly, abilityBlacklist)
            .then((response: WarcraftLogsDamageDoneResponse) => {
                const sortedPlayers = response.data.entries.sort((a, b) => {
                    if (a.icon == 'Evoker-Augmentation') {
                        return 1;
                    }
                    if (b.icon == 'Evoker-Augmentation') {
                        return -1;
                    }

                    return b.total - a.total;
                });

                let damagersByTime:DamagerInterval = {
                    start: (interval.start - this.fight!.start_time) / 1000,
                    end: (interval.end - this.fight!.start_time) / 1000,
                    damagers: sortedPlayers.slice(0, 4).map(player => {
                        return {
                            name: player.name,
                            class: player.icon.split('-')[0],
                            damage: player.total,
                            prescTimestamp: null,
                        } as Damager;
                    })
                }

                storage.push(damagersByTime);
            })
            .catch((e: Error) => {
                console.error(e);
            });
        },

        getGoodColorizedPrescienceTarget(prescienceCast: FightLocalizedTimeRange): string {
            let targetName = this.augvokerName;
            let targetClass = 'evoker';

            let finalTargets = this.topDamagersByTime.map((interval: DamagerInterval) => {
                return {
                    damager: interval.damagers.slice(-1)[0],
                    start: interval.start,
                    end: interval.end,
                };
            }).filter((target) => {
                return target.start < prescienceCast.start && target.end > prescienceCast.start;
            });

            if (finalTargets.length) {
                targetName = finalTargets[0].damager.name;
                targetClass = finalTargets[0].damager.class;
            }
            return colorize(targetName, targetClass);
        },

        assignPrescienceTimes(
            topDamagersByTime: DamagerInterval[],
            skipTimeIntervals: FightLocalizedTimeRange[],
            fightEndSeconds: number,
            config: {
                presciencePrecast: boolean,
                estimatedPrescienceDurationSeconds: number,
                prescienceCooldownSeconds: number,
        }): FightLocalizedTimeRange[] {
            // fill in the first of 2 on-pull prescience casts.
            // if precasting prescience, this one will be a double duration.
            let possiblePrescienceCasts: PrescienceCast[] = [
                {
                    duration: {
                        start: 1,
                        end: config.estimatedPrescienceDurationSeconds * (config.presciencePrecast ? 2 : 1),
                    },
                    claimed: false,
                }
            ];

            let prescTimestamp: number = 2;
            let prescCastCount: number = config.presciencePrecast ? 3 : 1;
            while (prescTimestamp < fightEndSeconds) {
                skipTimeIntervals.forEach((interval: FightLocalizedTimeRange) => {
                    // presc cast takes place during a skipped interval (forced downtime)
                    if (prescTimestamp > interval.start && prescTimestamp < interval.end) {
                        let timeDiffSeconds: number = interval.end - prescTimestamp;
                        prescTimestamp = interval.end;

                        // we gained a prescience charge during the downtime
                        if (timeDiffSeconds >= config.prescienceCooldownSeconds) {
                            prescCastCount++;
                            possiblePrescienceCasts.push({
                                duration: {
                                    start: prescTimestamp,
                                    end: prescTimestamp + (config.estimatedPrescienceDurationSeconds * (prescCastCount % 3 === 0 ? 2 : 1))
                                },
                                claimed: false
                            });
                        }
                    }
                })

                prescCastCount++;
                possiblePrescienceCasts.push({
                    duration: {
                        start: prescTimestamp,
                        end: prescTimestamp + (config.estimatedPrescienceDurationSeconds * (prescCastCount % 3 === 0 ? 2 : 1))
                    },
                    claimed: false
                });
                prescTimestamp += config.prescienceCooldownSeconds;
            }

            topDamagersByTime.forEach((interval: DamagerInterval) => {
                let damagerIndex: number = 0;

                possiblePrescienceCasts.filter((cast) => {
                    // find prescience casts that:
                    //  are unclaimed
                    //  start before this EM cast
                    //  buff ends after this EM cast
                    return !cast.claimed 
                        && cast.duration.end > interval.start
                        && cast.duration.start < interval.start;
                }).sort((a: PrescienceCast, b: PrescienceCast) => {
                    // sort casts by how close presc is to falling off when we cast EM.
                    // we want higher damage players to have the longer presc duration so we lose less damage if we mess up somewhere.
                    return (b.duration.end - interval.start) - (a.duration.end - interval.start);
                }).forEach((cast: PrescienceCast) => {
                    if (damagerIndex >= interval.damagers.length) {
                        return;
                    }
                    cast.claimed = true;
                    interval.damagers[damagerIndex].prescTimestamp = cast.duration.start;
                    damagerIndex++;
                });
            });

            return possiblePrescienceCasts.filter((cast: PrescienceCast) => {
                return !cast.claimed;
            }).map((cast: PrescienceCast) => {
                return cast.duration;
            });
        },

        generateEbonMightTimings(): TimeRangeMiliseconds[] {
            let timings: TimeRangeMiliseconds[] = [];

            const fightStartTime = this.fight!.start_time;
            const fightEndTime = this.fight!.end_time;

            let start = 5;
            let end = start + this.ebonMightDurationSeconds;
            while (start < (fightEndTime - fightStartTime) / 1000) {
                const startTimestamp = fightStartTime + (start * 1000);
                const endTimestamp = Math.min(fightEndTime, fightStartTime + (end * 1000));
                timings.push({
                    start: startTimestamp,
                    end: endTimestamp
                });

                start = end
                end += this.ebonMightDurationSeconds;

                this.skipTimeIntervals.forEach(interval => {
                    if (interval.start === interval.end) {
                        return;
                    }

                    // current interval starts inside of a skipped interval:
                    // change start to end of skipped interval
                    if (interval.start <= start && start <= interval.end) {
                        start = interval.end;
                        end = start + this.ebonMightDurationSeconds;
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

            const fightTimeSeconds = (this.fight.end_time - this.fight.start_time) / 1000;

            this.loading = true;
            this.topDamagersByTime = [];
            let damageDoneRequests: Promise<any>[] = [];

            let ebonMightTimings: TimeRangeMiliseconds[] = [];

            if (this.advancedEbonMightTimings) {
                ebonMightTimings = this.ebonMightCasts.map((interval) => {
                    return {
                        start: this.fight!.start_time + (interval.start * 1000),
                        end: this.fight!.start_time + (interval.end * 1000)
                    };
                });
            } else {
                ebonMightTimings = this.generateEbonMightTimings();
            }

            ebonMightTimings.forEach((interval) => {
                damageDoneRequests.push(this.storeTopDamagersForInterval(interval, this.topDamagersByTime));
            });

            Promise.all(damageDoneRequests).then(results => {
                this.topDamagersByTime.sort((a, b) => {
                    return a.start - b.start;
                });

                this.unclaimedPresciences = this.assignPrescienceTimes(this.topDamagersByTime, this.skipTimeIntervals, fightTimeSeconds, {
                    presciencePrecast: this.presciencePrecast,
                    estimatedPrescienceDurationSeconds: this.estimatedPrescienceDurationSeconds,
                    prescienceCooldownSeconds: this.prescienceCooldownSeconds,
                });

                this.loading = false;
            });
        },

        onEbonMightTimingsUpdated(payload: FightLocalizedTimeRange[]) {
            this.ebonMightCasts = payload;
        }
    },
})
</script>
