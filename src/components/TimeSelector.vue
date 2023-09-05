<template>
    <h2>Skip Time Intervals</h2>
    <div v-for="interval in skipTimeIntervals">
        <HumanReadableTimeRange :interval="interval" />
    </div>

    <input type="button" value="Add" @click="addInterval()"/>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import HumanReadableTimeRange, { type TimeIntervalSeconds } from '@/components/HumanReadableSeconds.vue';

export default defineComponent({
  name: "TimeSelector",
  emits: {
    updateSkipInterval(payload: TimeIntervalSeconds[]) {
        return payload;
    }
  },
  components: {
    HumanReadableTimeRange,
  },
  props: {
    durationSeconds: Number,
  },
  data() : {
    skipTimeIntervals: TimeIntervalSeconds[]
  } {
    return {
        skipTimeIntervals: [],
    };
  },
  methods: {
    deleteInterval(index: number) {
        this.skipTimeIntervals.splice(index, 1);
    },

    addInterval() {
        this.skipTimeIntervals.push({
            start: 0,
            end: 0,
        });
    }
  },

  watch: {
    skipTimeIntervals: {
      handler(val, oldVal) {
        this.$emit("updateSkipInterval", this.skipTimeIntervals);
      },
      deep: true
    }
  }
});
</script>
