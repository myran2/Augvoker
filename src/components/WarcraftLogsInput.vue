<template>
    <div class="log-fight-selector">
        <div class="header">
            <h2>Log and Fight Selection</h2>
        </div>
        <template v-if="error">
            <Message severity="error">{{ error }}</Message>
        </template>

        <div class="input">
            <label for="username">Warcraft Logs Report Link</label>
            <InputText id="wclLink" v-model="url" :class="{'p-invalid': !urlValid}"/>
        </div>

        <div class="sub-elements">
            <Dropdown v-model="selectedFight" :loading=fightsLoading :options="fights" placeholder="Select a Fight" class="w-full md:w-14rem">
                <template #value="slotProps">
                    <div v-if="slotProps.value" class="flex align-items-center">
                        <div>#{{ slotProps.value.displayNumber }} - {{ slotProps.value.name }} ({{ !slotProps.value.kill ? (slotProps.value.fightPercentage / 100) + '%' : 'Kill' }})</div>
                    </div>
                    <span v-else>
                        {{ slotProps.placeholder }}
                    </span>
                </template>
                <template #option="slotProps">
                    <div class="flex align-items-center">
                        <div>#{{ slotProps.option.displayNumber }} - {{ slotProps.option.name }} ({{ !slotProps.option.kill ? (slotProps.option.fightPercentage / 100) + '%' : 'Kill' }})</div>
                    </div>
                </template>
            </Dropdown>

            <div class="right-group">
                <div>
                    <label for="damageTarget">Include Damage Done to:</label>
                    <Dropdown
                        id="damageTarget"
                        v-model="damageTarget"
                        :options="damageTargetOptions"
                    >
                    </Dropdown>
                </div>
                <div>
                    <label for="selectedAugvoker">Augvoker Name:</label>
                    <Dropdown
                        id="selectedAugvoker"
                        v-model="selectedAugvoker"
                        :options="fightAugvokers"
                        :loading="fightsLoading"
                        placeholder="Select an Augvoker"
                    >
                    <template #value="slotProps">
                        <div v-if="slotProps.value" class="flex align-items-center">
                            <div>{{ slotProps.value.name }}</div>
                        </div>
                        <span v-else>
                            {{ slotProps.placeholder }}
                        </span>
                    </template>
                    <template #option="slotProps">
                        <div class="flex align-items-center">
                            <div>{{ slotProps.option.name }}</div>
                        </div>
                    </template>
                    </Dropdown>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.log-fight-selector {
    width: 100%;

    .input {
        display: flex; flex-flow: column;
        padding-bottom: 5px;
    }
    .sub-elements {
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-between;
        align-items: flex-start;

        .right-group {
            display: flex;
            flex-flow: column nowrap;
            row-gap: 10px;
            align-items: flex-end;
            label {
                padding-right: 5px
            }
        }
    }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import WarcraftLogsReportService from "@/services/WarcraftLogsReportService";
import type WarcraftLogsReportResponse from "@/types/WarcraftLogsReportResponse";
import type WarcraftLogsFight from "@/types/WarcraftLogsFight";
import DamageTargetOptions from "@/types/DamageTargetOptions";
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Checkbox from 'primevue/checkbox';
import type WarcraftLogsFriendly from "@/types/WarcraftLogsFriendly";

export interface SelectFightPayload {
    'reportId': string;
    'fight': WarcraftLogsFight;
    'damageTarget': DamageTargetOptions;
}

export default defineComponent({
  name: "WarcraftLogsInput",
  emits: {
    selectFight(payload: SelectFightPayload) {
        return payload.fight && payload.reportId;
    },
    selectAugvoker(payload: WarcraftLogsFriendly) {
        return payload;
    }
  },
  components: {
    Dropdown,
    InputText,
    Message,
    Checkbox,
  },
  data() : {
    error: string,
    url: string,
    urlValid: boolean,
    fights: WarcraftLogsFight[],
    reportId: string,
    selectedFight: WarcraftLogsFight | null,
    damageTarget: DamageTargetOptions,
    fightsLoading: boolean,
    selectedAugvoker: WarcraftLogsFriendly|null,
    fightAugvokers: WarcraftLogsFriendly[],
  } {
    return {
        error: "",
        url: "",
        urlValid: true,
        fights: [] as WarcraftLogsFight[],
        reportId: "",
        selectedFight: null,
        damageTarget: DamageTargetOptions.BossOnly,
        fightsLoading: false,
        selectedAugvoker: null,
        fightAugvokers: [],
    };
  },
  computed: {
    damageTargetOptions() {
        return Object.values(DamageTargetOptions);
    }
  },
  methods: {
    processUrl(): boolean {
        const regexp = /^(?:https:\/\/)?(?:www\.)warcraftlogs.com\/reports\/(?<reportId>[a-zA-Z0-9]*)(?<extraParams>#.*)?$/;
        const found = this.url.match(regexp);
        if (!found || !found.groups) {
            return false;
        }

        let fightString = null;

        if (found.groups.extraParams) {
            const fightMatch = found.groups.extraParams.match(/fight=(\d+|last)/);
            if (fightMatch) {
                fightString = fightMatch[1];
            }
        }

        this.reportId = found.groups.reportId;
        this.retrieveWclReport(fightString);
        return true;
    },

    retrieveWclReport(fightString: string | null) {
        if (this.reportId == "") {
            return;
        }

        this.fightsLoading = true;
        WarcraftLogsReportService.get(this.reportId)
            .then((response: WarcraftLogsReportResponse) => {
                this.error = "";

                this.fightAugvokers = response.data.friendlies.filter((friendly) => {
                    return friendly.icon === "Evoker-Augmentation";
                }).map(friendly => { return friendly });

                let pullNumbers: { [id: string] : number; } = {};
                response.data.fights.forEach((fight: WarcraftLogsFight) => {
                    if (fight.boss !== 0) {
                        const encounterId_difficulty = `${fight.boss}_${fight.difficulty}`;
                        if (! pullNumbers[encounterId_difficulty]) {
                            pullNumbers[encounterId_difficulty] = 1;
                        }
                        fight.displayNumber = pullNumbers[encounterId_difficulty]++;
                        this.fights.push(fight);

                        if (fightString && fightString !== 'last') {
                            if (parseInt(fightString) === fight.id) {
                                this.selectedFight = fight;
                            }
                        }
                    }
                });

                if (fightString == 'last' && this.fights.length > 0) {
                    this.selectedFight = this.fights.slice(-1)[0];
                }

                this.fightsLoading = false;
            })
            .catch((e: Error) => {
                this.selectedFight = null
                this.reportId = "";
                this.fights = [];

                this.urlValid = false;

                this.error = e.name + ": " + e.message;

                this.fightsLoading = false;
            });
    }
  },
  watch: {
    url(newUrl: string, oldUrl: string) {
        this.urlValid = this.processUrl();
        if (!this.urlValid) {
            this.selectedFight = null;
            this.reportId = "";
            this.fights = [];
            this.fightsLoading = false;
        }

        this.selectedAugvoker = null;
    },

    selectedFight(newFight: WarcraftLogsFight, oldFight: WarcraftLogsFight) {
        if (! this.selectedFight) {
            return;
        }

        this.$emit("selectFight", {
            'reportId': this.reportId,
            'fight': this.selectedFight,
            'damageTarget': this.damageTarget,
        });
    },

    damageTarget(newVal, oldVal) {
        if (! this.selectedFight) {
            return;
        }

        this.$emit("selectFight", {
            'reportId': this.reportId,
            'fight': this.selectedFight,
            'damageTarget': this.damageTarget,
        });
    },

    selectedAugvoker(newVal, oldVal) {
        if (!this.selectedAugvoker) {
            return;
        }
        this.$emit('selectAugvoker', this.selectedAugvoker);
    },
  }
});
</script>
