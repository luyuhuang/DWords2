<template>
  <div class="d-flex flex-row justify-content-center col">
    <div ref="searchBox" class="input-group input-group-sm" style="width: 17rem; -webkit-app-region: no-drag">
      <input type="text" class="form-control" placeholder="Search" v-model="inputedWord" @keyup.enter="search(inputedWord)">
      <button class="btn search-btn" @click="search(inputedWord)">
        <i class="bi bi-search"></i>
      </button>
    </div>

    <div class="preview-list border shadow" v-if="candidates.length > 0">
      <div class="list-group list-group-flush">
        <a class="list-group-item list-group-item-action" href="#" v-for="(word, i) in candidates" :key="i" @click="search(word)">
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
            <button class="btn btn-outline-secondary btn-sm me-2">Edit</button>
            <button class="btn btn-outline-secondary btn-sm me-2">
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
      if (e.key == 'Escape') {
        this.inputedWord = '';
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
      }, 100);
    }
  }
}
</script>

<style scoped>
.search-btn {
  border-color: rgb(206, 212, 218);
  color: gray;
}

.preview-list {
  position: absolute;
  top: 55px;
  width: 17rem;
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
