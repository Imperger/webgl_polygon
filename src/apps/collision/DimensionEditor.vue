<template>
    <div class="field-dimension-editor">
        <div class="input-group">
            <span :class="{ 'caption-validation-error': IsInvalidFIeldDimensionValue(innerDimension.Width) }"
                class="input-title">W</span>
            <input type="number" :class="{ 'input-validation-error': IsInvalidFIeldDimensionValue(innerDimension.Width) }"
                v-model.number="innerDimension.Width" min="10" max="1000000">
        </div>
        <div class="input-group">
            <span :class="{ 'caption-validation-error': IsInvalidFIeldDimensionValue(innerDimension.Height) }"
                class="input-title">H</span>
            <input type="number" :class="{ 'input-validation-error': IsInvalidFIeldDimensionValue(innerDimension.Height) }"
                v-model.number="innerDimension.Height" min="10" max="1000000">
        </div>
        <div class="flex">
            <button @click="Apply(innerDimension)">Apply</button>
            <button @click="Cancel">Cancel</button>
        </div>
    </div>
</template>

<style scoped>
@import "../../css/button.css";
@import "../../css/input.css";
.field-dimension-editor {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0);
    top: 10px;
    width: 80%;
    padding: 10px;
    background-color: #128dd4;
}

.field-dimension-editor .input-title {
    display: inline-block;
    width: 17px;
}

.input-group {
  margin-bottom: 5px;
}

.input-title {
  margin-right: 5px;
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