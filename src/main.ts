import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faQuestionCircle,
  faMouse,
  faKeyboard,
  faPlay,
  faPause,
  faSave,
  faMinus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Vue from 'vue';

import App from './App.vue';
import router from './router';
import store from './store';
import '@/assets/tailwind.css';

library.add(faQuestionCircle);
library.add(faMouse);
library.add(faKeyboard);
library.add(faPlay);
library.add(faPause);
library.add(faSave);
library.add(faMinus);

Vue.component('fa-icon', FontAwesomeIcon);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
