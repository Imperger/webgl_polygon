<template>
    <div @click="SelectTab" :class="{ ['active-tab']: isActive }" class="mx-2 first:mx-0 last:mr-0 cursor-pointer">
        <slot></slot>
    </div>
</template>

<style scoped>
.active-tab {
    @apply text-purple-300;
}
</style>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

import { Tabs } from './MyTabs.vue';

export interface Tab {
    tabid: number;
    isActive: boolean;
}

@Component
export default class MyTab extends Vue implements Tab {
    @Prop({ required: true })
    public tabid!: number;

    public isActive = false;

    public SelectTab(): void {
        this.Parent.UpdateActiveTab(this.tabid);
    }

    private get Parent(): Tabs {
        return this.$parent as unknown as Tabs;
    }
}
</script>