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
            <li><a class="dropdown-item"><i class="bi bi-collection me-2"></i>From Library</a></li>
            <li><a class="dropdown-item"><i class="bi bi-folder me-2"></i>Import...</a></li>
          </ul>
        </div>

        <hr>

        <div style="overflow-y: auto">
          <ul class="nav nav-pills flex-column mb-auto">
            <li class="nav-item" v-for="(plan, i) in plans" :key="i">
              <a class="nav-link" :class="planCls(plan.id)" @click="clickPlan(plan)"><i class="bi bi-journal-text me-2"></i>{{ plan.name }}</a>
            </li>

            <li class="nav-item p-1" v-if="planning">
              <input class="form-control form-control-sm" placeholder="Plan Name" ref="planInput"
                     v-model="inputedPlanName" @keyup.enter="enterPlan" @blur="planning = false">
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
              <tr v-for="(word, i) in words" :key="i">
                <td>{{ word.word }}</td>
                <td>{{ html2text(word.paraphrase) }}</td>
              </tr>
              <tr v-if="adding">
                <td>
                  <input class="form-control form-control-sm" placeholder="Word" ref="wordInput" @keyup.enter="enterWord" v-model="inputedWord">
                </td>
                <td>
                  <input class="form-control form-control-sm" placeholder="Paraphrase" ref="paraphraseInput" @keyup.enter="enterParaphrase" v-model="inputedParaphrase">
                </td>
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
  </div>
</template>

<script>
import { html2text } from '../scripts/utils';
import Title from '../components/Title.vue'
const { ipcRenderer } = window.require('electron');

export default {
  components: {Title},
  data() {
    return {
      currentPlan: undefined,
      selectedPlan: undefined,
      plans: [],
      words: [],
      planning: false,
      adding: false,
      inputedPlanName: '',
      inputedWord: '',
      inputedParaphrase: '',
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
      this.getWords();
    },

    newEmptyPlan() {
      this.showPlanInput();
    },

    showPlanInput() {
      this.planning = true;
      this.$nextTick(() => this.$refs.planInput.focus());
    },

    async enterPlan() {
      this.planning = false;
      await ipcRenderer.invoke('newPlan', this.inputedPlanName);
      await this.getPlans();
    },

    selectPlan() {
      if (this.currentPlan) {
        ipcRenderer.invoke('selectPlan', this.currentPlan);
      }
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

    addWord() {
      const now = new Date().getTime();
      this.words.push({
        word: this.inputedWord,
        paraphrase: this.inputedParaphrase,
        time: now,
      });
      ipcRenderer.invoke('addWord', this.selectedPlan, this.inputedWord, now, this.inputedParaphrase);

      this.inputedWord = this.inputedParaphrase = '';
      this.$refs.wordInput.focus();
      this.$nextTick(() => this.scrollBottom());
    },

    resizeThead() {
      const tbody = this.$refs.tableBody;
      const first = tbody && tbody.children[0];
      if (first) {
        this.$refs.wordHead.width = first.children[0].clientWidth;
      }
    },
  },

  watch: {
    inputedWord(word) {
      if (this.inputTimer) {
        clearTimeout(this.inputTimer);
      }
      this.inputTimer = setTimeout(async () => {
        const res = await ipcRenderer.invoke('consultDictionary', word);
        if (res) {
          this.inputedParaphrase = res.paraphrase;
        } else {
          this.inputedParaphrase = '';
        }
      }, 100);
    }
  },
}
</script>

<style scoped>
.float-btn {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  position: fixed;
  right: 0.5rem;
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
</style>
