<template>
    <div class="time-selector prescience" v-if="visible">
        <div>
            <div class="header">
                <h2>Prescience Casts</h2>
            </div>
            <div class="row">
                <Button @click="sortTimings" size="small" label="Sort" severity="help"/>
                <Button v-if="augvoker" :loading="loading" :disabled="!allowCopy" @click="copyPrescienceCasts()" class="copy"
                    size="small" label="Copy From Log" />
                <Button v-else :disabled="true" size="small" severity="info">Select an Augvoker to copy their timings</Button>
            </div>
        </div>
        <div class="row">
            <div class="toggle-group">
                <InputSwitch v-model="precast" />
                <label>Precast</label>
            </div>
            <div class="toggle-group">
                <InputSwitch v-model="showEnd" />
                <label>Show Ends</label>
            </div>
        </div>
        <div class="interval-group">
            <PrescienceCastField v-for="(cast, index) in prescienceCasts" class="p-overlay-badge" :cast="cast"
                :buff-duration-seconds="prescienceDuration" :is-long-cast="isLongCast(index)" :show-end="showEnd" @remove-cast="removeCast"
                v-badge.warning="unclaimedBadge(cast)" />
            <Button class="add" size="small" label="Add" severity="secondary" outlined @click="addCast()" />
        </div>
    </div>
</template>

<style>
.p-badge:empty {
    display: none;
}
.row {
    display: flex;
    flex-flow: row nowrap;
    gap: 8px;
    justify-content: flex-start;
}
</style>

<script lang="ts">
import { type PropType, defineComponent } from "vue";
import WarcraftLogsBuffEventsService from "@/services/WarcraftLogsBuffEventsService";
import PrescienceCastField from "@/components/PrescienceCastField.vue";
import type WarcraftLogsBuffEventsResponse from "@/types/WarcraftLogsBuffEventsResponse";
import type FightLocalizedTimeRange from "@/types/FightLocalizedTimeRange";
import type WarcraftLogsFriendly from "@/types/WarcraftLogsFriendly";
import type { PrescienceCast } from "@/types/PrescienceCast";
import type { Damager, DamagerInterval } from "@/types/DamagerInterval";
import { secondsToTime } from "@/helpers/Format";
import Button from 'primevue/button';
import InputSwitch from 'primevue/inputswitch';
import InputNumber from 'primevue/inputnumber';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Badge from 'primevue/badgedirective';

export default defineComponent({
    name: "PrescienceTimeSelector",
    components: {
        PrescienceCastField,
        Button,
        InputSwitch,
        InputNumber,
        InputGroup,
        InputGroupAddon
    },
    directives: {
        Badge
    },
    props: {
        augvoker: Object as PropType<WarcraftLogsFriendly | null>,
        reportId: {
            type: String,
            required: true
        },
        startTimestamp: {
            type: Number,
            required: true
        },
        endTimestamp: {
            type: Number,
            required: true
        },
        prescienceDuration: {
            type: Number,
            required: true
        },
        prescienceCooldown: {
            type: Number,
            required: true
        },
        skipTimeIntervals: {
            type: Array<FightLocalizedTimeRange>,
            required: true
        },
        visible: {
            type: Boolean,
            required: true
        }
    },
    data(): {
        precast: boolean,
        showEnd: boolean,
        prescienceCasts: PrescienceCast[],
        loading: boolean,
    } {
        return {
            precast: false,
            showEnd: false,
            prescienceCasts: [],
            loading: false,
        };
    },
    mounted() {
        this.prescienceCasts = this.generatePrescienceTimings();
    },
    expose: ['assignPrescienceTimes'],
    methods: {
        addCast() {
            if (!this.prescienceCasts.length) {
                this.prescienceCasts.push({
                    duration: {
                        start: 1,
                        end: 1,
                    },
                    claimedBy: null
                })

                return;
            }

            const lastInterval: FightLocalizedTimeRange = this.prescienceCasts.slice(-1)[0].duration;
            const castTimestamp = lastInterval.start + this.prescienceCooldown
            this.prescienceCasts.push({
                duration: {
                    start: castTimestamp,
                    end: castTimestamp + (this.prescienceDuration * (this.isLongCast(this.prescienceCasts.length) ? 2 : 1)),
                },
                claimedBy: null
            });
        },

        removeCast(cast: PrescienceCast) {
            const index = this.prescienceCasts.findIndex((c) => c === cast);
            if (index < 0) {
                return;
            }

            this.prescienceCasts?.splice(index, 1);
        },

        unclaimedBadge(cast: PrescienceCast): string {
            if (!this.anyCastsClaimed) {
                return '';
            }

            return (cast.duration.start < this.fightDurationSeconds) && cast.claimedBy ? '' : '!';
        },

        generatePrescienceTimings(): PrescienceCast[] {
            // fill in the first of 2 on-pull prescience casts.
            // if precasting prescience, this one will be a double duration.
            let prescienceCasts: PrescienceCast[] = [
                {
                    duration: {
                        start: 1,
                        end: 1 + (this.prescienceDuration * (this.isLongCast(0) ? 2 : 1)),
                    },
                    claimedBy: null,
                }
            ];

            const fightEndSeconds = Math.floor((this.endTimestamp - this.startTimestamp) / 1000);

            let prescTimestamp: number = 2;
            let prescCastCount: number = this.precast ? 3 : 1;
            while (prescTimestamp < fightEndSeconds) {
                this.skipTimeIntervals.forEach((interval: FightLocalizedTimeRange) => {
                    // presc cast takes place during a skipped interval (forced downtime)
                    if (prescTimestamp > interval.start && prescTimestamp < interval.end) {
                        let timeDiffSeconds: number = interval.end - prescTimestamp;
                        prescTimestamp = interval.end;

                        // we gained a prescience charge during the downtime
                        if (timeDiffSeconds >= this.prescienceCooldown) {
                            prescCastCount++;
                            this.prescienceCasts.push({
                                duration: {
                                    start: prescTimestamp,
                                    end: prescTimestamp + + (this.prescienceDuration * (this.isLongCast(0) ? 2 : 1))
                                },
                                claimedBy: null
                            });
                        }
                    }
                })

                prescCastCount++;
                prescienceCasts.push({
                    duration: {
                        start: prescTimestamp,
                        end: prescTimestamp + + (this.prescienceDuration * (this.isLongCast(0) ? 2 : 1))
                    },
                    claimedBy: null
                });
                prescTimestamp += this.prescienceCooldown;
            }

            return prescienceCasts;
        },

        isLongCast(castCount: number): boolean {
            /**
             * castIndex % 3 === 0 - first cast. double duration if precasted
             * castIndex % 3 === 1 - 2nd cast. never double duration unless you mess up precasting
             * castIndex % 3 === 2 - 3rd cast. double duration if not precasted
             * ...
             */
            const doublePrescIndex = this.precast ? 0 : 2;
            return castCount % 3 == doublePrescIndex;
        },

        adjustPrescienceBuffDurationForPrecastValue(castCount: number, cast: PrescienceCast) {

            const buffLength = this.prescienceDuration * (this.isLongCast(castCount) ? 2 : 1);
            cast.duration.end = cast.duration.start + buffLength;
            return cast;
        },

        copyPrescienceCasts() {
            if (!this.allowCopy) {
                return;
            }

            this.loading = true;

            const segment = { start: this.startTimestamp, end: this.endTimestamp }
            WarcraftLogsBuffEventsService.get(this.reportId!, segment, 410089, this.augvoker!.id)
                .then((response: WarcraftLogsBuffEventsResponse) => {
                    this.loading = false;

                    const allCasts = response.data.events.filter((event) => (['applybuff', 'refreshbuff'].includes(event.type)));
                    if (!allCasts.length) {
                        return;
                    }

                    const firstRemove = response.data.events.find((event) => {
                        return event.targetID === allCasts[0].targetID && event.type === 'removebuff';
                    })
                    if (!firstRemove) {
                        this.precast = false;
                    } else {
                        const firstDuration = Math.round((firstRemove.timestamp - allCasts[0].timestamp) / 1000);
                        this.precast = firstDuration >= (this.prescienceDuration * 2);
                    }

                    this.prescienceCasts = allCasts.map((event, castIndex) => {
                        const timestamp = Math.round((event.timestamp - this.startTimestamp) / 1000);
                        let cast: PrescienceCast = {
                            duration: {
                                start: timestamp,
                                end: timestamp,
                            },
                            claimedBy: null
                        };

                        return this.adjustPrescienceBuffDurationForPrecastValue(castIndex, cast);
                    });
                })
                .catch((e: Error) => {
                    console.error(e);
                    this.loading = false;
                });
        },

        assignPrescienceTimes(topDamagersByTime: DamagerInterval[]): FightLocalizedTimeRange[] {
            // unclaim all casts
            this.prescienceCasts.forEach((cast: PrescienceCast) => {
                cast.claimedBy = null;
            });

            topDamagersByTime.forEach((interval: DamagerInterval) => {
                interval.damagers.forEach((damager: Damager) => {
                    const possibleCasts = this.prescienceCasts.filter((cast) => {
                        // find prescience casts that:
                        //  start before this EM cast
                        //  buff ends after this EM cast
                        //  are unclaimed or claimed by this damager
                        return cast.duration.end > interval.start
                            && cast.duration.start < interval.start
                            && (!cast.claimedBy || cast.claimedBy === damager.name);
                    }).sort((a: PrescienceCast, b: PrescienceCast) => {
                        // if there's a cast from a previous interval that's still up for *this* interval, prioritize that one first.
                        if (a.claimedBy === damager.name) {
                            return -1;
                        }
                        if (b.claimedBy === damager.name) {
                            return 1;
                        }
                        // sort casts by how close presc is to falling off when we cast EM.
                        // we want higher damage players to have the longer presc duration so we lose less damage if we mess up somewhere.
                        return (b.duration.end - interval.start) - (a.duration.end - interval.start);
                    });

                    if (!possibleCasts.length) {
                        return;
                    }
                    possibleCasts[0].claimedBy = damager.name;
                    damager.prescTimestamp = possibleCasts[0].duration.start;
                });
            });

            return this.prescienceCasts.filter((cast: PrescienceCast) => {
                return !cast.claimedBy && cast.duration.start <= this.fightDurationSeconds;
            }).map((cast: PrescienceCast) => {
                return cast.duration;
            });
        },
        sortTimings() {
            this.prescienceCasts.sort((castA: PrescienceCast, castB: PrescienceCast) => {
                return castA.duration.start - castB.duration.start;
            })
        }
    },

    computed: {
        allowCopy() {
            return this.augvoker
        },
        anyCastsClaimed() {
            const claimedCasts = this.prescienceCasts.find((cast) => (cast.claimedBy !== null));
            if (!claimedCasts) {
                return false;
            }

            return true;
        },
        fightDurationSeconds(): number {
            return Math.floor((this.endTimestamp - this.startTimestamp) / 1000);
        }
    },

    watch: {
        precast: function (newValue, oldValue) {
            this.prescienceCasts = this.prescienceCasts.map((cast, castIndex) => {
                return this.adjustPrescienceBuffDurationForPrecastValue(castIndex, cast);
            });
        }
    }
});
</script>
