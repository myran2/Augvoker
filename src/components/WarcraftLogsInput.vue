<template>
    <p v-if="error" style="color: red">{{ error }}</p>

    <div class="form-group">
        <label for="wclLink">WarcraftLogs Link</label>
        <input v-model="url" type="text" id="wclLink" name="wclLink">
    </div>

    <select v-model="selectedFightId" :disabled="fights.length == 0">
        <option disabled default value="">Select a fight...</option>
        <option v-for="fight in fights" :value="fight.id">#{{ fight.id }} - {{ fight.name }} ({{ !fight.kill ? fight.bossPercentage!/100 + '%' : 'Kill'}})</option>
    </select>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import WarcraftLogsReportService from "@/services/WarcraftLogsReportService";
import type WarcraftLogsReportResponse from "@/types/WarcraftLogsReportResponse";
import type WarcraftLogsFight from "@/types/WarcraftLogsFight";

export interface SelectFightPayload {
    'reportId': string;
    'fight': WarcraftLogsFight;
}

export default defineComponent({
  name: "WarcraftLogsInput",
  emits: {
    selectFight(payload: SelectFightPayload) {
        return payload.fight && payload.reportId;
    } 
  },
  data() {
    return {
        error: "",
        url: "",
        reportId: "",
        fights: [] as WarcraftLogsFight[],
        selectedFightId: "",
    };
  },
  methods: {
    processUrl(): boolean {
        const regexp = /^(?:https:\/\/)?(?:www\.)warcraftlogs.com\/reports\/(?<reportId>[a-zA-Z0-9]*)(?<extraParams>#.*)?$/;
        const found = this.url.match(regexp);
        if (!found || !found.groups) {
            return false;
        }

        this.selectedFightId = "";

        if (found.groups.extraParams) {
            const fight = found.groups.extraParams.match(/fight=(\d+|last)/);
            if (fight) {
                this.selectedFightId = fight[1];
            }
        }

        this.reportId = found.groups.reportId;

        return true;
    },

    retrieveWclReport() {
        if (this.reportId == "") {
            return;
        }

        WarcraftLogsReportService.get(this.reportId)
            .then((response: WarcraftLogsReportResponse) => {
                this.error = "";

                response.data.fights.forEach((fight: WarcraftLogsFight) => {
                    if (fight.boss !== 0) {
                        this.fights.push(fight);
                    }
                });

                if (this.selectedFightId == 'last' && this.fights.length > 0) {
                    this.selectedFightId = this.fights.slice(-1)[0].id.toString();
                }
            })
            .catch((e: Error) => {
                this.selectedFightId = "";
                this.reportId = "";
                this.fights = [] as WarcraftLogsFight[];

                this.error = e.name + ": " + e.message;
            });
    }
  },
  watch: {
    url(newUrl: string, oldUrl: string) {
        const processResult = this.processUrl();
        if (!processResult) {
            this.selectedFightId = "";
            this.reportId = "";
        }
    },

    reportId(newReportId: string, oldReportId: string) {
        this.retrieveWclReport();
    },

    selectedFightId(newFight: string, oldFight: string) {
        if (Number.isNaN(parseInt(this.selectedFightId))) {
            return;
        }

        const fight:WarcraftLogsFight = this.fights.find((f) => f.id === parseInt(this.selectedFightId))!;
        if (!fight) {
            return;
        }

        this.$emit("selectFight", {
            'reportId': this.reportId,
            'fight': fight,
        });
    }
  }
});
</script>
