<template>
  <div id="widget" class="d-flex" style="height: 100vh">
    <SideBar @on-change-tag="onChangeTab"></SideBar>
    <Table :wordList="currentList"></Table>
  </div>
</template>

<script>
import Table from '../components/Table.vue'
import SideBar from '../components/SideBar.vue'

export default {
  name: "Home",
  data() {
    return {
      currentList: [],
    };
  },

  components: {Table, SideBar},

  mounted() {
    this.setCurrentList('Current');
  },

  methods: {
    setCurrentList(tab) {
      this.currentList = [
        {word: tab, paraphrase: 'apple'}
      ];
    },

    onChangeTab(tab) {
      this.setCurrentList(tab)
    },
  },
};
</script>

<style scoped>
.no-select {
  user-select: none;
}
</style>
