<template>
    <div class="log-fight-selector">
        <h2>Log and Fight Selection</h2>
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
                        <div>#{{ slotProps.value.id }} - {{ slotProps.value.name }} ({{ !slotProps.value.kill ? (slotProps.value.fightPercentage / 100) + '%' : 'Kill' }})</div>
                    </div>
                    <span v-else>
                        {{ slotProps.placeholder }}
                    </span>
                </template>
                <template #option="slotProps">
                    <div class="flex align-items-center">
                        <div>#{{ slotProps.option.id }} - {{ slotProps.option.name }} ({{ !slotProps.option.kill ? (slotProps.option.fightPercentage / 100) + '%' : 'Kill' }})</div>
                    </div>
                </template>
            </Dropdown>

            <div class="right-group">
                <div class="boss-only-toggle">
                    <Checkbox v-model="bossOnly" :binary="true" />
                    <label for="bossOnly">Only Include Damage Done to Bosses</label>
                </div>
                <div>
                    <label for="selectedAugvoker" style="padding-right: 5px">Augvoker Name</label>
                    <Dropdown id="selectedAugvoker" v-model="selectedAugvoker" :options="fightAugvokers" :loading="fightsLoading" placeholder="Augvoker Name" editable>
                    </Dropdown>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.log-fight-selector {
    padding-bottom: 3%;

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
        }
    }

    .boss-only-toggle {
        display: flex;
        flex-flow: row nowrap;
        justify-content: center;

        label {
            padding-left: 5px;
        }
    }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import WarcraftLogsReportService from "@/services/WarcraftLogsReportService";
import type WarcraftLogsReportResponse from "@/types/WarcraftLogsReportResponse";
import type WarcraftLogsFight from "@/types/WarcraftLogsFight";
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Checkbox from 'primevue/checkbox';

export interface SelectFightPayload {
    'reportId': string;
    'fight': WarcraftLogsFight;
    'bossOnly': boolean;
}

export default defineComponent({
  name: "WarcraftLogsInput",
  emits: {
    selectFight(payload: SelectFightPayload) {
        return payload.fight && payload.reportId;
    },
    selectAugvoker(payload: string) {
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
    bossOnly: boolean,
    fightsLoading: boolean,
    selectedAugvoker: string,
    fightAugvokers: string[],
  } {
    return {
        error: "",
        url: "",
        urlValid: true,
        fights: [] as WarcraftLogsFight[],
        reportId: "",
        selectedFight: null,
        bossOnly: true,
        fightsLoading: false,
        selectedAugvoker: "",
        fightAugvokers: [],
    };
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
                }).map(friendly => { return friendly.name });

                response.data.fights.forEach((fight: WarcraftLogsFight) => {
                    if (fight.boss !== 0) {
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
                this.fights = [] as WarcraftLogsFight[];

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
            this.fights = [] as WarcraftLogsFight[];
            this.fightsLoading = false;
        }
    },

    selectedFight(newFight: WarcraftLogsFight, oldFight: WarcraftLogsFight) {
        if (! this.selectedFight) {
            return;
        }

        this.$emit("selectFight", {
            'reportId': this.reportId,
            'fight': this.selectedFight,
            'bossOnly': this.bossOnly,
        });
    },

    bossOnly(newVal, oldVal) {
        if (! this.selectedFight) {
            return;
        }

        this.$emit("selectFight", {
            'reportId': this.reportId,
            'fight': this.selectedFight,
            'bossOnly': this.bossOnly,
        });
    },

    selectedAugvoker(newVal, oldVal) {
        this.$emit('selectAugvoker', this.selectedAugvoker);
    }
  }
});
</script>
