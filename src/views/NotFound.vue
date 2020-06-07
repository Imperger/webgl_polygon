<template>
  <h1 class="center">Page not found</h1>
</template>

<style scoped>
.center {
    text-align: center;
}
</style>

<script lang="ts">
import { Component, Emit, Mixins, Model, Prop, Vue } from 'vue-property-decorator';

@Component
export default class NotFound extends Vue {
}
</script>