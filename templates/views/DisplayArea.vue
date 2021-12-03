<template>
  <div class="display-area">
  <div>
</template>

<script>
const { ipcRenderer } = window.require('electron');

export default {
  created() {
    document.addEventListener('mousedown', this.mouseDown);
    document.addEventListener('mousemove', this.mouseMove);
    document.addEventListener('mouseup', this.mouseUp);
  },

  methods: {
    mouseDown(e) {
      this.dragging = true;
      this.lastX = e.screenX;
      this.lastY = e.screenY;
    },

    mouseMove(e) {
      if (this.dragging) {
        const dx = e.screenX - this.lastX;
        const dy = e.screenY - this.lastY;
        ipcRenderer.sendSync('moveWin', dx, dy);
        this.lastX = e.screenX;
        this.lastY = e.screenY;
      }
    },

    mouseUp() {
      this.dragging = false;
    },
  }
};
</script>

<style scoped>
.display-area {
  border: solid blue;
  background: skyblue;
  opacity: 0.5;
  width: 100vw;
  height: 100vh;
}
</style>
