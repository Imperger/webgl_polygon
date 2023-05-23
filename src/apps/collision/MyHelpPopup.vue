<template>
  <div>
    <fa-icon class="panel-help-trigger" icon="question-circle" />
    <div class="panel-help-content">
      <ul>
        <li>
          <fa-icon icon="mouse" />&nbsp; <span class="accent">LMB</span> - select body
        </li>
        <li>
          <fa-icon icon="mouse" />&nbsp; <span class="accent">LMB</span> + <span class="accent">SHIFT</span> - select bodies in a rectangular region
        </li>
        <li>
          <fa-icon icon="keyboard" />&nbsp; <span class="accent">SPACE</span> - pause & resume simulation
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.panel-help-trigger {
  position: absolute;
  font-size: 1.3em;
  top: 5px;
  right: 5px;
}

.panel-help-content {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  visibility: hidden;
  background-color: black;
}

.panel-help-content .accent {
  font-weight: bold;
}

.panel-help-content ul {
  list-style: none;
  padding: 0 8px;
}

.panel-help-content li {
  margin: 5px;
}

.panel-help-trigger:hover {
  color: #455a64;
}

.panel-help-trigger:hover+.panel-help-content {
  visibility: visible;
}
</style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class MyHelpPopup extends Vue { }
</script>
