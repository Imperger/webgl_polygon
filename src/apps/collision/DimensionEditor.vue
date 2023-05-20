<template>
    <div class="field-dimension-editor">
        <div>
            <span :class="{ 'caption-validation-error': IsInvalidFIeldDimensionValue(innerDimension.Width) }"
                class="inline-block mr-2 w-3">W</span>
            <input type="number" :class="{ 'input-validation-error': IsInvalidFIeldDimensionValue(innerDimension.Width) }"
                v-model.number="innerDimension.Width" class="pl-1" min="10" max="1000000">
        </div>
        <div class="mt-1">
            <span :class="{ 'caption-validation-error': IsInvalidFIeldDimensionValue(innerDimension.Height) }" class="inline-block mr-2 w-3">H</span>
            <input type="number" :class="{ 'input-validation-error': IsInvalidFIeldDimensionValue(innerDimension.Height) }"
                v-model.number="innerDimension.Height" class="pl-1" min="10" max="1000000">
        </div>
        <div class="flex">
            <button @click="Apply(innerDimension)">Apply</button>
            <button @click="Cancel" class="ml-5">Cancel</button>
        </div>
    </div>
</template>

<style scoped>
.field-dimension-editor {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0);
    top: 10px;
    width: 80%;
    padding: 10px;
    background-color: #128dd4;
}
</style>

<script lang="ts">
import { Component, Vue, Prop, Emit } from 'vue-property-decorator';

import { Dimension } from '@/lib/misc/Primitives';

@Component
export default class extends Vue {
    @Emit('apply')
    public Apply(_dimension: Dimension): void { /** */ }

    @Emit('cancel')
    public Cancel(): void { /** */ }

    @Prop()
    public dimension!: Dimension;

    public innerDimension: Dimension = { Width: 0, Height: 0 }

    public mounted(): void {
        this.innerDimension = this.dimension;
    }

    public IsInvalidFIeldDimensionValue(value: number) {
        return value < 10 || value > 100000;
    }
}
</script>