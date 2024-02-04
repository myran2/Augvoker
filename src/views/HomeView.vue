<template>
    <div class="home">
        <div style="width: 100; margin: 0 auto">
            <h1>Augvoker Log Analysis Thing</h1>
            <Message severity="info">
                Damage attribution in 10.2 is still pretty wacky. Expect some inaccuracies.<br>
                You can check <a target="_blank" href="https://gist.github.com/ljosberinn/a2f08a53cfe8632a18350eea44e9da3e">this doc</a> or the <span style="font-family: monospace; font-weight: bold;">#augmentation</span> channel of the <a target="_blank" href="https://discord.gg/evoker">Evoker discord</a> for updates.
            </Message>
        </div>
        <WarcraftLogsInput @select-fight="wclFightSelected" @select-augvoker="augvokerSelected"/>
        <template v-if="fight">
            <div class="columns space-between">
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
                        :max="59"
                    ></InputNumber>
                    <InputGroupAddon>Seconds</InputGroupAddon>
                    </InputGroup>
                </div>
            </div>

            <div class="toggle-group" style="justify-content: center;">
                <InputSwitch v-model="advancedEbonMightTimings" />
                <label>Use Advanced Timings</label>
            </div>

            <div class="columns space-between">
                <EbonMightTimeSelector
                    :report-id="reportId"
                    :start-timestamp="fight.start_time"
                    :end-timestamp="fight.end_time"
                    :ebon-might-duration-seconds="ebonMightDurationSeconds"
                    :skip-time-intervals="skipTimeIntervals"
                    :augvoker="selectedAugvoker"
                    :visible="advancedEbonMightTimings"
                    @ebonMightTimingsChanged="onEbonMightTimingsUpdated"
                />
                <PrescienceTimeSelector
                    :report-id="reportId"
                    :start-timestamp="fight.start_time"
                    :end-timestamp="fight.end_time"
                    :prescience-duration="estimatedPrescienceDurationSeconds"
                    :prescience-cooldown="prescienceCooldownSeconds"
                    :skip-time-intervals="skipTimeIntervals"
                    :augvoker="selectedAugvoker"
                    :visible="advancedEbonMightTimings"
                    ref="prescienceTimeSelector"
                />
            </div>

            <Button
                :loading="loading"
                :disabled="!ebonMightCasts.length"
                @click="fillDamageDoneTable()"
                id="calculate"
                label="Calculate"
                severity="success" 
            />
        </template>

        <Message v-if="unclaimedPresciences.length > 0" severity="warn">
            Your selected Ebon Might timings will result in <strong>{{ unclaimedPresciences.length }}</strong> Presciences that will expire before you cast Ebon Might again.<br>
            One of the players from the <span style="font-family: monospace; font-weight: bold;">defaultTargets</span> line will be used.<br>
        </Message>

        <MrtNote
            :top-damagers-by-time="topDamagersByTime"
            :augvoker-name="selectedAugvoker ? selectedAugvoker.name : 'YOUR_NAME_HERE'"
            :unclaimed-presciences="unclaimedPresciences"
        />

        <EbonMightDamageTable
            :topDamagersByTime="topDamagersByTime"
        />
    </div>
</template>

<style scoped>
  .home {
    width: 100%;
    display: flex;
    flex-flow: row wrap;
    row-gap: 20px;

    h1 {
      text-align: center;
      width: 100%;
    }

    .p-message {
        width: 100%;
    }
  }
#calculate {
    width: 100%;
}
</style>
  
<script lang="ts">
import { defineComponent, ref } from 'vue'
import WarcraftLogsInput, { type SelectFightPayload } from '@/components/WarcraftLogsInput.vue';
import WarcraftLogsDamageDoneService from '@/services/WarcraftLogsDamageDoneService';
import BossSettingsService from '@/services/BossSettingsService';
import SkipIntervalSelector from '@/components/SkipIntervalSelector.vue';
import EbonMightTimeSelector from '@/components/EbonMightTimeSelector.vue';
import PrescienceTimeSelector from '@/components/PrescienceTimeSelector.vue';
import MrtNote from '@/components/MrtNote.vue';
import EbonMightDamageTable from '@/components/EbonMightDamageTable.vue';
import type WarcraftLogsFight from '@/types/WarcraftLogsFight';
import type WarcraftLogsFriendly from '@/types/WarcraftLogsFriendly';
import type FightLocalizedTimeRange from "@/types/FightLocalizedTimeRange";
import type TimeRangeMiliseconds from "@/types/TimeRangeMiliseconds";
import type WarcraftLogsDamageDoneResponse from '@/types/WarcraftLogsDamageDoneResponse';
import type { Damager } from '@/types/Damager';
import type { DamagerInterval } from '@/types/DamagerInterval';
import DamageTargetOptions from "@/types/DamageTargetOptions";
import { BlacklistedAbilities } from '@/constants/BlacklistedAbilities';
import { secondsToTime, getColor, formatDamageNumber } from '@/helpers/Format';
import Button from 'primevue/button';
import Message from 'primevue/message';
import InputSwitch from 'primevue/inputswitch';
import InputNumber from 'primevue/inputnumber';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';

const prescienceTimeSelector = ref<InstanceType<typeof PrescienceTimeSelector>>();

export default defineComponent({
    name: 'HomeView',
    components: {
        WarcraftLogsInput,
        SkipIntervalSelector,
        EbonMightTimeSelector,
        PrescienceTimeSelector,
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
        damageTarget: DamageTargetOptions,
        advancedEbonMightTimings: boolean,
        ebonMightDurationSeconds: number,
        skipTimeIntervals: FightLocalizedTimeRange[],
        ebonMightCasts: FightLocalizedTimeRange[],
        topDamagersByTime: Array<DamagerInterval>,
        unclaimedPresciences: Array<FightLocalizedTimeRange>
        tableValues: Array<Object>,
        loading: boolean,
        mrtNote: string,
        damagersPerEbonMight: number,
        prescienceCooldownSeconds: number,
        estimatedPrescienceDurationSeconds: number,
        selectedAugvoker: WarcraftLogsFriendly|null,
        presciencePrecast: boolean,
    } {
        return {
            reportId: '',
            fight: null,
            damageTarget: DamageTargetOptions.BossOnly,
            advancedEbonMightTimings: false,
            ebonMightDurationSeconds: 27,
            skipTimeIntervals: [],
            ebonMightCasts: [],
            topDamagersByTime: [],
            unclaimedPresciences: [],
            tableValues: [],
            loading: false,
            mrtNote: "",
            damagersPerEbonMight: 3,
            prescienceCooldownSeconds: 11,
            estimatedPrescienceDurationSeconds: 22,
            selectedAugvoker: null,
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
            this.damageTarget = payload.damageTarget;
            this.skipTimeIntervals = [];
            this.mrtNote = "";
            this.tableValues = [];
            this.topDamagersByTime = [];
            this.unclaimedPresciences = [];

            // prefill some mythic fight skip intervals
            if (this.fight) {
                this.skipTimeIntervals = BossSettingsService.getDefaultSkipTimes(this.fight.boss);
            }
        },

        augvokerSelected(payload: WarcraftLogsFriendly) {
            if (!payload) {
                return;
            }
            this.selectedAugvoker = payload;
        },

        async storeTopDamagersForInterval(interval: TimeRangeMiliseconds, storage: Array<DamagerInterval>): Promise<any> {
            return WarcraftLogsDamageDoneService.get(
                this.reportId,
                interval,
                BlacklistedAbilities,
                this.damageTarget,
                BossSettingsService.getEssentialTargets(this.fight!.boss)
            )
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

        fillDamageDoneTable() {
            if (!this.fight) {
                return;
            }

            this.loading = true;
            this.topDamagersByTime = [];
            let damageDoneRequests: Promise<any>[] = [];

            let ebonMightTimings: TimeRangeMiliseconds[] = this.ebonMightCasts.map((interval) => {
                return {
                    start: this.fight!.start_time + (interval.start * 1000),
                    end: this.fight!.start_time + (interval.end * 1000)
                };
            });

            ebonMightTimings.forEach((interval) => {
                // interval starts after the fight ends - skip
                if (interval.start > this.fight!.end_time) {
                    return;
                }
                // interval ends after the fight ends - clamp end to fight end
                if (interval.end > this.fight!.end_time) {
                    damageDoneRequests.push(this.storeTopDamagersForInterval({start: interval.start, end: this.fight!.end_time}, this.topDamagersByTime));
                    return;
                }

                damageDoneRequests.push(this.storeTopDamagersForInterval(interval, this.topDamagersByTime));
            });

            const fightTimeSeconds = (this.fight.end_time - this.fight.start_time) / 1000;
            Promise.all(damageDoneRequests).then(results => {
                this.topDamagersByTime.sort((a, b) => {
                    return a.start - b.start;
                });

                this.unclaimedPresciences = (this.$refs.prescienceTimeSelector as typeof PrescienceTimeSelector).assignPrescienceTimes(this.topDamagersByTime);
                this.loading = false;
            });
        },

        onEbonMightTimingsUpdated(payload: FightLocalizedTimeRange[]) {
            this.ebonMightCasts = payload;
        },
    },
})
</script>
