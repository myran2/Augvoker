<template>
    <div class="home">
        <WarcraftLogsInput @select-fight="wclFightSelected" />
    </div>
</template>
  
<script lang="ts">
import { defineComponent } from 'vue'
import WarcraftLogsInput, { type SelectFightPayload } from '@/components/WarcraftLogsInput.vue';
import type WarcraftLogsFight from '@/types/WarcraftLogsFight';

export default defineComponent({
    name: 'HomeView',
    components: {
        WarcraftLogsInput,
    },
    data() : {
        reportId: string,
        fight: WarcraftLogsFight | null
        bossOnly: boolean,
    } {
        return {
            'reportId': '',
            'fight': null,
            'bossOnly': true,
        };
    },
    methods: {
        wclFightSelected(payload: SelectFightPayload) {
            this.reportId = payload.reportId;
            this.fight = payload.fight;
            this.bossOnly = payload.bossOnly;

            console.log(payload.reportId, payload.fight.id, payload.bossOnly);
        }
    }
})
</script>
  