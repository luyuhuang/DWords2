<template>
  <div class="display-area d-flex flex-column-reverse" :style="extraStyle">
    <div class="d-flex flex-row-reverse mb-2">
      <button type="button" class="btn btn-sm btn-secondary me-2" @click="clickConcel">Concel</button>
      <button type="button" class="btn btn-sm btn-secondary me-2" @click="clickOK">OK</button>
      <button type="button" class="btn btn-sm btn-secondary me-2" @click="clickReset">Reset</button>
    </div>
  <div>
</template>

<script>
const { ipcRenderer } = window.require('electron');
const urlParams = new URLSearchParams(window.location.search);

export default {
  data() {
    return {
      extraStyle: '',
    };
  },

  created() {
    document.addEventListener('mousedown', this.mouseDown);
    document.addEventListener('mousemove', this.mouseMove);
    document.addEventListener('mouseup', this.mouseUp);
    if (urlParams.get('platform') === 'darwin') {
      this.extraStyle = 'border-radius: 10px';
    }
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
        ipcRenderer.sendSync('moveMagnet', dx, dy);
        this.lastX = e.screenX;
        this.lastY = e.screenY;
      }
    },

    mouseUp() {
      this.dragging = false;
    },

    clickConcel() {
      ipcRenderer.send('close');
    },

    clickOK() {
      ipcRenderer.send('setDisplayArea');
    },

    clickReset() {
      ipcRenderer.invoke('resetDisplayArea');
    },
  }
};
</script>

<style scoped>
.display-area {
  border: solid #80808080;
  background: #dcdcdc48;
  width: 100vw;
  height: 100vh;
  cursor: move;
}
</style>
