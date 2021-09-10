<template>
  <div id="widget" class="d-flex flex-row" style="width: 100vw; height: 100vh" v-if="inited">
    <SideBar :currentTab="currentTab" @onChangeTab="onChangeTab"></SideBar>

    <div class="col-9 d-flex flex-column">
      <div class="d-flex flex-row align-items-center p-3" style="-webkit-app-region: drag">
        <Search :currentPlan="currentPlan"></Search>
        <div class="d-flex flex-row-reverse" style="-webkit-app-region: no-drag">
          <button type="button" class="btn-close" @click="clickClose"></button>
        </div>
      </div>

      <div v-if="!currentPlan" class="d-flex flex-column justify-content-center text-center no-select" style="flex:1">
        <h1 class="mb-3" style="font-size:3rem">Welcome!</h1>
        <p class="text-secondary">These are currently no plans</p>
        <div>
          <button type="button" class="btn btn-lg btn-outline-success" @click="newPlan">
            Create a Plan
          </button>
        </div>
      </div>

      <div v-else-if="words.length <= 0 && currentTab === 'Current'"
           class="d-flex flex-column justify-content-center text-center no-select"
           style="flex:1">
        <h1 class="mb-3" style="font-size:3rem">Congratulations!</h1>
        <p class="text-secondary">
          You have memorized all the words of the plan!<br>
          You can start a new plan or add words.
        </p>
        <div>
          <button type="button" class="btn btn-lg btn-outline-success" @click="viewPlans">
            View Plans
          </button>
        </div>
      </div>

      <Table v-else :words="words" :quiz="quiz" @needMore="needMore">
      </Table>

      <div class="pt-2 pb-2 pe-2 border-top d-flex flex-row-reverse">
        <button type="button" class="btn btn-primary me-2" :disabled="syncing" @click="clickSync">
          <span class="spinner-border spinner-border-sm" v-if="syncing"></span>
          {{ syncing ? 'Syncing...' : 'Sync' }}
        </button>
        <button type="button" class="btn me-2" :class="quiz ? 'btn-secondary' : 'btn-primary'" @click="clickQuiz">
          {{quiz ? 'Back' : 'Quiz'}}
        </button>
      </div>
    </div>

    <Toast></Toast>
    <NewPlan @planCreated="onPlanCreated"></NewPlan>
  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron");
import Table from '../components/Table.vue'
import SideBar from '../components/SideBar.vue'
import Search from '../components/Search.vue'
import Toast from '../components/Toast.vue'
import NewPlan from '../components/NewPlan.vue';

export default {
  name: "Home",
  data() {
    return {
      currentTab: 'Current',
      words: [],
      appending: false,
      quiz: false,
      syncing: false,
      currentPlan: null,
      inited: false,
    };
  },

  components: { Search, Table, SideBar, Toast, NewPlan },

  created() {
    ipcRenderer.on('refreshList', () => this.setWordList());
    ipcRenderer.on('syncStatus', (_, syncing) => this.syncing = syncing);
    ipcRenderer.on('syncError', (_, err) => {
      this.$emit('showToast', {content: err, delay: 3000});
    });

    this.init();
  },

  methods: {
    async init() {
      await this.fetchCurrPlan();
      await this.fetchSyncing();
      await this.setWordList();
      this.inited = true;
    },

    async fetchCurrPlan() {
      this.currentPlan = await ipcRenderer.invoke('getCurrentPlan');
    },

    async fetchSyncing() {
      this.syncing = await ipcRenderer.invoke('isSyncing');
    },

    async appendWordList(words) {
      const res = await ipcRenderer.invoke('getWordList', this.currentTab, 100, words.length);
      words.push(...res.map(word => (word.see = false, word)));
      return words;
    },

    async needMore() {
      if (this.appending) return;
      this.appending = true;
      await this.appendWordList(this.words);
      this.appending = false;
    },

    async setWordList() {
      this.words = await this.appendWordList([])
    },

    onChangeTab(tab) {
      if (tab === this.currentTab) return;
      this.currentTab = tab;
      this.setWordList();
    },

    clickClose(e) {
      e.target.blur();
      ipcRenderer.send('close');
    },

    async clickSync() {
      ipcRenderer.send('sync');
    },

    clickQuiz() {
      this.quiz = !this.quiz;
      for (const word of this.words) {
        word.see = false;
      }
    },

    newPlan() {
      this.$emit('newPlan');
    },

    onPlanCreated() {
      this.fetchCurrPlan();
      this.setWordList();
    },

    viewPlans() {
      this.$router.push('/plans');
    },
  },
};
</script>
