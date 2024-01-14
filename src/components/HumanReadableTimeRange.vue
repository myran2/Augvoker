<template>
  <div class="time-range">
    <InputMask v-model="startDisplay" mask="9:99"/>
    <span>-</span>
    <InputMask v-model="endDisplay" mask="9:99"/>
    <template v-if="showDiff && interval && (interval.end - interval.start) > 0">
      <span>{{ interval.end - interval.start }}s</span>
    </template>
  </div>
</template>

<style scoped>
.time-range {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  column-gap: 10px;
}
span {
  font-size: 25px;
}

</style>

<script lang="ts">
import { type PropType, defineComponent } from "vue";
import type FightLocalizedTimeRange from "@/types/FightLocalizedTimeRange";
import { secondsToTime, timeToSeconds } from '@/helpers/Format';
import InputMask from 'primevue/inputmask';

export default defineComponent({
  name: "HumanReadableTimeRange",
  components: {
    InputMask,
  },
  props: {
    interval: Object as PropType<FightLocalizedTimeRange>,
    showDiff: Boolean
  },
  data() : {
    startDisplay: string;
    endDisplay: string;
  } {
    return {
        startDisplay: this.interval ? secondsToTime(this.interval.start, 1) : "0:00",
        endDisplay: this.interval ? secondsToTime(this.interval.end, 1) : "0:00",
    };
  },
  watch: {
    startDisplay: function(newDisplay: string, oldDisplay: string) {
      if (!this.interval) {
        return;
      }

      const sec = timeToSeconds(this.startDisplay);
      if (!sec) {
        return;
      }

      this.interval.start = sec;
    },

    endDisplay: function(newDisplay: string, oldDisplay: string) {
      if (!this.interval) {
        return;
      }
      
      const sec = timeToSeconds(this.endDisplay);
      if (!sec) {
        return;
      }

      this.interval.end = sec;
    },

    interval: function(newValue, oldValue) {
      this.startDisplay = secondsToTime(this.interval!.start);
      this.endDisplay = secondsToTime(this.interval!.end);
    }
  },
});
</script>