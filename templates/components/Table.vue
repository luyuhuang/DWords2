<template>
  <div class="col-9 d-flex flex-column">
    <div class="d-flex flex-row align-items-center p-3" style="-webkit-app-region: drag">
      <Search></Search>
      <div class="d-flex flex-row-reverse" style="-webkit-app-region: no-drag">
        <button type="button" class="btn-close" @click="clickClose"></button>
      </div>
    </div>
    <table class="table m-0 border-end no-select">
      <thead>
        <tr> <th ref="wordHead" id="wordHead" :style="wordStyle">Word</th> <th>Paraphrase</th> </tr>
      </thead>
    </table>
    <div @scroll="scrollList" class="mb-auto" style="overflow-y: auto;">
      <table class="table table-striped table-borderless table-content">
        <tbody>
          <tr v-for="(word, i) in words" :key="i" @click="clickWord(word)" @contextmenu="wordMenu($event, word)">
            <td :style="wordStyle">{{ word.word }}</td>
            <td>
              <span v-if="!quiz || word.see">
                {{ html2text(word.paraphrase) }}
              </span>
              <span v-else class="fst-italic text-secondary" style="opacity:0.4">
                click to show the paraphrase
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pt-2 pb-2 pe-2 border-top d-flex flex-row-reverse">
      <button type="button" class="btn btn-primary me-2" :disabled="syncing" @click="clickSync">
        <span class="spinner-border spinner-border-sm" v-if="syncing"></span>
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
const { ipcRenderer, shell } = window.require("electron");

export default {
  name: 'Table',
  props: {
    words: Array,
  },

  components: {Search, Toast, ContextMenu},

  data() {
    return {
      wordWidth: 150,
      quiz: false,
      syncing: false,
      dictionaries: [],
    };
  },

  created() {
    this.fetchSettings();
  },

  mounted() {
    new ResizeObserver(this.resize).observe(this.$refs.wordHead);
  },

  methods: {
    html2text,

    async fetchSettings() {
      const settings = await ipcRenderer.invoke('getSettings', 'externalDictionaries');
      this.dictionaries = settings.externalDictionaries;
    },

    resize() {
      this.wordWidth = this.$refs.wordHead.clientWidth;
    },

    clickClose(e) {
      e.target.blur();
      ipcRenderer.send('close');
    },

    clickQuiz() {
      this.quiz = !this.quiz;
      for (const word of this.words) {
        word.see = false;
      }
    },

    clickWord(word) {
      word.see = !word.see;
    },

    wordMenu(e, word) {
      const mark = word.status === 0 ? 'memorized' : 'unmemorized';

      const items = [
        { name: 'Detail', action: () => this.wordDetail(word) },
        { name: 'Edit', action: () => this.editWord(word) },
        '----------------',
        { name: `Mark as ${mark}`, action: () => this.toggleWordStatus(word) },
      ];

      if (this.dictionaries.length > 0) {
        items.push('----------------');
        items.push(...this.dictionaries.map(d => ({
          name: d.name, action: () => shell.openExternal(d.url + word.word)
        })));
      }

      this.$emit('showContextMenu', {x: e.clientX, y: e.clientY, items});
    },

    wordDetail(word) {
      this.$emit('search', word.word);
    },

    editWord(word) {
      const query = new URLSearchParams({
        edit: word.word,
        plan: word.plan_id,
      }).toString();
      this.$router.push(`/plans?${query}`);
    },

    toggleWordStatus(word) {
      const status = word.status === 1 ? 0 : 1;
      ipcRenderer.invoke('updateWord', word.plan_id, word.word, {status});
    },

    scrollList(e) {
      const wordList = e.target;
      if (wordList.scrollHeight - Math.abs(wordList.scrollTop) === wordList.clientHeight) {
        this.$emit('needMore');
      }
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

  computed: {
    wordStyle() {
      return {
        width: this.wordWidth + 'px',
      };
    }
  }
}
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
