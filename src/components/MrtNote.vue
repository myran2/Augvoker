<template>
    <div class="mrt-note" v-if="noteContents.length > 0">
        <h2>MRT Note</h2>
        <span>Intended for use with <a target="_blank" href="https://wago.io/yrmx6ZQSG">this WeakAura</a>.</span><br>
        <span>Ebon Might Reminders are formatted for use with <a target="_blank" href="https://wago.io/n7l5uN3YM">Kaze's MRT WeakAura.</a></span>
        <Textarea v-model="noteContents" readonly cols="5"/>
    </div>
</template>
  
<style scoped>
.mrt-note {
    padding-top: 3%;
    textarea {
        width: 100%;
        height: 150px;
        resize: vertical;
    }
}
</style>
  
<script lang="ts">
import { type PropType, defineComponent } from "vue";
import { secondsToTime, timeToSeconds, getColor, colorize, formatDamageNumber } from '@/helpers/Format';
import type { Damager, DamagerInterval } from '@/types/DamagerInterval';
import type FightLocalizedTimeRange from "@/types/FightLocalizedTimeRange";
import Textarea from 'primevue/textarea';

export default defineComponent({
name: "MrtNote",
components: {
    Textarea
},
props: {
    topDamagersByTime: {
        type: Array<DamagerInterval>,
        required: true,
    },
    augvokerName: {
        type: String,
        required: true,
    },
    unclaimedPresciences: {
        type: Array<FightLocalizedTimeRange>,
        required: true,
    },
},
methods: {
    // just grabs the 3 most common names in the topDamagers table.
    getDefaultTargets(count: number): string[] {
        const nameCounts = new Map();
        this.topDamagersByTime.map((interval: DamagerInterval) => {
            return interval.damagers.forEach((damager: Damager) => {
                const colorizedName = colorize(damager.name, damager.class);
                nameCounts.set(colorizedName, (nameCounts.get(colorizedName) || 0) + 1);
            })
        });

        const sortedNames = [...nameCounts.entries()].sort((a, b) => b[1] - a[1]);
        return sortedNames.slice(0, count).map((entry) => entry[0]);
    },
},
computed: {
    noteContents() {
        if (!this.topDamagersByTime.length) {
            return "";
        }
        let mrtLines: string[] = [];
        let ebonMightLines: string[] = ['|cffff00ff--- Ebon Might Reminders---|r'];

        const onPullDamagers = this.topDamagersByTime[0].damagers.slice(0,2)
        .map((damager: Damager) => {
            return colorize(damager.name, damager.class);
        }).join(' ')
        mrtLines.push(`PULL - ${onPullDamagers}`);

        this.topDamagersByTime.slice(1).forEach((interval: DamagerInterval) => {
            ebonMightLines.push(`{time:${secondsToTime(interval.start)}}EM - ${colorize(this.augvokerName, 'evoker')} {spell:404269}  `);

            // skip really short time intervals
            if ((interval.end - interval.start) <= 3) {
                return;
            }

            let mrtLine: string[] = [];
            let prevPrescTimestamp: number = -1;
            interval.damagers.forEach((damager: Damager) => {
                if (damager.prescTimestamp === null) {
                    return;
                }

                // multiple presciences assigned at the same time
                if (Math.abs(prevPrescTimestamp - damager.prescTimestamp) <= 3) {
                    mrtLine.push(colorize(damager.name, damager.class));
                    if (mrtLine.length > 2) {
                        console.warn('More than 2 presciences assigned at the same timestamp', interval);
                    }
                } else {
                    if (mrtLine.length) {
                        // write previous line now that we're done with it
                        mrtLines.push(mrtLine.join(" "));
                    }

                    const displayTimestamp: string = secondsToTime(damager.prescTimestamp);
                    mrtLine = [`${displayTimestamp} - ${colorize(damager.name, damager.class)}`];
                }
                prevPrescTimestamp = damager.prescTimestamp;
            });
            // flush any remaining lines
            if (mrtLine.length) {
                mrtLines.push(mrtLine.join(" "));
            }
        })

        this.unclaimedPresciences.forEach((cast: FightLocalizedTimeRange) => {
            // mrtLines.push(`${secondsToTime(cast.start)} - ${this.getGoodColorizedPrescienceTarget(cast)}`);
            mrtLines.push(`${secondsToTime(cast.start)} - |cffff00ffdefault_target|r`);
        });
        mrtLines.sort((a: string, b: string) => {
            const aTimestamp = a.split(" - ")[0];
            const bTimestamp = b.split(" - ")[0];
            return timeToSeconds(aTimestamp) - timeToSeconds(bTimestamp);
        });
        mrtLines.unshift(`defaultTargets - ${this.getDefaultTargets(3).join(' ')}`);
        mrtLines.unshift('prescGlowsStart');
        mrtLines.push('prescGlowsEnd\n');
        mrtLines.push(ebonMightLines.join('\n'));
        return mrtLines.join('\n');
},
}
});
</script>
  