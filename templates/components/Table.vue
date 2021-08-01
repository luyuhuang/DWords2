<template>
  <div class="d-flex flex-column" style="width: 100vw">
    <div class="d-flex flex-row align-items-center p-3" style="-webkit-app-region: drag">
      <div class="d-flex flex-row justify-content-center col">
        <div class="input-group input-group-sm" style="width: 17rem; -webkit-app-region: no-drag">
          <input type="text" class="form-control" placeholder="Search">
          <button class="btn search-btn">
            <i class="bi bi-search"></i>
          </button>
        </div>
      </div>

      <div class="d-flex flex-row-reverse" style="-webkit-app-region: no-drag">
        <button type="button" class="btn-close" @click="clickClose"></button>
      </div>
    </div>
    <table class="table m-0 border-end no-select">
      <thead>
        <tr> <th ref="wordHead">Word</th> <th>Paraphrase</th> </tr>
      </thead>
    </table>
    <div class="mb-auto" style="overflow-y: auto;">
      <table class="table table-striped table-borderless">
        <tbody ref="tableBody">
          <tr v-for="(word, i) in wordList" :key="i">
            <td>{{ word.word }}</td>
            <td>{{ html2text(word.paraphrase) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pt-2 pb-2 pe-2 border-top d-flex flex-row-reverse">
      <button type="button" class="btn btn-primary me-2">Light</button>
      <button type="button" class="btn btn-primary me-2">Burst</button>
    </div>
  </div>
</template>

<script>
import { html2text } from '../scripts/utils';
const { ipcRenderer } = window.require("electron");

export default {
  name: 'Table',
  props: {
    wordList: Array,
  },

  mounted() {
    const tbody = this.$refs.tableBody;
    new MutationObserver(this.resizeThead).observe(tbody, {
      childList: true, characterData: true, subtree: true
    });
    new ResizeObserver(this.resizeThead).observe(tbody)
  },

  methods: {
    html2text,

    resizeThead() {
      const tbody = this.$refs.tableBody;
      const first = tbody && tbody.children[0];
      if (first) {
        this.$refs.wordHead.width = first.children[0].clientWidth;
      }
    },

    clickClose() {
      ipcRenderer.send('close');
    },
  },
}
</script>

<style scoped>
.search-btn {
  border-color: rgb(206, 212, 218);
  color: gray;
}
</style>
