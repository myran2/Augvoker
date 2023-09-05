<template>
    <InputMask v-model="startDisplay" mask="9:99"/>
    -
    <InputMask v-model="endDisplay" mask="9:99"/>
</template>

<script lang="ts">
import { type PropType, defineComponent } from "vue";
import InputMask from 'primevue/inputmask';

export interface TimeIntervalSeconds {
    'start': number;
    'end': number;
}

export default defineComponent({
  name: "HumanReadableTimeRange",
  components: {
    InputMask,
  },
  props: {
    interval: Object as PropType<TimeIntervalSeconds>
  },
  data() : {
    startDisplay: string;
    endDisplay: string;
  } {
    return {
        startDisplay: "0:00",
        endDisplay: "0:00",
    };
  },

  methods: {
    timeToSeconds(time: string): number | null {
      if (time.includes('_')) {
        return null;
      }
      
      const parts = time.split(':');
      const min = parseInt(parts[0]);
      const sec = parseInt(parts[1]);

      return (60 * min) + sec;
    }
  },
  watch: {
    startDisplay: function(newDisplay: string, oldDisplay: string) {
      if (!this.interval) {
        return;
      }

      const sec = this.timeToSeconds(this.startDisplay);
      if (!sec) {
        return;
      }

      this.interval.start = sec;
    },

    endDisplay: function(newDisplay: string, oldDisplay: string) {
      if (!this.interval) {
        return;
      }
      
      const sec = this.timeToSeconds(this.endDisplay);
      if (!sec) {
        return;
      }

      this.interval.end = sec;
    }
  },
});
</script>
