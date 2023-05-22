<template>
    <div>
        <div>
            <span :class="{ 'caption-validation-error': IsInvalidBodiesCount(bodies.count.value) }" class="mr-2">Bodies</span>
            <input type="number" :class="{ invalid: IsInvalidBodiesCount(bodies.count.value) }" :value="bodies.count.value" @input="UpdateCount" min="2"
                max="1000000" />
        </div>
        <div class="mt-1">
            <span :class="{ 'caption-validation-error': IsInvalidBodiesRadius(bodies.radius.value) }" class="mr-2">Radius</span>
            <input type="number" :class="{ invalid: IsInvalidBodiesRadius(bodies.radius.value) }" :value="bodies.radius.value" @input="UpdateRadius" min="1"
                max="500" />
        </div>
    </div>
</template>

<style scoped></style>

<script lang="ts">
import { Component, Vue, Model, Emit } from 'vue-property-decorator';

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

export interface BodiesSettings {
    count: ValidatedValue<number>;
    radius: ValidatedValue<number>;
}

@Component
export default class MyBodiesSettings extends Vue {
    @Model('update', { required: true, type: Object })
    public bodies!: BodiesSettings;

    @Emit('update')
    public UpdateBoundary(_bodies: BodiesSettings) {}

    public UpdateCount(e: Event): void {
        const count = Number.parseInt((e as MyInputEvent).target.value);

        this.bodies.count.value = count;
        this.bodies.count.isValid = !this.IsInvalidBodiesCount(count);
    }

    public UpdateRadius(e: Event): void {
        const radius = Number.parseInt((e as MyInputEvent).target.value);

        this.bodies.radius.value = radius;
        this.bodies.radius.isValid = !this.IsInvalidBodiesRadius(radius);
    }

    public IsInvalidBodiesCount(count: number) {
        return count < 2 || count > 1000000;
    }

    public IsInvalidBodiesRadius(radius: number) {
        return radius < 1 || radius > 500;
    }
}
</script>