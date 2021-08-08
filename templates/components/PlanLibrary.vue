<template>
  <div class="modal fade" tabindex="-1" ref="modal">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="staticBackdropLabel">Plan Library</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <div class="mb-2">
            <span class="form-label">Dictionary</span>
            <select class="form-select form-select-sm" :class="invalidDict" v-model="dictionary" required>
              <option v-for="(dict, k) in DICTIONARIES" :key="k" :value="k">{{ dict.name }}</option>
            </select>
            <div class="invalid-feedback">
              Please choose a dictionary
            </div>
          </div>

          <div class="mb-2">
            <span class="form-label">Tag</span>
            <select class="form-select form-select-sm" :class="invalidTag" v-model="tag" required>
              <option v-for="(name, k) in tags" :key="k" :value="k">{{ name }}</option>
            </select>
            <div class="invalid-feedback">
              Please choose a tag
            </div>
          </div>


          <div class="mb-2">
            <span class="form-label">Order</span>
            <select class="form-select form-select-sm" v-model="order" required>
              <option value="frq">Frequency</option>
              <option value="word">A-Z</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-primary" @click="clickChoose">
            Choose
          </button>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
const { ipcRenderer } = window.require('electron');
import { Modal } from 'bootstrap'
import { DICTIONARIES } from '../../src/common'

export default {
  data() {
    return {
      DICTIONARIES,
      dictionary: undefined,
      tag: undefined,
      order: 'frq',
      invalidTag: '',
      invalidDict: '',
    }
  },

  created() {
    this.fetchSettings();
  },

  mounted() {
    this.modal = new Modal(this.$refs.modal, {})
    this.$parent.$on('showPlanLibrary', () => {
      this.tag = undefined;
      this.invalidTag = this.invalidDict = '';
      this.modal.show();
    });
  },

  methods: {
    async fetchSettings() {
      const settings = await ipcRenderer.invoke('getSettings', 'dictionary');
      this.dictionary = settings.dictionary;
    },

    clickChoose() {
      if (!this.dictionary || !this.tag) {
        if (!this.dictionary) this.invalidDict = 'is-invalid';
        if (!this.tag) this.invalidTag = 'is-invalid';
        return;
      }
      this.modal.hide();
      this.$emit('choose', this.dictionary, this.tag, this.order);
    },
  },

  computed: {
    dictName() {
      const dict = DICTIONARIES[this.dictionary];
      if (dict) {
        return dict.name;
      }
    },

    tags() {
      const dict = DICTIONARIES[this.dictionary];
      if (dict) {
        return dict.tags;
      }
    },
  },

  watch: {
    dictionary() {
      this.invalidDict = '';
      this.tag = undefined;
    },

    tag() {
      this.invalidTag = '';
    },
  }
}
</script>
