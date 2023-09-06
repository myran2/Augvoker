<template>
  <div class="skip-time-intervals">
    <h2>Skip Time Intervals</h2>
    <div v-for="interval in skipTimeIntervals">
        <HumanReadableTimeRange :interval="interval" />
    </div>

    <Button id="add-interval" label="Add" severity="secondary" outlined @click="addInterval()"/>
  </div>
</template>

<style scoped>
.skip-time-intervals {
  padding-bottom: 3%;

  #add-interval {
    margin-top: 1%;
    margin-left: 3px;
  }
}
</style>

<script lang="ts">
import { type PropType, defineComponent } from "vue";
import HumanReadableTimeRange, { type TimeIntervalSeconds } from '@/components/HumanReadableSeconds.vue';
import Button from 'primevue/button';

export default defineComponent({
  name: "TimeSelector",
  emits: {
    updateSkipInterval(payload: TimeIntervalSeconds[]) {
        return payload;
    }
  },
  components: {
    HumanReadableTimeRange,
    Button,
  },
  props: {
    durationSeconds: Number,
    skipTimeIntervals: Array as PropType<Array<TimeIntervalSeconds>>,
  },
  data() : {
  } {
    return {
    };
  },
  methods: {
    addInterval() {
      if (!this.skipTimeIntervals) {
        return;
      }
        this.skipTimeIntervals.push({
            start: 0,
            end: 0,
        });
    }
  }
});
</script>
