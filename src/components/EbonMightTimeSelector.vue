<template>
    <div class="skip-time-intervals">
        <h2>Ebon Might Buffs</h2>
        <InputGroup v-for="(ebonMightCast, index) in ebonMightTimings" class="interval">
            <Button @click="removeEbonMightCast(index)" icon="pi pi-trash" severity="danger"/>
            <HumanReadableTimeRange :interval="ebonMightCast" />
        </InputGroup>
        <Button id="add-interval" size="small" label="Add" severity="secondary" outlined @click="addInterval()"/>
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
  name: "EbonMightTimeSelector",
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
    ebonMightTimings: Array as PropType<Array<[number, number]>>,
  },
  data() : {
  } {
    return {};
  },
  methods: {
    addInterval() {
      if (!this.ebonMightTimings) {
        return;
      }
        this.ebonMightTimings.push([0, 0]);
    },

    removeEbonMightCast(index: number) {
      this.ebonMightTimings?.splice(index, 1);
    }
  }
});
</script>
