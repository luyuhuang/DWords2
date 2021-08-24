<template>
  <div class="d-flex flex-column" style="width: 100vw">
    <div class="d-flex flex-row align-items-center p-3" style="-webkit-app-region: drag">
      <Search></Search>
      <div class="d-flex flex-row-reverse" style="-webkit-app-region: no-drag">
        <button type="button" class="btn-close" @click="clickClose"></button>
      </div>
    </div>
    <table class="table m-0 border-end no-select">
      <thead>
        <tr> <th ref="wordHead">Word</th> <th>Paraphrase</th> </tr>
      </thead>
    </table>
    <div class="mb-auto" style="overflow-y: auto;">
      <table class="table table-striped table-borderless">
        <tbody ref="tableBody">
          <tr v-for="(word, i) in wordList" :key="i" @click="clickWord(word)" @contextmenu="wordMenu($event, word)">
            <td>{{ word.word }}</td>
            <td>
              <span class="paraphrase" :hide="quiz && !word.see">
                {{ html2text(word.paraphrase) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pt-2 pb-2 pe-2 border-top d-flex flex-row-reverse">
      <button type="button" class="btn btn-primary me-2" :disabled="syncing" @click="clickSync">
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" v-if="syncing"></span>
        {{ syncing ? 'Syncing...' : 'Sync' }}
      </button>
      <button type="button" class="btn me-2" :class="quiz ? 'btn-secondary' : 'btn-primary'" @click="clickQuiz">
        {{quiz ? 'Back' : 'Quiz'}}
      </button>
    </div>

    <Toast></Toast>
    <ContextMenu></ContextMenu>
  </div>
</template>

<script>
import Search from './Search.vue';
import Toast from '../components/Toast.vue'
import ContextMenu from '../components/ContextMenu.vue'
import { html2text } from '../scripts/utils';
const { ipcRenderer } = window.require("electron");

export default {
  name: 'Table',
  props: {
    wordList: Array,
  },

  components: {Search, Toast, ContextMenu},

  data() {
    return {
      quiz: false,
      syncing: false,
    };
  },

  mounted() {
    const tbody = this.$refs.tableBody;
    new MutationObserver(this.resizeThead).observe(tbody, {
      childList: true, characterData: true, subtree: true
    });
    new ResizeObserver(this.resizeThead).observe(tbody)
  },

  methods: {
    html2text,

    resizeThead() {
      const tbody = this.$refs.tableBody;
      const first = tbody && tbody.children[0];
      if (first) {
        this.$refs.wordHead.width = first.children[0].clientWidth;
      }
    },

    clickClose(e) {
      e.target.blur();
      ipcRenderer.send('close');
    },

    clickQuiz() {
      this.quiz = !this.quiz;
      for (const word of this.wordList) {
        word.see = false;
      }
    },

    clickWord(word) {
      word.see = !word.see;
    },

    wordMenu(e, word) {
      const mark = word.status === 0 ? 'memorized' : 'unmemorized';

      const items = [
        { name: 'Detail', onclick: () => this.wordDetail(word) },
        { name: 'Edit', onclick: () => {} },
        '----------------',
        { name: `Mark as ${mark}`, onclick: () => this.toggleWordStatus(word) },
      ];

      this.$emit('showContextMenu', {x: e.clientX, y: e.clientY, items});
    },

    wordDetail(word) {
      this.$emit('search', word.word);
    },

    toggleWordStatus(word) {
      const status = word.status === 1 ? 0 : 1;
      ipcRenderer.invoke('updateWord', word.plan_id, word.word, {status});
    },

    async clickSync() {
      if (this.syncing) {
        return;
      }
      this.syncing = true;
      const err = await ipcRenderer.invoke('sync');
      if (err) {
        this.$emit('showToast', {content: err, delay: 3000});
      }
      this.syncing = false;
    }
  },
}
</script>

<style scoped>
.paraphrase {
  transition-duration: 0.3s;
  opacity: 1;
}

.paraphrase[hide] {
  opacity: 0;
  filter: blur(0.2em);
}

</style>
