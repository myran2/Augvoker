<template>
  <div class="skip-time-intervals">
    <div class="columns">
      <div style="min-width: 578px">
        <h2>Skip Time Intervals</h2>
        <InputGroup v-for="(interval, index) in skipTimeIntervals" class="interval">
          <Button @click="removeInterval(index)" icon="pi pi-trash" severity="danger"/>
          <HumanReadableTimeRange :interval="interval" />
        </InputGroup>
        <Button id="add-interval" size="small" label="Add" severity="secondary" outlined @click="addInterval()"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skip-time-intervals {
  padding-bottom: 3%;

  .interval {
    padding-bottom: 5px;
  }

  #add-interval {
    margin-top: 2%;
  }

  .columns {
    display: flex;
    flex-flow: row nowrap;
    column-gap: 50px;
  }
}
</style>

<script lang="ts">
import { type PropType, defineComponent } from "vue";
import HumanReadableTimeRange from '@/components/HumanReadableTimeRange.vue';
import type FightLocalizedTimeRange from "@/types/FightLocalizedTimeRange";
import Button from 'primevue/button';
import InputGroup from 'primevue/inputgroup';

export default defineComponent({
  name: "SkipIntervalSelector",
  components: {
    HumanReadableTimeRange,
    Button,
    InputGroup,
  },
  props: {
    durationSeconds: Number,
    skipTimeIntervals: Array as PropType<FightLocalizedTimeRange[]>,
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
    },

    removeInterval(index: number) {
      this.skipTimeIntervals?.splice(index, 1);
    }
  }
});
</script>
