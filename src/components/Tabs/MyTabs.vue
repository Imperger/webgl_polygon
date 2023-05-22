<template>
    <div class="flex">
        <slot></slot>
    </div>
</template>

<style scoped></style>

<script lang="ts">
import { Component, Vue, Model, Emit, Watch } from 'vue-property-decorator';

import { Tab } from './MyTab.vue';

export interface Tabs {
    UpdateActiveTab(_tab: number): void;
}

@Component
export default class MyTabs extends Vue implements Tabs {
    @Model('tabId', { required: true, type: Number })
    public readonly activeTab!: number;

    @Emit('tabId')
    public UpdateActiveTab(_tab: number) {}

    @Watch('activeTab')
    private ActiveTabChanged(_value: number, prev: number): void {
        this.SyncActiveTab(prev);
    }

    mounted(): void {
        this.SyncActiveTab(Number.POSITIVE_INFINITY);
    }

    private SyncActiveTab(prev: number): void {
        const prevTab = this.FindTab(prev);
        if (prevTab) {
            prevTab.isActive = false;
        }

        const nextActive = this.FindTab(this.activeTab);
        if (nextActive) {
            nextActive.isActive = true;
        }
    }

    private FindTab(tabId: number): Tab | null {
        return this.Tabs.find(tab => tab.tabid === tabId) ?? null;
    }

    private get Tabs(): Tab[] {
        return this.$children as unknown as Tab[];
    }
}
</script>
