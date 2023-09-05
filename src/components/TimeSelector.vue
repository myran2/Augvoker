<template>
    <h2>Skip Time Intervals</h2>
    <div v-for="(interval, index) in skipTimeIntervals">
        {{ index }} - 
        <HumanReadableSeconds :index="index" :type="'start'" @update-seconds="updateInterval"/>
        -
        <HumanReadableSeconds :index="index" :type="'end'" @update-seconds="updateInterval"/>

        <input type="button" value="Delete" @click="deleteInterval(index)"/>
    </div>

    <input type="button" value="Add" @click="addInterval()"/>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import HumanReadableSeconds, { type UpdateTimePayload } from '@/components/HumanReadableSeconds.vue';

export interface SkipTimeInterval {
    'start': Number;
    'end': Number;
}

export default defineComponent({
  name: "TimeSelector",
  emits: {
    updateSkipInterval(payload: SkipTimeInterval[]) {
        return payload;
    }
  },
  components: {
    HumanReadableSeconds,
  },
  props: {
    durationSeconds: Number,
  },
  data() : {
    skipTimeIntervals: SkipTimeInterval[]
  } {
    return {
        skipTimeIntervals: [
            {start: 0, end: 0},
        ]
    };
  },
  methods: {
    updateInterval(payload: UpdateTimePayload) {
        if (payload.type === 'start') {
            this.skipTimeIntervals[payload.index].start = payload.seconds;
        } else if (payload.type === 'end') {
            this.skipTimeIntervals[payload.index].end = payload.seconds;
        }

        this.$emit("updateSkipInterval", this.skipTimeIntervals);
    },

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
    skipTimeIntervals: function(newV, oldV) {
        console.log(this.skipTimeIntervals);
    }
  }
});
</script>
