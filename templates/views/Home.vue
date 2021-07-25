<template>
  <div id="widget" class="d-flex flex-row" style="height: 100vh">
    <SideBar @on-change-tag="onChangeTab"></SideBar>
    <Table :wordList="wordList"></Table>
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
      currentTab: undefined,
      wordList: [],
    };
  },

  components: {Table, SideBar},

  mounted() {
    ipcRenderer.on('refreshList', () => this.setWordList(this.currentTab));
  },

  methods: {
    async setWordList(tab) {
      this.wordList = await ipcRenderer.invoke('getWordList', tab);
    },

    onChangeTab(tab) {
      this.currentTab = tab;
      this.setWordList(tab)
    },
  },
};
</script>

<style scoped>
.no-select {
  user-select: none;
}
</style>
