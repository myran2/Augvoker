<template>
  <div class="time-selector">
    <div>
      <div class="header">
          <h2>Forced Downtime</h2>
      </div>
      <div class="interval-group">
        <InputGroup v-for="(interval, index) in skipTimeIntervals" class="interval">
          <Button @click="removeInterval(index)" icon="pi pi-trash" severity="danger"/>
          <HumanReadableTimeRange :interval="interval" />
        </InputGroup>
        <Button class="add" size="small" label="Add" severity="secondary" outlined @click="addInterval()"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
