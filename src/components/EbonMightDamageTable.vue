<template>
    <div v-if="damagerTableValues.length > 0" class="damage-done-table">
        <h2>Damage Done Inside Ebon Might Windows</h2>
        <DataTable stripedRows :value="damagerTableValues">
            <Column field="timeRange" header="Time"></Column>
            <Column field="player1" header="Player - Damage (Presc. Time)">
                <template #body="slotProps">
                    <span :style="{'color': getColor(slotProps.data.player1.class)}">{{ slotProps.data.player1.name }}</span>
                    - 
                    {{ formatDamageNumber(slotProps.data.player1.damage) }}
                    <span v-if="slotProps.data.player1.prescTimestamp !== null" class="presc-timestamp">
                        ({{ secondsToTime(slotProps.data.player1.prescTimestamp) }})
                    </span>
                </template>
            </Column>
            <Column field="player2" header="Player - Damage (Presc. Time)">
                <template #body="slotProps">
                    <span :style="{'color': getColor(slotProps.data.player2.class)}">{{ slotProps.data.player2.name }}</span>
                    - 
                    {{ formatDamageNumber(slotProps.data.player2.damage) }}
                    <span v-if="slotProps.data.player2.prescTimestamp !== null" class="presc-timestamp">
                        ({{ secondsToTime(slotProps.data.player2.prescTimestamp) }})
                    </span>
                </template>
            </Column>
            <Column field="player3" header="Player - Damage (Presc. Time)">
                <template #body="slotProps">
                    <span :style="{'color': getColor(slotProps.data.player3.class)}">{{ slotProps.data.player3.name }}</span>
                    - 
                    {{ formatDamageNumber(slotProps.data.player3.damage) }}
                    <span v-if="slotProps.data.player3.prescTimestamp !== null" class="presc-timestamp">
                        ({{ secondsToTime(slotProps.data.player3.prescTimestamp) }})
                    </span>
                </template>
            </Column>
            <Column field="player4" header="Player - Damage (Presc. Time)">
                <template #body="slotProps">
                    <span :style="{'color': getColor(slotProps.data.player4.class)}">{{ slotProps.data.player4.name }}</span>
                    - 
                    {{ formatDamageNumber(slotProps.data.player4.damage) }}
                    <span v-if="slotProps.data.player4.prescTimestamp !== null" class="presc-timestamp">
                        ({{ secondsToTime(slotProps.data.player4.prescTimestamp) }})
                    </span>
                </template>
            </Column>
        </DataTable>
    </div>
</template>
    
<style scoped>
.presc-timestamp {
    font-size: 10px;
    font-style: italic;
}
</style>
    
<script lang="ts">
import { defineComponent } from "vue";
import { secondsToTime, getColor, formatDamageNumber } from '@/helpers/Format';
import type { DamagerInterval } from '@/types/DamagerInterval';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

export default defineComponent({
name: "MrtNote",
components: {
    DataTable,
    Column
},
props: {
    topDamagersByTime: {
        type: Array<DamagerInterval>,
        required: true,
    },
},
methods: {
    getColor,
    formatDamageNumber,
    secondsToTime,
},
computed: {
    damagerTableValues() {
        return this.topDamagersByTime.map((row: DamagerInterval) => {
            if (row.damagers.length < 4) {
                return null;
            }

            return {
                timeRange: `${secondsToTime(row.start)} - ${secondsToTime(row.end)}`,
                player1: row.damagers[0],
                player2: row.damagers[1],
                player3: row.damagers[2],
                player4: row.damagers[3],
            };
        });
    },
}
});
</script>
