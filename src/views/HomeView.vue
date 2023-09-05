<template>
    <div class="home">
        <WarcraftLogsInput @select-fight="wclFightSelected" />
        <template v-if="fight">
            <TimeSelector :durationSeconds="fight.end_time - fight.start_time" @update-skip-interval="updateSkipTimeIntervals"/>
        </template>
    </div>
</template>
  
<script lang="ts">
import { defineComponent } from 'vue'
import WarcraftLogsInput, { type SelectFightPayload } from '@/components/WarcraftLogsInput.vue';
import TimeSelector from '@/components/TimeSelector.vue';
import { type TimeIntervalSeconds } from '@/components/HumanReadableSeconds.vue';
import type WarcraftLogsFight from '@/types/WarcraftLogsFight';

export default defineComponent({
    name: 'HomeView',
    components: {
        WarcraftLogsInput,
        TimeSelector,
    },
    data() : {
        reportId: string,
        fight: WarcraftLogsFight | null
        bossOnly: boolean,
        skipTimeIntervals: TimeIntervalSeconds[],
    } {
        return {
            'reportId': '',
            'fight': null,
            'bossOnly': true,
            skipTimeIntervals: [],
        };
    },
    methods: {
        wclFightSelected(payload: SelectFightPayload) {
            this.reportId = payload.reportId;
            this.fight = payload.fight;
            this.bossOnly = payload.bossOnly;
        },

        updateSkipTimeIntervals(payload: TimeIntervalSeconds[]) {
            this.skipTimeIntervals = payload;
        }
    }
})
</script>
  