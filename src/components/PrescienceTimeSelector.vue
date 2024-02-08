<template>
    <div class="time-selector prescience" v-if="visible">
        <div>
            <div class="header">
                <h2>Prescience Casts</h2>
            </div>
            <Button v-if="augvoker" :loading="loading" :disabled="!allowCopy" @click="copyPrescienceCasts()" class="copy"
                size="small" label="Copy From Log" />
            <Button v-else :disabled="true" size="small" severity="info">Select an Augvoker to copy their timings</Button>
        </div>
        <div class="toggle-group">
            <InputSwitch v-model="precast" />
            <label>Precast</label>
        </div>
        <div class="interval-group">
            <InputGroup v-for="(cast, index) in prescienceCasts" class="interval p-overlay-badge">
                <Button @click="removeCast(index)" icon="pi pi-trash" severity="danger" />
                <template v-if="!cast.claimed && anyCastsClaimed">
                    <HumanReadableTimeRange :interval="cast.duration" :show-diff="true" :show-end="false"
                        :override-diff="castDurationString(cast.duration)" v-badge.warning="'!'" />
                </template>
                <template v-else>
                    <HumanReadableTimeRange :interval="cast.duration" :show-diff="true" :show-end="false"
                        :override-diff="castDurationString(cast.duration)" />
                </template>
            </InputGroup>
            <Button class="add" size="small" label="Add" severity="secondary" outlined @click="addCast()" />
        </div>
    </div>
</template>

<style scoped></style>

<script lang="ts">
import { type PropType, defineComponent } from "vue";
import HumanReadableTimeRange from '@/components/HumanReadableTimeRange.vue';
import WarcraftLogsBuffEventsService from "@/services/WarcraftLogsBuffEventsService";
import type WarcraftLogsBuffEventsResponse from "@/types/WarcraftLogsBuffEventsResponse";
import type FightLocalizedTimeRange from "@/types/FightLocalizedTimeRange";
import type WarcraftLogsFriendly from "@/types/WarcraftLogsFriendly";
import type { PrescienceCast } from "@/types/PrescienceCast";
import type { DamagerInterval } from "@/types/DamagerInterval";
import Button from 'primevue/button';
import Badge from 'primevue/badgedirective';
import InputSwitch from 'primevue/inputswitch';
import InputNumber from 'primevue/inputnumber';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';

export default defineComponent({
    name: "PrescienceTimeSelector",
    components: {
        HumanReadableTimeRange,
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
        prescienceCasts: PrescienceCast[],
        loading: boolean,
    } {
        return {
            precast: false,
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
            if (!this.prescienceCasts) {
                return;
            }

            const lastInterval: FightLocalizedTimeRange = this.prescienceCasts.slice(-1)[0].duration;
            if (!lastInterval) {
                this.prescienceCasts.push({
                    duration: {
                        start: 5,
                        end: 5 + this.prescienceDuration,
                    },
                    claimed: false
                })
                return;
            }

            this.prescienceCasts.push({
                duration: {
                    start: lastInterval.end + 1,
                    end: lastInterval.end + (lastInterval.end - lastInterval.start),
                },
                claimed: false
            });
        },

        removeCast(index: number) {
            this.prescienceCasts?.splice(index, 1);
        },

        generatePrescienceTimings(): PrescienceCast[] {
            // fill in the first of 2 on-pull prescience casts.
            // if precasting prescience, this one will be a double duration.
            let prescienceCasts: PrescienceCast[] = [
                {
                    duration: {
                        start: 1,
                        end: this.prescienceDuration * (this.precast ? 2 : 1),
                    },
                    claimed: false,
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
                                    end: prescTimestamp + (this.prescienceDuration * (prescCastCount % 3 === 0 ? 2 : 1))
                                },
                                claimed: false
                            });
                        }
                    }
                })

                prescCastCount++;
                prescienceCasts.push({
                    duration: {
                        start: prescTimestamp,
                        end: prescTimestamp + (this.prescienceDuration * (prescCastCount % 3 === 0 ? 2 : 1))
                    },
                    claimed: false
                });
                prescTimestamp += this.prescienceCooldown;
            }

            return prescienceCasts;
        },

        adjustPrescienceBuffDurationForPrecastValue(castCount: number, cast: PrescienceCast) {
            /**
             * castIndex % 3 === 0 - first cast. double duration if precasted
             * castIndex % 3 === 1 - 2nd cast. never double duration unless you mess up precasting
             * castIndex % 3 === 2 - 3rd cast. double duration if not precasted
             * ...
             */
            const doublePrescIndex = this.precast ? 0 : 2;
            const buffLength = this.prescienceDuration * (castCount % 3 == doublePrescIndex ? 2 : 1);
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
                            claimed: false
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
                cast.claimed = false;
            });

            topDamagersByTime.forEach((interval: DamagerInterval) => {
                let damagerIndex: number = 0;

                this.prescienceCasts.filter((cast) => {
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

            return this.prescienceCasts.filter((cast: PrescienceCast) => {
                return !cast.claimed;
            }).map((cast: PrescienceCast) => {
                return cast.duration;
            });
        },

        castDurationString(cast: FightLocalizedTimeRange): string {
            if (cast.end - cast.start >= this.prescienceDuration * 2) {
                return "Long";
            }

            return "Short";
        }
    },

    computed: {
        allowCopy() {
            return this.augvoker
        },
        anyCastsClaimed() {
            return this.prescienceCasts.find((cast) => (cast.claimed));
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
