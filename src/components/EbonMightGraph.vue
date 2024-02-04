<template>
    <Chart
        type="line"
        :data="chartData"
        :options="chartOptions"
        style="width:100%"
    />
</template>
  
<style scoped>
</style>
  
<script lang="ts">
import { type PropType, defineComponent } from "vue";
import type FightLocalizedTimeRange from "@/types/FightLocalizedTimeRange";
import type WarcraftLogsFight from "@/types/WarcraftLogsFight";
import Chart from "primevue/chart";

export default defineComponent({
name: "EbonMightGraph",
components: {
    Chart
},
props: {
    ebonMightCasts: {
        type: Array<FightLocalizedTimeRange>,
        required: true
    },
    fight: Object as PropType<WarcraftLogsFight>
},
computed: {
    formattedEbonMightCasts() {
        return this.ebonMightCasts.flatMap((cast: FightLocalizedTimeRange) => {
            return [
                {
                    x: cast.start,
                    y: 1
                },
                {
                    x: cast.end,
                    y: 0
                },
            ];
        });
    },
    chartData() {
        console.log(this.formattedEbonMightCasts);
        return {
            datasets: [{
                label: 'State',
                data: this.formattedEbonMightCasts,/*[
                    {x: 0, y: 0}, // Start time, state 'off'
                    // Add your data points here, e.g., {x: 10, y: 1} represents 'on' at 10 seconds
                    {x: 600, y: 0} // ~10 minutes, state 'off'
                ],*/
                borderColor: 'red',
                //borderWidth: 3,
                fill: true,
                stepped: true, // Creates steps instead of linear line for boolean representation
            }]
        };
    },
    chartOptions() {
        return {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        stepSize: 60, // Represents each minute
                        callback: function(value, index, values) {
                            return `${value/60}m`; // Converts seconds to minutes for labeling
                        }
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Time (minutes)'
                    }
                },
                y: {
                    ticks: {
                        max: 1,
                        min: 0,
                        stepSize: 1,
                        callback: function(value, index, values) {
                            return value ? 'On' : 'Off'; // Converts numerical to 'On' / 'Off'
                        }
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'State'
                    }
                }
            },
            legend: {
                display: true // Set to true if you want to display legend
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        return tooltipItem.yLabel ? 'On' : 'Off';
                    }
                }
            }
        };
    }
},
methods: {
},
});
</script>
  