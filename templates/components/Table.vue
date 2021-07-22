<template>
  <div class="d-flex flex-column" style="width: 100vw">
    <div class="d-flex p-3 flex-row-reverse" style="-webkit-app-region: drag">
      <button type="button" class="btn-close" @click="clickClose" style="-webkit-app-region: no-drag"></button>
    </div>
    <table class="table m-0 border-end no-select">
      <thead>
        <tr> <th ref="word-head">Word</th> <th>Paraphrase</th> </tr>
      </thead>
    </table>
    <div class="mb-auto" style="overflow-y: auto;">
      <table class="table table-striped table-borderless">
        <tbody ref="table-body">
          <tr v-for="(word, i) in wordList" :key="i"> <td>{{ word.word }}</td> <td>{{ word.paraphrase }}</td> </tr>
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
const { ipcRenderer } = window.require("electron");

export default {
  name: 'Table',
  props: {
    wordList: Array,
  },

  mounted() {
    const tbody = this.$refs['table-body'];
    new MutationObserver(this.resizeThead).observe(tbody, {
      childList: true, characterData: true, subtree: true
    });
    new ResizeObserver(this.resizeThead).observe(tbody)
  },

  methods: {
    resizeThead() {
      const first = this.$refs['table-body'].children[0];
      if (first) {
        this.$refs['word-head'].width = first.children[0].clientWidth;
      }
    },

    clickClose() {
      ipcRenderer.send('close');
    },
  },
}
</script>
