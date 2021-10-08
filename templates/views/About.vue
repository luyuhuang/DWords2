<template>
  <div ref="widget" class="text-center p-2 no-select">
    <img src="../../assets/img/logo.svg" class="mb-1" width="80" height="80" />
    <h2 class="mb-2">DWords</h2>
    <div class="content mb-2">Copyright &copy; 2021 Luyu Huang</div>
    <div class="content">Version: {{ version }} | <a href="#" @click="clickHomepage">Homepage</a></div>
    <div class="content">Author: <a href="#" @click="clickAuthor">Luyu Huang</a></div>
    <div class="content">License: <a href="#" @click="clickLicense">MIT License</a></div>
    <div class="content mt-2 text-end">
      <a href="#" class="me-2" @click="clickCheckUpdate">Check Update</a>
      <a href="#" @click="clickReportIssue">Report Issue</a>
    </div>
  </div>
</template>

<script>
const { shell, ipcRenderer } = window.require('electron');
const urlParams = new URLSearchParams(window.location.search);

export default {
  data() {
    return {
      version: urlParams.get('version'),
    };
  },

  methods: {
    clickHomepage() {
      shell.openExternal('https://github.com/luyuhuang/DWords2');
    },
    clickAuthor() {
      shell.openExternal('https://luyuhuang.tech');
    },
    clickLicense() {
      shell.openExternal('https://github.com/luyuhuang/DWords2/blob/master/LICENSE');
    },
    clickReportIssue() {
      shell.openExternal('https://github.com/luyuhuang/DWords2/issues/new');
    },
    clickCheckUpdate() {
      ipcRenderer.send('checkUpdate');
    },
  },
};
</script>

<style scoped>
.content {
  font-size: 0.7rem;
  color: grey;
}
</style>
