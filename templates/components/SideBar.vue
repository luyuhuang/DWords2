<template>
  <div class="col-3 d-flex flex-column bg-light border-end no-select">
    <div class="d-flex align-items-center p-4 pb-1" style="-webkit-app-region: drag">
      <img src="../../assets/img/logo.svg" width="60" height="60" />
      <strong class="fs-4 ms-2 overflow-hidden">DWords</strong>
    </div>

    <div class="d-flex flex-column p-3 pt-0" style="flex: 1">
      <hr>
      <ul class="nav nav-pills flex-column mb-auto">
        <li class="nav-item" v-for="(tab, i) in tabs" :key="i">
          <a :name="tab" :class="navItemCls(tab)" @click="clickNav"> {{ tab }} </a>
        </li>
      </ul>

      <hr>

      <div class="dropdown">
        <a href="#" class="d-flex align-items-center link-dark text-decoration-none dropdown-toggle" id="dropdownUser2" data-bs-toggle="dropdown" aria-expanded="false">
          <strong>Menus</strong>
        </a>
        <ul class="dropdown-menu text-small shadow" aria-labelledby="dropdownUser2">
          <li><a class="dropdown-item" href="#/plans"><i class="bi bi-journals me-2"></i>Plans</a></li>
          <!-- <li><a class="dropdown-item" href="#/statistics"><i class="bi bi-bar-chart-line me-2"></i>Statistics</a></li> -->
          <li><a class="dropdown-item" href="#/settings"><i class="bi bi-gear me-2"></i>Settings</a></li>
          <li><a class="dropdown-item" href="#" @click="clickAbout"><i class="bi bi-info-circle me-2"></i>About</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" @click="clickExit"><i class="bi bi-x-circle me-2"></i>Exit</a></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron");

export default {
  name: 'SideBar',
  data() {
    return {
      tabs: ['Current', 'Planning', 'Memorized', 'All'],
    };
  },

  props: {
    currentTab: String,
  },

  methods: {
    navItemCls(name) {
      return this.currentTab === name ? 'nav-link active' : 'nav-link link-dark';
    },

    clickNav({target}) {
      this.$emit('onChangeTab', target.name);
    },

    clickAbout() {
      ipcRenderer.invoke('showAbout');
    },

    clickExit() {
      ipcRenderer.send('exit');
    },
  },

};
</script>
