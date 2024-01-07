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
      <div>
        <h2>Ebon Might Interval Duration</h2>
        <InputGroup>
          <InputNumber
            v-model="ebonMightDuration"
            :step="1"
            :min="15"
            :max="45"
          ></InputNumber>
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
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
import HumanReadableTimeRange from '@/components/HumanReadableSeconds.vue';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';

export default defineComponent({
  name: "SkipIntervalSelector",
  emits: {
    updateTimeInterval(payload: number) {
        return payload;
    },
  },
  components: {
    HumanReadableTimeRange,
    Button,
    InputNumber,
    InputGroup,
    InputGroupAddon
  },
  props: {
    durationSeconds: Number,
    skipTimeIntervals: Array as PropType<Array<[number, number]>>,
    timeInterval: Number,
  },
  data() : {
    ebonMightDuration: number,
  } {
    return {
      ebonMightDuration: this.timeInterval ?? 30
    };
  },
  methods: {
    addInterval() {
      if (!this.skipTimeIntervals) {
        return;
      }
        this.skipTimeIntervals.push([0, 0]);
    },

    removeInterval(index: number) {
      this.skipTimeIntervals?.splice(index, 1);
    }
  },
  watch: {
    ebonMightDuration(newDuration: number, oldDuration: number) {
      this.$emit("updateTimeInterval", newDuration);
    }
  }
});
</script>
