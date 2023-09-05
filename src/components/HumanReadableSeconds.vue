<template>
    <InputMask v-model="display" mask="9:99"/>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import InputMask from 'primevue/inputmask';

export interface UpdateTimePayload {
  seconds: number;
  index: number;
  type: string;
}

export default defineComponent({
  name: "HumanReadableSeconds",
  emits: {
    updateSeconds(payload: UpdateTimePayload) {
      return true;
    }
  },
  components: {
    InputMask,
  },
  props: {
    index: Number,
    type: String,
  },
  data() : {
    display: string
  } {
    return {
        display: "0:00"
    };
  },

  methods: {
    timeToSeconds(time: string): number | null {
      const parts = time.split(':');
      const min = parseInt(parts[0]);
      const sec = parseInt(parts[1]);

      return (60 * min) + sec;
    }
  },
  watch: {
    display: function(newDisplay: string, oldDisplay: string) {
      if (!['start', 'end'].includes(this.type ?? '')) {
        return;
      }

      const sec = this.timeToSeconds(this.display);
      if (!sec) {
        return;
      }

      this.$emit("updateSeconds", {
        'seconds': sec,
        'index': this.index!,
        'type': this.type!
      });
    }
  },
});
</script>
