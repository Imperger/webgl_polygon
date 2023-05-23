<template>
    <aside :class="{ minimized: isMinimized }">
        <button @click="ToggleMinimize" class="w-8 h-8 absolute block p-0 -right-8 top-0 cursor-pointer rounded-r bg-inherit">
            <fa-icon v-if="!isMinimized" icon="minus"></fa-icon>
            <span v-else>{{ appState.fps }}</span>
        </button>
        <div class="absolute text-xs">
            <span>FPS: {{ appState.fps }}</span>
        </div>
        <h3 class="text-center">Collision</h3>
        <my-help-popup />
        <fieldset class="border border-y-slate-200 border-x-transparent p-2">
            <legend>Detection engine</legend>
            <div>
                <input id="QuadTree" type="radio" name="detectionEngine" value="quad-tree" v-model="appState.engine" />
                <label for="QuadTree">Quad tree</label>
            </div>
            <div>
                <input id="BruteForce" type="radio" name="detectionEngine" value="brute-force" v-model="appState.engine" />
                <label for="BruteForce">Brute-force</label>
            </div>
        </fieldset>
        <my-tabs v-model="settingsTab" class="mb-2">
            <my-tab :tabid="Tab.Bodies">Bodies</my-tab>
            <my-tab :tabid="Tab.Boundary">Boundary</my-tab>
            <my-tab :tabid="Tab.Engine">Engine</my-tab>
        </my-tabs>
        <my-bodies-settings v-if="IsBodiesTab" v-model="appState.bodies" />
        <my-boundary-settings v-else-if="IsBoundaryTab" v-model="appState.boundary" />
        <div v-else-if="IsEngineTab">
            <label for="showEngineInternals" class="mr-2">Show engine internals</label>
            <input id="showEngineInternals" type="checkbox" v-model="appState.showEngineInternals" min="1" max="500"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div class="flex justify-between">
            <button @click="TogglePause">
                <fa-icon :icon="togglePauseIcon" />
            </button>
            <button @click="ApplySettings" :disabled="!CanApplySettings()" class="">
                <fa-icon icon="save"></fa-icon>
            </button>
        </div>
    </aside>
</template>

<style scoped>
aside {
    position: absolute;
    padding: 10px;
    margin: 0;
    background-color: #0277bd;
    color: #f5f5f5;
    list-style-type: none;
    transition: 0.6s;
}

.minimized {
    transform: translateX(-208px);
    transition: 0.6s;
}
</style>

<script lang="ts">
import {
    Component,
    Vue,
    Prop,
    Watch,
    Model,
    Emit
} from 'vue-property-decorator';

import { App } from './App';
import { SupportedCollisionEngine } from './collision_engines/CollisionEngineFactory';
import { AppEvent } from './Events';
import MyBodiesSettings from './MyBodiesSettings.vue';
import MyBoundarySettings from './MyBoundarySettings.vue';
import MyHelpPopup from './MyHelpPopup.vue';
import { AppState } from './View.vue';

import { MyTab, MyTabs } from '@/components/Tabs';

enum TabId {
    Bodies,
    Boundary,
    Engine
}

@Component({
    components: {
        MyBodiesSettings,
        MyBoundarySettings,
        MyHelpPopup,
        MyTabs,
        MyTab
    }
})
export default class MyAsidePanel extends Vue {
    public readonly Tab = TabId;

    @Model('updateAppState')
    public appState!: AppState;

    @Emit('updateAppState')
    public UpdateModelState(_state: AppState) { }

    @Prop()
    public app!: App;

    public settingsTab = TabId.Bodies;

    private togglePauseIcons = ['pause', 'play'];
    public togglePauseIcon = this.togglePauseIcons[+false];

    public isMinimized = false;

    @Watch('appState.engine')
    private CollisionEngineChange(
        value: SupportedCollisionEngine,
        _prev: SupportedCollisionEngine
    ): void {
        this.app.SwitchCollisionEngine(value);
    }

    @Watch('appState.showEngineInternals')
    private ShowEngineInternalsChange(value: boolean, _prev: boolean): void {
        this.app.IsEngineRendererEnabled = value;
    }

    mounted(): void {
        App.EventBus.Subscribe(
            AppEvent.TogglePause,
            pause => (this.togglePauseIcon = this.togglePauseIcons[+pause])
        );
    }

    public ToggleMinimize(): void {
        this.isMinimized = !this.isMinimized;
    }

    public ApplySettings(): void {
        if (
            this.IsFieldBoundaryWidthDiffer() ||
            this.IsFieldBoundaryHeightDiffer()
        ) {
            this.app.ResizeField({
                Width: this.appState.boundary.width.value,
                Height: this.appState.boundary.height.value
            });
        }

        if (this.IsBodiesCountDiffer()) {
            this.app.BodiesCount = this.appState.bodies.count.value;
        }

        if (this.IsBodiesRadiusDiffer()) {
            this.app.BodiesRadius = this.appState.bodies.radius.value;
        }

        this.$forceUpdate();
    }

    public TogglePause(): void {
        this.app.Pause = !this.app.Pause;
        this.togglePauseIcon = this.togglePauseIcons[+this.app.Pause];
    }
    public get IsBodiesTab(): boolean {
        return this.settingsTab === TabId.Bodies;
    }

    public get IsBoundaryTab(): boolean {
        return this.settingsTab === TabId.Boundary;
    }

    public get IsEngineTab(): boolean {
        return this.settingsTab === TabId.Engine;
    }

    public CanApplySettings(): boolean {
        return (
            this.appState.boundary.width.isValid &&
            this.appState.boundary.height.isValid &&
            this.appState.bodies.count.isValid &&
            this.appState.bodies.radius.isValid &&
            this.IsSettingsDiffer()
        );
    }

    private IsSettingsDiffer(): boolean {
        return (
            this.IsFieldBoundaryWidthDiffer() ||
            this.IsFieldBoundaryHeightDiffer() ||
            this.IsBodiesCountDiffer() ||
            this.IsBodiesRadiusDiffer()
        );
    }

    private IsFieldBoundaryWidthDiffer(): boolean {
        return this.app.FieldBoundary.Width !== this.appState.boundary.width.value;
    }

    private IsFieldBoundaryHeightDiffer(): boolean {
        return (
            this.app.FieldBoundary.Height !== this.appState.boundary.height.value
        );
    }

    private IsBodiesCountDiffer(): boolean {
        return this.app.BodiesCount !== this.appState.bodies.count.value;
    }

    private IsBodiesRadiusDiffer(): boolean {
        return this.app.BodiesRadius !== this.appState.bodies.radius.value;
    }
}
</script>
