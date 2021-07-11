<template>
  <div id="widget" class="d-flex" style="height: 100vh">
    <div class="d-flex flex-column p-3 bg-light border-end no-select" style="width: 320px">
      <div class="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none">
        <img src="./assets/logo.svg" width="70" height="70" />
        <strong class="fs-2 ms-2">DWords</strong>
      </div>

      <hr>

      <ul class="nav nav-pills flex-column mb-auto">
        <li class="nav-item">
          <a name="current" v-bind:class="navItemCls('current')" v-on:click="clickNav"> Current </a>
        </li>
        <li class="nav-item">
          <a name="memorized" v-bind:class="navItemCls('memorized')" v-on:click="clickNav"> Memorized </a>
        </li>
        <li class="nav-item">
          <a name="all" v-bind:class="navItemCls('all')" v-on:click="clickNav"> All </a>
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

    <div class="d-flex flex-column" style="width: 100vw">
      <div class="list-group list-group-flush border-bottom scrollarea" style="overflow-y: auto;">
      <table class="table table-striped table-borderless mb-auto tableFixHead" >
        <thead>
          <tr>
            <th scope="col">Word</th>
            <th scope="col">Paraphrase</th>
          </tr>
        </thead>
        <tbody>
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
      <div class="mt-2 mb-2 me-2 d-flex flex-row-reverse">
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
  methods: {
    navItemCls(name) {
      console.log(name);
      return this.curTab === name ? 'nav-link active' : 'nav-link link-dark';
    },

    clickNav({target}) {
      this.curTab = target.name;
    },

  },
};
</script>

<style scoped>
.no-select {
  user-select:none;
}
</style>
