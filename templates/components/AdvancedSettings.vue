<template>
  <div>
    <h3 :id="id">Advanced</h3>

    <div class="mb-4 form-check form-switch">
      <input class="form-check-input" type="checkbox" @click="toggleDevTools">
      <label class="form-check-label">Toggle developer tools</label>
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
  },
};
</script>
