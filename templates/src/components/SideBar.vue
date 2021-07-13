<template>
  <div class="d-flex flex-column bg-light border-end no-select" style="width: 320px">
    <div class="d-flex align-items-center p-4 pb-1" style="-webkit-app-region: drag">
      <img src="../../../assets/logo.svg" width="60" height="60" />
      <strong class="fs-3 ms-2">DWords</strong>
    </div>

    <div class="d-flex flex-column p-3 pt-0" style="height: 100vh">
      <hr>
      <ul class="nav nav-pills flex-column mb-auto">
        <li class="nav-item">
          <a name="current" :class="navItemCls('current')" v-on:click="clickNav"> Current </a>
        </li>
        <li class="nav-item">
          <a name="memorized" :class="navItemCls('memorized')" v-on:click="clickNav"> Memorized </a>
        </li>
        <li class="nav-item">
          <a name="all" :class="navItemCls('all')" v-on:click="clickNav"> All </a>
        </li>
      </ul>

      <hr>

      <div class="dropdown">
        <a href="#" class="d-flex align-items-center link-dark text-decoration-none dropdown-toggle" id="dropdownUser2" data-bs-toggle="dropdown" aria-expanded="false">
          <strong>mdo</strong>
        </a>
        <ul class="dropdown-menu text-small shadow" aria-labelledby="dropdownUser2">
          <li><a class="dropdown-item" href="#">New project...</a></li>
          <li><a class="dropdown-item" href="#">Settings</a></li>
          <li><a class="dropdown-item" href="#">Profile</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#">Sign out</a></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SideBar',
  data() {
    return {
      currentTab: 'current',
    }
  },

  methods: {
    navItemCls(name) {
      return this.currentTab === name ? 'nav-link active' : 'nav-link link-dark';
    },

    clickNav({target}) {
      this.currentTab = target.name;
      this.$emit('on-change-tag', this.currentTab);
    },
  },

}
</script>
