<template>
    <div>
        <div>
            <span :class="{ 'caption-validation-error': IsInvalid(boundary.width.value) }"
                class="inline-block mr-2 w-12">Width</span>
            <input type="number" :class="{ 'invalid': IsInvalid(boundary.width.value) }"
                :value="boundary.width.value" @input="UpdateWidth" min="10" max="1000000">
        </div>
        <div class="mt-1">
            <span :class="{ 'caption-validation-error': IsInvalid(boundary.height.value) }"
                class="inline-block mr-2 w-12">Height</span>
            <input type="number" :class="{ 'invalid': IsInvalid(boundary.height.value) }"
                :value="boundary.height.value" @input="UpdateHeight" min="10" max="1000000">
        </div>
    </div>
</template>

<style scoped></style>

<script lang="ts">
import { Component, Vue, Emit, Model } from 'vue-property-decorator';

interface MyInput extends Element {
    value: string;
}

interface MyInputEvent extends InputEvent {
    target: MyInput;
}

interface ValidatedValue<T> {
    value: T;
    isValid: boolean;
}

export interface Boundary {
    width: ValidatedValue<number>;
    height: ValidatedValue<number>;
}

@Component
export default class MyBoundarySettings extends Vue {
    @Model('update', { required: true, type: Object })
    public boundary!: Boundary;

    @Emit('update')
    public UpdateBoundary(_boundary: Boundary) {}

    public UpdateWidth(e: Event): void {
        const width = Number.parseInt((e as MyInputEvent).target.value);

        this.boundary.width.value = width;
        this.boundary.width.isValid = !this.IsInvalid(width);
    }

    public UpdateHeight(e: Event): void {
        const height = Number.parseInt((e as MyInputEvent).target.value);

        this.boundary.height.value = height;
        this.boundary.height.isValid = !this.IsInvalid(height);
    }

    public IsInvalid(value: number) {
        return value < 10 || value > 100000;
    }
}
</script>