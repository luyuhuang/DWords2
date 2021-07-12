<template>
  <div id="widget" class="d-flex" style="height: 100vh">
    <div class="d-flex flex-column bg-light border-end no-select" style="width: 320px">
      <div class="d-flex align-items-center p-4 pb-1" style="-webkit-app-region: drag">
        <img src="./assets/logo.svg" width="60" height="60" />
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

    <div class="d-flex flex-column" style="width: 100vw">
      <div class="d-flex p-3 flex-row-reverse" style="-webkit-app-region: drag">
        <button type="button" class="btn-close" style="-webkit-app-region: no-drag"></button>
      </div>
      <table class="table mb-0 border-end no-select">
        <thead>
          <tr> <th ref="word-head">Word</th> <th>Paraphrase</th> </tr>
        </thead>
      </table>
      <div class="mb-auto" style="overflow-y: auto;">
        <table class="table table-striped table-borderless">
          <tbody ref="table-body">
            <tr> <td>Mark</td> <td>Otto</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
            <tr> <td>Jacob</td> <td>Thornton</td> </tr>
          </tbody>
        </table>
      </div>
      <div class="pt-2 pb-2 pe-2 border-top d-flex flex-row-reverse">
        <button type="button" class="btn btn-primary me-2">Light</button>
        <button type="button" class="btn btn-primary me-2">Burst</button>
      </div>
    </div>
  </div>
</template>

<script>
// const { ipcRenderer } = window.require("electron");

export default {
  name: "home",
  data() {
    return {
      curTab: "current",
    };
  },

  mounted() {
    const first = this.$refs['table-body'].children[0];
    if (first) {
      new ResizeObserver(([{target}]) => {
        this.$refs['word-head'].width = target.clientWidth
      }).observe(first.children[0])
    }
  },

  methods: {
    navItemCls(name) {
      return this.curTab === name ? 'nav-link active' : 'nav-link link-dark';
    },

    clickNav({target}) {
      this.curTab = target.name;
    },

    getWidth() {
    },
  },
};
</script>

<style scoped>
.no-select {
  user-select:none;
}
</style>
