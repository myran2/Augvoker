<template>
  <div class="time-selector ebon-might" v-if="visible">
    <div>
      <div class="header">
        <h2>Ebon Might Buffs</h2>
      </div>
      <Button v-if="augvoker" :loading="loading" :disabled="!allowEmCopy" @click="copyEbonMightTimings()" size="small"
          label="Copy From Log" class="copy" />
      <Button v-else :disabled="true" size="small" severity="info">Select an Augvoker to copy their timings</Button>
    </div>
    <div class="interval-group">
      <InputGroup v-for="(ebonMightCast, index) in ebonMightTimings" class="interval">
        <Button @click="removeEbonMightCast(index)" icon="pi pi-trash" severity="danger" />
        <HumanReadableTimeRange :interval="ebonMightCast" :show-diff="true" />
      </InputGroup>
    </div>
    <Button class="add" size="small" label="Add" severity="secondary" outlined @click="addInterval()" />
  </div>
</template>

<style scoped></style>

<script lang="ts">
import { type PropType, defineComponent } from "vue";
import HumanReadableTimeRange from '@/components/HumanReadableTimeRange.vue';
import WarcraftLogsBuffsService from "@/services/WarcraftLogsBuffsService";
import type WarcraftLogsBuffsResponse from "@/types/WarcraftLogsBuffsResponse";
import type FightLocalizedTimeRange from "@/types/FightLocalizedTimeRange";
import type WarcraftLogsFriendly from "@/types/WarcraftLogsFriendly";
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';

export default defineComponent({
  name: "EbonMightTimeSelector",
  emits: {
    ebonMightTimingsChanged(payload: FightLocalizedTimeRange[]) {
      return payload.length > 0;
    }
  },
  components: {
    HumanReadableTimeRange,
    Button,
    InputNumber,
    InputGroup,
    InputGroupAddon
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
    ebonMightDurationSeconds: {
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
    ebonMightTimings: FightLocalizedTimeRange[],
    ebonMightCoolDownSeconds: number,
    loading: boolean,
  } {
    return {
      ebonMightTimings: [],
      ebonMightCoolDownSeconds: 30,
      loading: false,
    };
  },
  mounted() {
    this.ebonMightTimings = this.generateEbonMightTimings();
  },
  methods: {
    addInterval() {
      if (!this.ebonMightTimings) {
        return;
      }

      const lastInterval: FightLocalizedTimeRange = this.ebonMightTimings.slice(-1)[0];
      if (!lastInterval) {
        this.ebonMightTimings.push({
          start: 0,
          end: this.ebonMightDurationSeconds,
        })
        return;
      }

      let interval: FightLocalizedTimeRange = this.tweakIntervalForDowntime({
        start: lastInterval.start + this.ebonMightCoolDownSeconds,
        end: lastInterval.start + this.ebonMightCoolDownSeconds + this.ebonMightDurationSeconds,
      });
      this.ebonMightTimings.push(interval);
    },

    removeEbonMightCast(index: number) {
      this.ebonMightTimings?.splice(index, 1);
    },

    copyEbonMightTimings() {
      if (!this.allowEmCopy) {
        return;
      }

      this.loading = true;

      const segment = { start: this.startTimestamp!, end: this.endTimestamp! }
      WarcraftLogsBuffsService.get(this.reportId!, segment, 395296, this.augvoker!.id)
        .then((response: WarcraftLogsBuffsResponse) => {
          this.loading = false;
          const allCasts = response.data.auras.flatMap((target) => (target.bands)).sort((a, b) => (a.startTime - b.startTime));
          this.ebonMightTimings = allCasts.map(band => {
            return {
              start: Math.round((band.startTime - this.startTimestamp!) / 1000),
              end: Math.round((band.endTime - this.startTimestamp!) / 1000)
            };
          });
        })
        .catch((e: Error) => {
          console.error(e);
        });
    },

    tweakIntervalForDowntime(interval: FightLocalizedTimeRange): FightLocalizedTimeRange {
      this.skipTimeIntervals.forEach(skipInterval => {
        if (skipInterval.start === skipInterval.end) {
          return;
        }

        // current interval starts inside of a skipped interval:
        // change start to end of skipped interval
        if (skipInterval.start <= interval.start && interval.start <= skipInterval.end) {
          interval.start = skipInterval.end;
          interval.end = interval.start + this.ebonMightDurationSeconds;
        }

        // current interval ends inside of a skipped interval:
        // change end to beginning of interval.
        if (skipInterval.start <= interval.end && interval.end <= skipInterval.end) {
          interval.end = skipInterval.start;
        }
      });

      return interval;
    },

    generateEbonMightTimings(): FightLocalizedTimeRange[] {
      let timings: FightLocalizedTimeRange[] = [];

      const fightDurationSeconds = Math.floor((this.endTimestamp - this.startTimestamp) / 1000);
      let interval: FightLocalizedTimeRange = {
          start: 5,
          end: 5 + this.ebonMightDurationSeconds
      };

      while (interval.start < fightDurationSeconds) {
        interval.end = Math.min(interval.end, fightDurationSeconds);
        timings.push(structuredClone(interval));

        interval.start = interval.start + this.ebonMightCoolDownSeconds;
        interval.end = interval.start + this.ebonMightDurationSeconds

        interval = this.tweakIntervalForDowntime(interval);
      }

      return timings;
    },
  },

  computed: {
    allowEmCopy() {
      return this.reportId && this.startTimestamp && this.endTimestamp && this.augvoker
    }
  },

  watch: {
    ebonMightTimings: {
      deep: true,
      handler(newValue, oldValue) {
        this.$emit('ebonMightTimingsChanged', this.ebonMightTimings);
      }
    }
  }
});
</script>
