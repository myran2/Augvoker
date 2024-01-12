<template>
    <div class="skip-time-intervals">
      <div class="header">
        <h2>Ebon Might Buffs</h2>
        <Button v-if="augvokerName" size="small" label="Copy Timings From Log" :disabled="!allowEmCopy" @click="copyEbonMightTimings()"/>
      </div>
        <InputGroup v-for="(ebonMightCast, index) in ebonMightTimings" class="interval">
            <Button @click="removeEbonMightCast(index)" icon="pi pi-trash" severity="danger"/>
            <HumanReadableTimeRange :interval="ebonMightCast" :show-diff="true"/>
        </InputGroup>
        <Button id="add-interval" size="small" label="Add" severity="secondary" outlined @click="addInterval()"/>
    </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-flow: row nowrap;
  column-gap: 10px;
  align-items: center;
  button {
    height: 40px;
  }
}
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
import { defineComponent } from "vue";
import HumanReadableTimeRange from '@/components/HumanReadableSeconds.vue';
import WarcraftLogsBuffsService from "@/services/WarcraftLogsBuffsService";
import type WarcraftLogsBuffsResponse from "@/types/WarcraftLogsBuffsResponse";
import type FightLocalizedTimeRange from "@/types/FightLocalizedTimeRange";
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';

export default defineComponent({
  name: "EbonMightTimeSelector",
  emits: {
    ebonMightTimingsChanged(payload: FightLocalizedTimeRange[]) {
      return payload.length > 0;
    }
  },
  components: {
    HumanReadableTimeRange,
    Button,
    InputNumber,
    InputGroup,
    InputGroupAddon
  },
  props: {
    augvokerName: String,
    reportId: String,
    startTimestamp: Number,
    endTimestamp: Number,
  },
  data() : {
    ebonMightTimings: Array<FightLocalizedTimeRange>
  } {
    return {
      ebonMightTimings: []
    };
  },
  methods: {
    addInterval() {
      if (!this.ebonMightTimings) {
        return;
      }

      const lastInterval: FightLocalizedTimeRange = this.ebonMightTimings.slice(-1)[0];
      if (!lastInterval) {
        this.ebonMightTimings.push({
          start: 0,
          end: 0,
        })
        return;
      }

      this.ebonMightTimings.push({
        start: lastInterval.end + 1,
        end: lastInterval.end + (lastInterval.end - lastInterval.start),
      });
    },

    removeEbonMightCast(index: number) {
      this.ebonMightTimings?.splice(index, 1);
    },

    copyEbonMightTimings() {
      if (!this.allowEmCopy) {
        return;
      }

      WarcraftLogsBuffsService.get(this.reportId!, this.startTimestamp!, this.endTimestamp!, 395296)
            .then((response: WarcraftLogsBuffsResponse) => {
              const selectedAugBuffs = response.data.auras.find(obj => { return obj.name === this.augvokerName; });
              if (! selectedAugBuffs) {
                return;
              }
              this.ebonMightTimings = selectedAugBuffs.bands.map(band => {
                return {
                  start: Math.round((band.startTime - this.startTimestamp!) / 1000),
                  end: Math.round((band.endTime - this.startTimestamp!) / 1000)
                };
              });
            })
            .catch((e: Error) => {
                console.error(e);
            });
    }
  },

  computed: {
    allowEmCopy() {
      return this.reportId && this.startTimestamp && this.endTimestamp && this.augvokerName
    }
  },

  watch: {
    ebonMightTimings: {
      deep: true,
      handler(newValue, oldValue) {
        this.$emit('ebonMightTimingsChanged', this.ebonMightTimings);
      }
    }
  }
});
</script>
