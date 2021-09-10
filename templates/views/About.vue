<template>
  <div ref="widget" class="text-center p-2 no-select">
    <img src="../../assets/img/logo.png" class="mb-1" width="80" height="80" />
    <h2>DWords</h2>
    <div>Version: {{ version }} | <a href="#" @click="clickHomepage">Homepage</a></div>
    <div>Author: <a href="#" @click="clickAuthor">Luyu Huang</a></div>
    <div>License: <a href="#" @click="clickLicense">MIT License</a></div>
  </div>
</template>

<script>
const { shell } = window.require('electron');
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
    }
  },
}
</script>
