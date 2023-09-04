<template>
    <div class="home">
        <WarcraftLogsInput @select-fight="wclFightSelected" />

        <label for="bossOnly">Boss Only</label>
        <input type="checkbox" v-model="bossOnly" id="bossOnly">
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
            'bossOnly': false,
        };
    },
    methods: {
        wclFightSelected(payload: SelectFightPayload) {
            this.reportId = payload.reportId;
            this.fight = payload.fight;
        }
    }
})
</script>
  