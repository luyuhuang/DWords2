<template>
  <div class="d-flex flex-column" style="flex: 1; overflow-y: auto">
    <table class="table m-0 border-end no-select">
      <thead>
        <tr> <th ref="wordHead" id="wordHead" :style="wordStyle">Word</th> <th>Paraphrase</th> </tr>
      </thead>
    </table>

    <div @scroll="scrollList" class="mb-auto" style="flex: 1; overflow-y: auto">
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

    <ContextMenu></ContextMenu>
  </div>
</template>

<script>
import ContextMenu from '../components/ContextMenu.vue';
import { html2text } from '../scripts/utils';
const { ipcRenderer, shell } = window.require("electron");

export default {
  name: 'Table',
  props: {
    words: Array, quiz: Boolean,
  },

  components: { ContextMenu },

  data() {
    return {
      wordWidth: 150,
      dictionaries: [],
    };
  },

  created() {
    this.fetchSettings();
  },

  mounted() {
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.$refs.wordHead);
  },

  destroyed() {
    this.resizeObserver.disconnect();
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
      this.$parent.$emit('search', word.word);
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
  },

  computed: {
    wordStyle() {
      return {
        width: this.wordWidth + 'px',
      };
    }
  }
};
</script>

<style scoped>
.table-content {
  table-layout: fixed;
  width: 100%;
}

td {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

#wordHead {
  resize: horizontal;
  overflow: auto;
}
</style>
