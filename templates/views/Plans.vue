<template>
  <div class="d-flex flex-column" style="user-select: none; height: 100vh">
    <Title title="Plans"></Title>

    <div class="d-flex flex-row" style="flex: 1; overflow-y: auto">
      <div class="col-3 d-flex flex-column border-end p-3">

        <div class="input-group input-group-sm mb-2">
          <span class="input-group-text">Current</span>
          <select class="form-select" aria-label="Default select example" v-model="currentPlan" @change="selectPlan">
            <option v-for="(plan, i) in plans" :key="i" :value="plan.id">{{ plan.name }}</option>
          </select>
        </div>

        <div class="btn-group">
          <button type="button" class="btn btn-sm btn-outline-success dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
            New Plan
          </button>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" @click="newEmptyPlan"><i class="bi bi-file-earmark me-2"></i>Empty Plan</a></li>
            <li><a class="dropdown-item" @click="fromLibrary"><i class="bi bi-collection me-2"></i>From Library</a></li>
            <li><a class="dropdown-item"><i class="bi bi-folder me-2"></i>Import...</a></li>
          </ul>
        </div>

        <hr>

        <div style="overflow-y: auto">
          <ul class="nav nav-pills flex-column mb-auto">
            <li class="nav-item" v-for="(plan, i) in plans" :key="i">
              <div class="m-1 d-flex flex-row justify-content-between align-items-center" v-if="editingPlan.id == plan.id">
                <input class="form-control form-control-sm" placeholder="Plan Name" id="planEditor"
                  v-model="editingPlan.name"  @change="modifyPlan" @keyup.enter="editingPlan = {}"
                >
                <i class="ms-1 bi bi-trash" @click="delPlan(plan)"></i>
              </div>

              <a class="nav-link d-flex flex-row has-edit"
                :class="planCls(plan.id)" v-if="editingPlan.id != plan.id"
              >
                <div @click="clickPlan(plan)" style="flex: 1">
                  <i class="bi bi-journal-text me-2"></i>
                  {{ plan.name }}
                </div>
                <i class="bi bi-pencil-square edit-btn" @click="editPlan(plan)"></i>
              </a>
            </li>

            <li class="nav-item p-1" v-if="planning">
              <input class="form-control form-control-sm" placeholder="Plan Name" ref="planInput"
                     v-model="newPlanCtx.name" @keyup.enter="enterPlan" @blur="planning = false">
            </li>
          </ul>
        </div>
      </div>

      <div class="col-9 d-flex flex-column">
        <table class="table m-0 border-end no-select">
          <thead>
            <tr> <th ref="wordHead">Word</th> <th>Paraphrase</th> </tr>
          </thead>
        </table>
        <div style="overflow-y: auto" ref="wordList">
          <table class="table table-striped table-borderless">
            <tbody ref="tableBody">
              <tr class="has-edit" v-for="(word, i) in words" :key="i">
                <td v-if="editingWord.word == word.word">
                  <input class="form-control form-control-sm" v-model="editingWord.newWord" @keyup.enter="enterNewWord">
                </td>
                <td v-if="editingWord.word == word.word">
                  <input class="form-control form-control-sm" id="paraphraseEditor" v-model="editingWord.paraphrase" @keyup.enter="enterNewParaphrase">
                </td>
                <td v-if="editingWord.word == word.word" style="vertical-align: middle">
                  <i class="ms-1 bi bi-trash" @click="delWord(word)"></i>
                </td>

                <td v-if="editingWord.word != word.word">{{ word.word }}</td>
                <td v-if="editingWord.word != word.word">{{ html2text(word.paraphrase) }}</td>
                <td v-if="editingWord.word != word.word">
                  <i class="bi bi-pencil-square edit-btn" @click="editWord(word)"></i>
                </td>
              </tr>
              <tr v-if="adding">
                <td>
                  <input class="form-control form-control-sm" placeholder="Word" ref="wordInput" @keyup.enter="enterWord" v-model="inputedWord">
                </td>
                <td>
                  <input class="form-control form-control-sm" placeholder="Paraphrase" ref="paraphraseInput" @keyup.enter="enterParaphrase" v-model="inputedParaphrase">
                </td>
                <td></td>
              </tr>
              <tr style="height: 4rem"></tr>
            </tbody>

          </table>
        </div>
      </div>
    </div>

    <div class="float-btn bg-primary d-flex flex-column justify-content-center" v-if="selectedPlan" :adding="adding" @click="clickAdd">
      <div class="bi bi-plus-lg" style="text-align: center; color: white"></div>
    </div>

    <PlanLibrary @choose="chooseLibrary"></PlanLibrary>
    <Alert></Alert>
    <Toast></Toast>
  </div>
</template>

<script>
import { html2text } from '../scripts/utils';
import Title from '../components/Title.vue'
import PlanLibrary from '../components/PlanLibrary.vue'
import Alert from '../components/Alert.vue'
import Toast from '../components/Toast.vue'
const { ipcRenderer } = window.require('electron');
import { DICTIONARIES } from '../../src/common'

export default {
  components: {Title, PlanLibrary, Alert, Toast},
  data() {
    return {
      currentPlan: undefined,
      selectedPlan: undefined,
      plans: [],
      words: [],
      planning: false,
      adding: false,
      newPlanCtx: {},
      inputedWord: '',
      inputedParaphrase: '',

      editingPlan: {},
      editingWord: {},
    };
  },

  created() {
    this.getPlans();
  },

  mounted() {
    document.addEventListener('keyup', e => {
      if (e.key == 'Escape') {
        this.adding = false;
        this.planning = false;
        this.editingPlan = {};
        this.editingWord = {};
      }
    });

    const tbody = this.$refs.tableBody;
    new MutationObserver(this.resizeThead).observe(tbody, {
      childList: true, characterData: true, subtree: true
    });
    new ResizeObserver(this.resizeThead).observe(tbody)
  },

  methods: {
    html2text,

    async getPlans() {
      this.plans = await ipcRenderer.invoke('getPlans');
      this.currentPlan = await ipcRenderer.invoke('getCurrentPlan');
      if (this.currentPlan && !this.selectedPlan) {
        this.selectedPlan = this.currentPlan;
        this.getWords();
      }
    },

    async getWords() {
      this.words = await ipcRenderer.invoke('getWords', this.selectedPlan);
    },

    planCls(planId) {
      return planId === this.selectedPlan ? 'active' : 'link-dark';
    },

    clickPlan(plan) {
      this.selectedPlan = plan.id;
      this.editingWord = {};
      this.getWords();
    },

    newEmptyPlan() {
      this.newPlanCtx = {type: 'empty', name: ''};
      this.showPlanInput();
    },

    fromLibrary() {
      this.$emit('showPlanLibrary');
    },

    chooseLibrary(dict, tag, order) {
      this.newPlanCtx = {
        type: 'library', name: DICTIONARIES[dict].tags[tag],
        dict, tag, order
      }
      this.showPlanInput();
    },

    showPlanInput() {
      this.planning = true;
      this.$nextTick(() => this.$refs.planInput.focus());
    },

    async enterPlan() {
      this.planning = false;
      const content = `
      <div class="spinner-border spinner-border-sm text-secondary">
        <span class="visually-hidden">Loading...</span>
      </div>
      Creating Plan...`;
      this.$emit('showToast', {
        title: 'Waiting', content,
        animation: false, autohide: false, position: 'RB'
      });
      await ipcRenderer.invoke('newPlan', this.newPlanCtx);
      await this.getPlans();
      this.$emit('hideToast');
    },

    selectPlan() {
      if (this.currentPlan) {
        ipcRenderer.invoke('selectPlan', this.currentPlan);
      }
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

    async modifyPlan() {
      await ipcRenderer.invoke('renamePlan', this.editingPlan.id, this.editingPlan.name);
      await this.getPlans();
    },

    scrollBottom() {
      const wordList = this.$refs.wordList;
      wordList.scrollTo(0, wordList.children[0].clientHeight);
    },

    clickAdd() {
      this.adding = !this.adding;
      if (this.adding) {
        this.$nextTick(() => {
          this.scrollBottom();
          this.$refs.wordInput.focus();
        });
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
      this.$nextTick(() => this.scrollBottom());
    },

    editWord(word) {
      this.editingWord = {...word, newWord: word.word};
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
      const word = {
        plan_id: this.editingWord.plan_id,
        word: this.editingWord.word,
        paraphrase: this.editingWord.paraphrase,
      }
      if (word.word !== this.editingWord.newWord) {
        word.newWord = this.editingWord.newWord;
      }

      const err = await ipcRenderer.invoke('updateWord', word);
      if (err) {
        this.$emit('showToast', {content: 'Duplicated word', delay: 3000});
        return;
      }
      await this.getWords();
      this.editingWord = {};
    },

    resizeThead() {
      const tbody = this.$refs.tableBody;
      const first = tbody && tbody.children[0];
      if (first && first.children.length > 0) {
        this.$refs.wordHead.width = first.children[0].clientWidth;
      }
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

  watch: {
    inputedWord(word) {
      this.getParaphrase(word, paraphrase => this.inputedParaphrase = paraphrase);
    },

    'editingWord.newWord': function(word) {
      if (word === undefined) return;
      this.getParaphrase(word, paraphrase => this.editingWord.paraphrase = paraphrase);
    }
  },
}
</script>

<style scoped>
.float-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  transition-duration: 0.3s;
}
.float-btn[adding] {
  transform: rotate(45deg);
}
.float-btn:hover {
  filter: brightness(130%);
}
.float-btn:active {
  filter: brightness(80%);
}

.edit-btn {
  display: none;
}
.edit-btn:hover {
  filter: brightness(130%);
}
.edit-btn:active {
  filter: brightness(80%);
}

.has-edit:hover .edit-btn {
  display: block;
}
</style>
