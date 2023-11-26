<template>
    <div class="home">
        <h1>Augvoker Log Analysis Thing</h1>
        <Message severity="info">
            Damage attribution in 10.2 is mostly fixed now. There are still a few inaccuracies, but it should be mostly fine.<br>
            You can check <a target="_blank" href="https://gist.github.com/ljosberinn/a2f08a53cfe8632a18350eea44e9da3e">this doc</a> or the <span style="font-family: monospace; font-weight: bold;">#augmentation</span> channel of the <a target="_blank" href="https://discord.gg/evoker">Evoker discord</a> for updates.
        </Message>
        <WarcraftLogsInput @select-fight="wclFightSelected" />
        <template v-if="fight">
            <TimeSelector 
                :durationSeconds="fight.end_time - fight.start_time" 
                :skipTimeIntervals="skipTimeIntervals"
            />

            <div>
                <Button id="calculate" label="Calculate" severity="success" :loading="loading" @click="fillDamageDoneTable()"/>
            </div>
        </template>

        <div class="mrt-note" v-if="mrtNote">
            <h2>MRT Note</h2>
            <span>Intended for use with <a target="_blank" href="https://wago.io/yrmx6ZQSG">this WeakAura</a>.</span>
            <Textarea v-model="mrtNote" cols="100" autoResize />
        </div>

        <div v-if="tableValues.length > 0" class="damage-done-table">
            <DataTable stripedRows :value="tableValues">
                <Column field="timeRange" header="Time"></Column>
                <Column field="player1" header="Player - Damage"></Column>
                <Column field="player2" header="Player - Damage"></Column>
                <Column field="player3" header="Player - Damage"></Column>
                <Column field="player4" header="Player - Damage"></Column>
            </DataTable>
        </div>
    </div>
</template>

<style scoped>
.home {
    #calculate {
        width: 100%;
    }

    .mrt-note {
        padding-top: 3%;
        textarea {
            width: 100%;
        }
    }

    .damage-done-table {
        padding-top: 3%;
    }
}
</style>
  
<script lang="ts">
import { defineComponent } from 'vue'
import WarcraftLogsInput, { type SelectFightPayload } from '@/components/WarcraftLogsInput.vue';
import WarcraftLogsDamageDoneService from '@/services/WarcraftLogsDamageDoneService';
import type WarcraftLogsDamageDoneResponse from '@/types/WarcraftLogsDamageDoneResponse';
import TimeSelector from '@/components/TimeSelector.vue';
import { type TimeIntervalSeconds } from '@/components/HumanReadableSeconds.vue';
import type WarcraftLogsFight from '@/types/WarcraftLogsFight';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Message from 'primevue/message';

interface WclDamager {
    name: string;
    damage: number;
    class: string;
}

interface DamagerInterval {
    start: number;
    end: number;
    damagers: WclDamager[];
}

export default defineComponent({
    name: 'HomeView',
    components: {
        WarcraftLogsInput,
        TimeSelector,
        Button,
        Textarea,
        DataTable,
        Column,
        Message,
    },
    data() : {
        reportId: string,
        fight: WarcraftLogsFight | null
        bossOnly: boolean,
        timeInterval: number,
        skipTimeIntervals: TimeIntervalSeconds[],
        topDamagersByTime: DamagerInterval[],
        tableValues: Array<Object>,
        ignoreSpellIds: Array<Number>,
        loading: boolean,
        mrtNote: string,
        damagersPerRow: number,
    } {
        return {
            'reportId': '',
            'fight': null,
            'bossOnly': true,
            timeInterval: 30,
            skipTimeIntervals: [{start: 0, end: 0}],
            topDamagersByTime: [],
            tableValues: [],
            loading: false,
            mrtNote: "",
            ignoreSpellIds: [
            409632, // Breath of Eons
            402583, // Beacon
            408682, // Dragonfire Bomb Dispenser
            408694, // Dragonfire Bomb Dispenser
            401324, // Pocket Anvil (Echoed Flare)
            401306, // Pocket Anvil (Anvil Strike)
            401422, // Vessel of Searing Shadow (Shadow Spike)
            401428, // Vessel of Searing Shadow (Ravenous Shadowflame)
            418774, // Mirror of Fractured Tomorrows ()
            418588, // Mirror of Fractured Tomorrows (Sand Cleave)
            419591, // Mirror of Fractured Tomorrows (Auto Attack)
            418607, // Mirror of Fractured Tomorrows (Sand Bolt)
            406251, // Roiling Shadowflame
            406889, // Roiling Shadowflame (Self Harm)
            379403, // Toxic Thorn Footwraps (Launched Thorns)
            408791, // Ashkandur, Fall of the Brotherhood
            378426, // Slimy Expulsion Boots boots (Corrosive Slime)
            381006, // Acidic Hailstone Treads (Deep Chill)
            381700, // Forgestorm (Forgestorm Ignited)
            406764, // Shadowflame Wreathe
            394453, // Broodkeeper's Blaze
            370794, // Unstable Frostfire Belt (Lingering Frostspark)
            408836, // Djaruun, Pillar of the Elder Flame
            408815, // Djaruun, Pillar of the Elder Flame
            381475, // Erupting Spear Fragment
            281721, // Bile-Stained Crawg Tusks (Vile Bile)
            214397, // Mark of Dargrul (Landslide)
            408469, // Call to Suffering (Self Harm)
            374087, // Glacial Fury
            370817, // Shocking Disclosure
            426564, // Augury of the Primal Flame (Annihilating Flame)
            417458, // Accelerating Sandglass
            424965, // Thorn Spirit
            425181, // Thorn Blast
            419737, // Timestrike
            265953, // Touch of Gold
            425154, // Vicious Brand
            425156, // Radiating Brand
            422146, // Solar Maelstrom
            426341, // Tindral's Fowl Fantasia
            426431, // Denizen Of The Flame
            426486, // Denizen Of The Flame Final
            426339, // Igiras Cruel Nightmare
            426527, // Flaying Torment
            259756, // Entropic Embrace
            427209, // Web of Dreams
            422956, // Essence Splice
            424324, // Hungering Shadowflame
            419279, // Extinction Blast
            215444, // Dark Blast
            214168, // Brutal Haymaker
            214169, // Brutal Haymaker
            228784, // Brutal Haymaker Vulnerability
            214350, // Nightmare Essence
            422750, // Shadowflame Rage
            425701, // Shadowflame Lash Enemy
            422750, // Tainted Heart
            425461, // Tainted Heart Enemy Damage
            417458, // Accelerating Sandglass
            215407, // Dark Blast
            270827, // Webweavers Soul Gem
            213785, // Nightfall
            ],
            damagersPerRow: 2,
        };
    },
    methods: {
        wclFightSelected(payload: SelectFightPayload) {
            this.reportId = payload.reportId;
            this.fight = payload.fight;
            this.bossOnly = payload.bossOnly;
            this.skipTimeIntervals = [];
            this.mrtNote = "";
            this.tableValues = [];
            this.topDamagersByTime = [];

            if (this.fight && this.fight.name == "Scalecommander Sarkareth") {
                // Prefill skip intervals for P1->P2 and P2->P3 intermissions by default.
                this.skipTimeIntervals = [{ start: 105, end:135 }, { start: 235, end: 255 }];
            }
        },

        // TODO: run this again with only the blacklisted abilities, but cut everything by 50 (to account for damage gained by the vers buff)%
        async storeTopDamagersForInterval(start: number, end: number): Promise<any> {
            const abilityBlacklist = `ability.id NOT IN (${this.ignoreSpellIds.join(', ')})`;
            return WarcraftLogsDamageDoneService.get(this.reportId, start, end, this.bossOnly, abilityBlacklist)
            .then((response: WarcraftLogsDamageDoneResponse) => {
                const sortedPlayers = response.data.entries.sort((a:any, b:any) => {
                    if (a.icon == 'Evoker-Augmentation') {
                        return 1;
                    }
                    if (b.icon == 'Evoker-Augmentation') {
                        return -1;
                    }

                    return b.total - a.total;
                });

                let damagersByTime:DamagerInterval = {
                    start: (start - this.fight!.start_time) / 1000,
                    end: (end - this.fight!.start_time) / 1000,
                    damagers: sortedPlayers.slice(0, 4).map(player => {
                        return {
                            name: player.name,
                            class: player.icon.split('-')[0],
                            damage: player.total,
                        } as WclDamager;
                    })
                }

                this.topDamagersByTime.push(damagersByTime);
            })
            .catch((e: Error) => {
                console.log(e);
            });
        },

        secondsToTime(seconds: number): string {
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        },

        colorize(playerName: string, playerClass: string): string {
            playerClass = playerClass.toLowerCase()
            let colorString = ""
            switch(playerClass) {
                case "deathknight":
                    colorString = "C41E3A";
                    break;
                case "demonhunter":
                    colorString = "A330C9";
                    break;
                case "druid":
                    colorString = "FF7C0A";
                    break;
                case "evoker":
                    colorString = "33937F";
                    break;
                case "hunter":
                    colorString = "AAD372";
                    break;
                case "mage":
                    colorString = "3FC7EB";
                    break;
                case "monk":
                    colorString = "00FF98";
                    break;
                case "paladin":
                    colorString = "F48CBA";
                    break;
                case "priest":
                    colorString = "FFFFFF";
                    break;
                case "rogue":
                    colorString = "FFF468";
                    break;
                case "shaman":
                    colorString = "0070DD";
                    break;
                case "warlock":
                    colorString = "8788EE";
                    break;
                case "warrior":
                    colorString = "C69B6D";
                    break;
                default:
                    colorString = "FFFFFF";
                    break;
            }

            return `|cff${colorString.toLowerCase()}${playerName}|r`;
        },

        makeMrtNote(damagersPerRow: number) {
            if (!this.topDamagersByTime) {
                return;
            }

            let mrtLines: string[] = ['prescGlowsStart'];
            this.topDamagersByTime.forEach(interval => {
                let timeStr = this.secondsToTime(interval.start);
                if (timeStr === "00:00") {
                    timeStr = "PULL";
                }

                if (interval.damagers.length < damagersPerRow) {
                    return;
                }

                let mrtLine: Array<string> = [];
                interval.damagers.slice(0, damagersPerRow).forEach(damager => {
                    mrtLine.push(this.colorize(damager.name, damager.class));
                });

                mrtLines.push(`${timeStr} - ${mrtLine.join(' ')}`);
            })

            mrtLines.push('prescGlowsEnd');
            this.mrtNote = mrtLines.join('\n');
        },

        formatDamagersForPresentation() {
            this.tableValues = [];
            this.topDamagersByTime.forEach((row: DamagerInterval) => {
                if (row.damagers.length < 4) {
                    return;
                }

                this.tableValues.push({
                    timeRange: `${this.secondsToTime(row.start)} - ${this.secondsToTime(row.end)}`,
                    player1: `${row.damagers[0].name} - ${row.damagers[0].damage.toLocaleString(undefined)}`,
                    player2: `${row.damagers[1].name} - ${row.damagers[1].damage.toLocaleString(undefined)}`,
                    player3: `${row.damagers[2].name} - ${row.damagers[2].damage.toLocaleString(undefined)}`,
                    player4: `${row.damagers[3].name} - ${row.damagers[3].damage.toLocaleString(undefined)}`,
                });
            });
        },

        fillDamageDoneTable() {
            if (!this.fight) {
                return;
            }

            const fightStartTime = this.fight.start_time;
            const fightEndTime = this.fight.end_time;


            this.topDamagersByTime = [];
            let start = 0;
            let end = this.timeInterval;
            this.loading = true;
            let damageDoneRequests = [];
            while (start < (fightEndTime - fightStartTime) / 1000) {
                const startTimestamp = fightStartTime + (start * 1000);
                const endTimestamp = Math.min(fightEndTime, fightStartTime + (end * 1000));

                damageDoneRequests.push(this.storeTopDamagersForInterval(startTimestamp, endTimestamp));

                start = end
                end += this.timeInterval;

                this.skipTimeIntervals.forEach(interval => {
                    if (interval.start === interval.end) {
                        return;
                    }

                    // current interval starts inside of a skipped interval:
                    // change start to end of skipped interval
                    if (interval.start <= start && start <= interval.end) {
                        start = interval.end;
                        end = start + this.timeInterval;
                    }

                    // current interval ends inside of a skipped interval:
                    // change end to beginning of interval.
                    if (interval.start <= end && end <= interval.end) {
                        end = interval.start;
                    }
                });
            }

            Promise.all(damageDoneRequests).then(results => {
                this.topDamagersByTime.sort((a, b) => {
                    return a.start - b.start;
                });

                this.makeMrtNote(this.damagersPerRow);

                this.formatDamagersForPresentation();

                this.loading = false;
            });
        }
    }
})
</script>
  