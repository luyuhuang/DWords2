<template>
  <div>
    <h3 :id="id">Advanced</h3>

    <div class="mb-2 form-check form-switch">
      <input class="form-check-input" type="checkbox" @click="toggleDevTools">
      <label class="form-check-label">Toggle developer tools</label>
    </div>

    <div class="d-flex flex-row mb-2">
      <button type="button" class="btn btn-sm btn-primary me-2" @click="openLog">
        Open log
      </button>
      <button type="button" class="btn btn-sm btn-primary" @click="openDataDir">
        Open data directory
      </button>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron");

export default {
  props: {
    id: String,
    settings: Object,
  },

  methods: {
    toggleDevTools() {
      ipcRenderer.send('toggleDevTools');
    },

    openLog() {
      ipcRenderer.send('openLog');
    },
    openDataDir() {
      ipcRenderer.send('openDataDir');
    },
  },
};
</script>
