<template>
  <div class="d-flex flex-row justify-content-center col">
    <div class="search" style="-webkit-app-region: no-drag">
      <i class="search-icon bi bi-search"></i>
      <input ref="searchBox" type="text" class="search-box" placeholder="Search" v-model="inputedWord">
    </div>

    <div class="preview-list border shadow" v-if="candidates.length > 0">
      <div class="list-group list-group-flush">
        <a v-for="(word, i) in candidates" :key="i" class="list-group-item list-group-item-action"
          :class="i === index ? 'active' : ''" href="#" @click="search(word)"
        >
          {{ word }}
        </a>
      </div>
    </div>

    <div class="modal fade" tabindex="-1" ref="modal" style="-webkit-app-region: no-drag">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-body">
            <button type="button" class="btn-close close-modal" data-bs-dismiss="modal"></button>
            <h4>{{ result.word }}</h4>
            <p v-if="result.phonetic">
              [{{ result.phonetic }}]
              <a @click="pronounce" class="bi bi-volume-up pronounce" href="#"></a>
            </p>
            <p v-html="result.paraphrase"></p>

            <div v-for="(dict, i) in dictionaries" :key="i">
              <a @click="clickDictionary" href="#" :index="i"> {{ dict.name }} </a>
            </div>
          </div>

          <div class="modal-footer p-2" v-if="result.status !== undefined">
            <button class="btn btn-outline-secondary btn-sm me-2" @click="clickEdit">Edit</button>
            <button class="btn btn-outline-secondary btn-sm me-2" @click="clickMark">
              Mark as {{ result.status === 0 ? 'memorized' : 'unmemorized' }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { Modal } from 'bootstrap'
const { ipcRenderer, shell } = window.require('electron');

export default {
  data() {
    return {
      inputedWord: '',
      index: -1,
      candidates: [],
      dictionaries: [],

      result: {},
    }
  },

  created() {
    this.fetchSettings();
  },

  mounted() {
    this.modal = new Modal(this.$refs.modal, {})

    document.addEventListener('keyup', e => {
      if (e.key === 'Escape') {
        this.inputedWord = '';
      } else if (e.key === 's' || e.key === '/') {
        this.$refs.searchBox.focus();
      } else if (e.key === 'ArrowDown') {
        this.index = Math.min(this.index + 1, this.candidates.length - 1);
      } else if (e.key === 'ArrowUp') {
        this.index = Math.max(this.index - 1, Math.min(0, this.candidates.length - 1));
      } else if (e.key === 'Enter') {
        if (this.index >= 0) {
          this.search(this.candidates[this.index]);
        } else if (this.inputedWord) {
          this.search(this.inputedWord);
        }
      }
    });
    this.$parent.$on('search', this.search);
  },

  methods: {
    async search(word) {
      const res = await ipcRenderer.invoke('search', word);
      if (res) {
        this.result = res;
        this.modal.show();
      }
    },

    async fetchSettings() {
      const settings = await ipcRenderer.invoke('getSettings', 'externalDictionaries');
      this.dictionaries = settings.externalDictionaries;
    },

    pronounce() {
      const word = this.result.word;
      const c = word[0].toUpperCase();
      new Audio(`../assets/audio/${c}/${word}.mp3`).play();
    },

    clickDictionary(e) {
      const dict = this.dictionaries[e.target.getAttribute('index')]
      shell.openExternal(dict.url + this.result.word);
    },

    clickEdit() {
      this.modal.hide();
      const query = new URLSearchParams({
        edit: this.result.word,
        plan: this.result.plan_id,
      }).toString();
      this.$router.push(`/plans?${query}`);
    },

    clickMark() {
      const res = this.result;
      res.status = res.status === 1 ? 0 : 1;
      ipcRenderer.invoke('updateWord', res.plan_id, res.word, {status: res.status});
    },

  },

  watch: {
    inputedWord(word) {
      if (this.inputTimer) {
        clearTimeout(this.inputTimer);
      }
      this.inputTimer = setTimeout(async () => {
        if (word) {
          this.candidates = await ipcRenderer.invoke('getWordsByPrefix', word);
        } else {
          this.candidates = [];
        }
        this.index = -1;
      }, 100);
    }
  }
}
</script>

<style scoped>
.search {
  -webkit-app-region: no-drag;
  position: relative;
}

.search-icon {
  color: gray;
  position: absolute;
  left: 0.5em;
  padding: 0.25em;
}

.search-box {
  height: 1em;
  width: 17em;
  border: none;
  border-width: 0px;
  background: #eff0f1;
  border-radius: 1em;
  padding: 1em;
  padding-left: 2.2em;
}

.search-box:focus {
  outline: none;
}

.preview-list {
  position: absolute;
  top: 55px;
  width: 16rem;
  max-height: 90%;
  overflow-y: auto;
}

.close-modal {
  position: absolute;
  right: 13px;
}

.pronounce {
  color: #6c757d;
  font-size: 1.2rem;
  vertical-align: middle;
}

.pronounce:hover {
  color: #212529;
}
</style>
