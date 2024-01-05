<template>
    <InputMask v-model="startDisplay" mask="9:99"/>
    <span>-</span>
    <InputMask v-model="endDisplay" mask="9:99"/>
</template>

<style scoped>
span {
  padding: 2px 8px 0px;
  font-size: 25px;
}
</style>

<script lang="ts">
import { type PropType, defineComponent } from "vue";
import InputMask from 'primevue/inputmask';

export default defineComponent({
  name: "HumanReadableTimeRange",
  components: {
    InputMask,
  },
  props: {
    interval: Object as PropType<[number, number]>
  },
  data() : {
    startDisplay: string;
    endDisplay: string;
  } {
    return {
        startDisplay: this.interval ? this.secondsToTime(this.interval[0]) : "0:00",
        endDisplay: this.interval ? this.secondsToTime(this.interval[1]) : "0:00",
    };
  },

  methods: {
    secondsToTime(seconds: number): string {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min.toString().padStart(1, '0')}:${sec.toString().padStart(2, '0')}`;
    },

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

      this.interval[0] = sec;
    },

    endDisplay: function(newDisplay: string, oldDisplay: string) {
      if (!this.interval) {
        return;
      }
      
      const sec = this.timeToSeconds(this.endDisplay);
      if (!sec) {
        return;
      }

      this.interval[1] = sec;
    }
  },
});
</script>
