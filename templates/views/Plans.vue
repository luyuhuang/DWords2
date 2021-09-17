<template>
  <div class="d-flex flex-column" style="height: 100vh">
    <Title title="Plans"></Title>

    <div class="d-flex flex-row" style="flex: 1; overflow-y: auto">
      <div class="col-3 d-flex flex-column border-end p-3 no-select">

        <div class="input-group input-group-sm mb-2">
          <span class="input-group-text">Current</span>
          <select class="form-select" aria-label="Default select example" v-model="currentPlan" @change="selectPlan">
            <option v-for="(plan, i) in plans" :key="i" :value="plan.id">{{ plan.name }}</option>
          </select>
        </div>

        <div class="btn-group">
          <button type="button" class="btn btn-sm btn-outline-success" @click="newPlan">
            New Plan
          </button>
        </div>

        <hr>

        <div style="overflow-y: auto">
          <ul class="nav nav-pills flex-column mb-auto">
            <li class="nav-item" v-for="(plan, i) in plans" :key="i" @contextmenu="planMenu($event, plan)">
              <div v-if="editingPlan.id == plan.id" class="m-1 d-flex flex-row justify-content-between align-items-center">
                <input class="form-control form-control-sm" placeholder="Plan Name" id="planEditor"
                  v-model="editingPlan.name"  @change="modifyPlan"
                  @keyup.enter="editingPlan = {}" @blur="editingPlan = {}"
                >
              </div>

              <a v-else class="nav-link d-flex flex-row has-edit" :class="planCls(plan.id)">
                <div @click="clickPlan(plan)" style="flex: 1">
                  <i class="bi bi-journal-text me-2"></i>
                  {{ plan.name }}
                </div>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="col-9 d-flex flex-column">
        <table class="table m-0 border-end no-select">
          <thead>
            <tr> <th ref="wordHead" id="wordHead" :style="wordStyle">Word</th> <th>Paraphrase</th> </tr>
          </thead>
        </table>
        <div class="mb-auto" style="overflow-y: auto" ref="wordList">
          <table class="table table-striped table-borderless table-content">
            <tbody ref="tableBody">
              <tr class="has-edit" v-for="(word, i) in words" :key="i" @contextmenu="wordMenu($event, word)">
                <template v-if="editingWord.word == word.word">
                  <td :style="wordStyle">
                    <input class="form-control form-control-sm" id="wordEditor" v-model="editingWord.newWord" @keyup.enter="enterNewWord">
                  </td>
                  <td>
                    <input class="form-control form-control-sm" id="paraphraseEditor" v-model="editingWord.paraphrase" @keyup.enter="enterNewParaphrase">
                  </td>
                </template>
                <template v-else>
                  <td :style="wordStyle">{{ word.word }}</td>
                  <td>{{ html2text(word.paraphrase) }}</td>
                </template>
              </tr>
              <tr v-if="adding">
                <td :style="wordStyle">
                  <input class="form-control form-control-sm" placeholder="Word" ref="wordInput" @keyup.enter="enterWord" v-model="inputedWord">
                </td>
                <td>
                  <input class="form-control form-control-sm" placeholder="Paraphrase" ref="paraphraseInput" @keyup.enter="enterParaphrase" v-model="inputedParaphrase">
                </td>
              </tr>
            </tbody>

          </table>
        </div>

        <div v-if="selectedPlan" class="border-top d-flex flex-row p-2 align-items-center no-select">
          <nav class="col">
            <ul class="pagination m-0 justify-content-center">
              <li class="page-item" :class="page === 1 ? 'disabled' : ''">
                <a class="page-link" href="#" @click="pageTo(page - 1)">&lt;</a>
              </li>
              <li v-for="(page, i) in pages" :key="i" class="page-item" :class="pageItemCls(page)">
                <a class="page-link" href="#" @click="pageTo(page)">{{ page }}</a>
              </li>
              <li class="page-item" :class="page === pageNum ? 'disabled' : ''">
                <a class="page-link" href="#" @click="pageTo(page + 1)">&gt;</a>
              </li>
            </ul>
          </nav>

          <button type="button" class="btn" :class="adding ? 'btn-secondary' : 'btn-primary'" @click="clickAdd">
            {{ adding ? 'Back' : 'Add' }}
          </button>
        </div>

      </div>
    </div>

    <NewPlan @planCreated="getPlans"></NewPlan>
    <Alert></Alert>
    <Toast></Toast>
    <ContextMenu></ContextMenu>
  </div>
</template>

<script>
import { html2text } from '../scripts/utils';
import Title from '../components/Title.vue';
import Alert from '../components/Alert.vue';
import Toast from '../components/Toast.vue';
import ContextMenu from '../components/ContextMenu.vue';
import NewPlan from '../components/NewPlan.vue';

const { ipcRenderer } = window.require('electron');

export default {
  components: {NewPlan, Title, Alert, Toast, ContextMenu},
  data() {
    return {
      wordWidth: 150,
      currentPlan: undefined,
      selectedPlan: undefined,
      plans: [],

      words: [],
      page: 1,
      pageNum: 1,
      pageSize: 100,
      pages: [1],

      adding: false,
      inputedWord: '',
      inputedParaphrase: '',

      editingPlan: {},
      editingWord: {},
    };
  },

  props: {
    plan: String,
    edit: String,
  },

  mounted() {
    this.init();

    document.addEventListener('keyup', this.onKeyUp);

    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.$refs.wordHead);
  },

  destroyed() {
    this.resizeObserver.disconnect();
    document.removeEventListener('keyup', this.onKeyUp);
  },

  methods: {
    html2text,

    onKeyUp(e) {
      if (e.key === 'Escape') {
        this.adding = false;
        this.editingPlan = {};
        this.editingWord = {};
      }
    },

    resize() {
      this.wordWidth = this.$refs.wordHead.clientWidth;
    },

    async init() {
      await this.getPlans();
      if (this.plan && this.edit) {
        await this.setEdit(this.plan, this.edit);
      }
    },

    async getPlans() {
      this.plans = await ipcRenderer.invoke('getPlans');
      this.currentPlan = await ipcRenderer.invoke('getCurrentPlan');
      if (this.currentPlan && !this.selectedPlan) {
        this.selectedPlan = this.currentPlan;
        this.getWords();
      }
      if (!this.currentPlan) {
        this.words = [];
        this.pageNum = this.page = 1;
        this.pages = [1];
      }
    },

    async getWords() {
      const limit = this.pageSize;
      const offset = (this.page - 1) * this.pageSize;
      const {count, words} = await ipcRenderer.invoke('getWords', this.selectedPlan, limit, offset);

      const pageNum = Math.max(Math.ceil(count / this.pageSize), 1);
      this.pageNum = pageNum;
      this.words = words;

      const up = 1, down = 2;
      const pages = [], before = [], after = [];
      for (let i = Math.max(1, this.page - up); i <= Math.min(pageNum, this.page + down); i++) {
        pages.push(i);
      }
      for (let i = this.page - up; i < 1 && pages[pages.length - 1] < pageNum; i++) {
        pages.push(pages[pages.length - 1] + 1);
      }
      for (let i = this.page + down; i > pageNum && pages[0] > 1; i--) {
        pages.unshift(pages[0] - 1);
      }

      if (pages[0] !== 1) {
        before.push(1);
        if (pages[0] > 3) {
          before.push('...');
        } else if (pages[0] > 2) {
          before.push(2);
        }
      }

      if (pages[pages.length - 1] !== pageNum) {
        if (pages[pages.length - 1] < pageNum - 2) {
          after.push('...');
        } else if (pages[pages.length - 1] < pageNum - 1) {
          after.push(pageNum - 1);
        }
        after.push(pageNum);
      }

      this.pages = before.concat(pages).concat(after);
    },

    async setEdit(plan, word) {
      if (plan !== this.selectedPlan) {
        this.clickPlan(plan);
      }

      const index = await ipcRenderer.invoke('getWordIndex', this.selectedPlan, word);
      if (index < 0) {
        return;
      }

      await this.pageTo(Math.ceil(index / this.pageSize));

      const w = this.words.find(w => w.word === word);
      if (w) {
        this.editWord(w);
      }
    },

    async pageTo(page) {
      this.page = page;
      await this.getWords();
    },

    pageItemCls(page) {
      if (page === this.page) {
        return 'active';
      } else if (page === '...') {
        return 'disabled';
      } else {
        return '';
      }
    },

    planCls(planId) {
      return planId === this.selectedPlan ? 'active' : 'link-dark';
    },

    async clickPlan(plan) {
      this.page = 1;
      this.adding = false;
      this.selectedPlan = plan.id;
      this.editingWord = {};
      await this.getWords();
    },

    newPlan() {
      this.$emit('newPlan');
    },

    selectPlan() {
      if (this.currentPlan) {
        ipcRenderer.invoke('selectPlan', this.currentPlan);
      }
    },

    planMenu(e, plan) {
      const items = [
        { name: 'Rename', action: () => this.editPlan(plan) },
        { name: 'Reset', action: () => this.resetPlan(plan) },
        { name: 'Delete', action: () => this.delPlan(plan) },
        '----------------',
        { name: 'Export', action: () => this.exportPlan(plan) },
      ];
      this.$emit('showContextMenu', {x: e.clientX, y: e.clientY, items});
    },

    editPlan(plan) {
      this.editingPlan = {...plan};
      this.$nextTick(() => document.getElementById('planEditor').focus());
    },

    delPlan(plan) {
      const tips = `Are you sure you want to delete plan "${plan.name}"? This will lose <b>ALL WORDs</b> in the plan!`;
      this.$emit('showAlert', 'Warning', tips, [
        {text: 'Cancel', class: 'btn-secondary'},
        {
          text: 'Delete',
          class: 'btn-danger',
          onClick: async () => {
            await ipcRenderer.invoke('delPlan', plan.id);
            if (this.selectedPlan === plan.id) {
              this.selectedPlan = undefined;
            }
            await this.getPlans();
          },
        }
      ]);
    },

    exportPlan(plan) {
      ipcRenderer.invoke('exportPlan', plan.id);
    },

    resetPlan(plan) {
      const tips = `Are you sure you want to reset plan "${plan.name}"? This will clear the learning progress of the plan`;
      this.$emit('showAlert', 'Warning', tips, [
        {text: 'Cancel', class: 'btn-secondary'},
        {
          text: 'Reset',
          class: 'btn-danger',
          onClick: async () => {
            await ipcRenderer.invoke('resetPlan', plan.id);
          },
        }
      ]);
    },

    async modifyPlan() {
      await ipcRenderer.invoke('renamePlan', this.editingPlan.id, this.editingPlan.name);
      await this.getPlans();
    },

    scrollBottom() {
      const wordList = this.$refs.wordList;
      wordList.scrollTo(0, wordList.children[0].clientHeight);
    },

    async clickAdd() {
      this.adding = !this.adding;
      if (this.adding) {
        await this.pageTo(this.pageNum);
        await this.$nextTick();
        this.scrollBottom();
        this.$refs.wordInput.focus();
      }
    },

    enterWord(e) {
      if (this.inputedWord.length <= 0) return;

      if (e.ctrlKey || this.inputedParaphrase.length > 0) {
        this.addWord();
      } else {
        this.$refs.paraphraseInput.focus();
      }
    },

    enterParaphrase() {
      if (this.inputedWord.length <= 0) return;

      this.addWord();
    },

    async addWord() {
      const now = Date.now();
      const change = await ipcRenderer.invoke('addWord', this.selectedPlan, this.inputedWord, now, this.inputedParaphrase);
      if (change) {
        await this.getWords();
      } else {
        this.$emit('showToast', {content: 'Word already exists', delay: 3000});
      }

      this.inputedWord = this.inputedParaphrase = '';
      this.$refs.wordInput.focus();
      await this.pageTo(this.pageNum);
      this.$nextTick(() => this.scrollBottom());
    },

    wordMenu(e, word) {
      const items = [
        { name: 'Edit', action: () => this.editWord(word) },
        { name: 'Delete', action: () => this.delWord(word) },
      ];
      this.$emit('showContextMenu', {x: e.clientX, y: e.clientY, items});
    },

    editWord(word) {
      this.editingWord = {...word, newWord: word.word};
      this.$nextTick(() => document.getElementById('wordEditor').focus());
    },

    delWord(word) {
      const tips = `Are you sure you want to delete word "${word.word}"?`;
      this.$emit('showAlert', 'Warning', tips, [
        {text: 'Cancel', class: 'btn-secondary'},
        {
          text: 'Delete',
          class: 'btn-danger',
          onClick: async () => {
            await ipcRenderer.invoke('delWord', word.plan_id, word.word);
            await this.getWords();
          },
        }
      ]);
    },

    enterNewWord(e) {
      if (this.editingWord.newWord.length <= 0) return;

      if (e.ctrlKey || this.editingWord.paraphrase.length > 0) {
        this.updateWord();
      } else {
        document.getElementById('paraphraseEditor').focus();
      }
    },

    enterNewParaphrase() {
      if (this.editingWord.newWord.length <= 0) return;

      this.updateWord();
    },

    async updateWord() {
      const planID = this.editingWord.plan_id;
      const word = this.editingWord.word;
      const data = {
        word: this.editingWord.newWord,
        paraphrase: this.editingWord.paraphrase,
      };

      const err = await ipcRenderer.invoke('updateWord', planID, word, data);
      if (err) {
        this.$emit('showToast', {content: 'Duplicated word', delay: 3000});
        return;
      }
      await this.getWords();
      this.editingWord = {};
    },

    getParaphrase(word, cb) {
      if (this.getParaphraseTimer) {
        clearTimeout(this.getParaphraseTimer);
      }

      this.getParaphraseTimer = setTimeout(async () => {
        const res = await ipcRenderer.invoke('consultDictionary', word);
        if (res) {
          cb(res.paraphrase);
        }
      }, 100);
    }
  },

  computed: {
    wordStyle() {
      return {
        width: this.wordWidth + 'px',
      };
    }
  },

  watch: {
    inputedWord(word) {
      this.getParaphrase(word, paraphrase => this.inputedParaphrase = paraphrase);
    },

    'editingWord.newWord'(word) {
      if (word === undefined) return;
      this.getParaphrase(word, paraphrase => this.editingWord.paraphrase = paraphrase);
    }
  },
};
</script>

<style scoped>
.table-content {
  table-layout: fixed;
  width: 100%;
}

td {
  text-overflow: ellipsis;
  white-space:nowrap;
  overflow: hidden;
}

#wordHead {
  resize: horizontal;
  overflow: auto;
}
</style>
