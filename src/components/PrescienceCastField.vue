<template>
    <InputGroup class="interval">
        <Button @click="removeCast()" icon="pi pi-trash" severity="danger"></Button>
        <div class="time-range">
            <InputMask v-model="startDisplay" mask="9:99" size="4" />
            <span>-</span>
            <InputMask v-if="showEnd" :disabled=true v-model="endDisplay" mask="9:99" size="4" />
            <span>{{ castDurationString }}</span>
        </div>
    </InputGroup>
</template>

<style scoped>
.time-range {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    column-gap: 5px;
}

span {
    font-size: 25px;
}
</style>

<script lang="ts">
import { type PropType, defineComponent } from "vue";
import type { PrescienceCast } from "@/types/PrescienceCast";
import { secondsToTime, timeToSeconds } from '@/helpers/Format';
import Button from 'primevue/button';
import InputGroup from 'primevue/inputgroup';
import InputMask from 'primevue/inputmask';

export default defineComponent({
    name: "PrescienceCastField",
    emits: {
        removeCast(payload: PrescienceCast) {
            return payload;
        }
    },
    components: {
        Button,
        InputGroup,
        InputMask
    },
    props: {
        cast: {
            type: Object as PropType<PrescienceCast>,
            required: true
        },
        isLongCast: {
            type: Boolean,
            required: true
        },
        buffDurationSeconds: {
            type: Number,
            required: true
        }
    },
    data(): {
        startDisplay: string,
        endDisplay: string,
        showEnd: boolean,
    } {
        return {
            startDisplay: secondsToTime(this.cast.duration.start, 1),
            endDisplay: secondsToTime(this.cast.duration.end, 1),
            showEnd: false,
        };
    },
    methods: {
        removeCast() {
            this.$emit('removeCast', this.cast);
        }
    },

    computed: {
        castDurationString(): string {
            return this.isLongCast ? "Long" : "Short";
        },
        castBuffDurationSeconds(): number {
            return this.buffDurationSeconds * (this.isLongCast ? 2 : 1);
        }
    },

    watch: {
        startDisplay: function (newDisplay: string, oldDisplay: string) {
            const sec = timeToSeconds(this.startDisplay);
            if (!sec) {
                return;
            }

            this.cast.duration.start = sec;
        },

        endDisplay: function (newDisplay: string, oldDisplay: string) {
            const sec = timeToSeconds(this.endDisplay);
            if (!sec) {
                return;
            }

            this.cast.duration.end = sec;
        },

        "cast.duration.start": {
            handler: function (newValue, oldValue) {
                this.startDisplay = secondsToTime(this.cast.duration.start, 1);
                this.cast.duration.end = this.cast.duration.start + this.castBuffDurationSeconds;
            },
            deep: true,
        },

        "cast.duration.end": {
            handler: function (newValue, oldValue) {
                this.endDisplay = secondsToTime(this.cast.duration.end, 1);
            },
            deep: true,
        }
    }
});
</script>
