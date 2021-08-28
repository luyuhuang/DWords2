<template>
  <div id="widget" class="d-flex flex-row" style="width: 100vw; height: 100vh">
    <SideBar :currentTab="currentTab" @onChangeTab="onChangeTab"></SideBar>
    <Table :words="words" @needMore="appendWordList"></Table>
  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron");
import Table from '../components/Table.vue'
import SideBar from '../components/SideBar.vue'

export default {
  name: "Home",
  data() {
    return {
      currentTab: 'Current',
      words: [],
      appending: false,
    };
  },

  components: {Table, SideBar},

  created() {
    ipcRenderer.on('refreshList', () => this.setWordList());
    this.setWordList();
  },

  methods: {
    async appendWordList() {
      if (this.appending) return;
      this.appending = true;
      const words = await ipcRenderer.invoke('getWordList', this.currentTab, 100, this.words.length);
      this.words.push(...words.map(word => (word.see = false, word)));
      this.appending = false;
    },

    async setWordList() {
      this.words = [];
      await this.appendWordList();
    },

    onChangeTab(tab) {
      if (tab === this.currentTab) return;
      this.currentTab = tab;
      this.setWordList();
    },
  },
};
</script>

<style scoped>
.no-select {
  user-select: none;
}
</style>
