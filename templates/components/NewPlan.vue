<template>
  <div class="modal fade no-select" tabindex="-1" ref="modal">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="staticBackdropLabel">New Plan</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <div class="mb-2">
            <span class="form-label">Name</span>
            <input type="text" class="form-control form-select-sm" :class="invalidName" v-model="name" required>
            <div class="invalid-feedback">
              Please enter a name
            </div>
          </div>

          <div class="d-flex flex-row mb-2">
            <div class="form-check me-3" v-for="(item, i) in types" :key="i">
              <input class="form-check-input" type="radio" :id="`type-${item.type}`" :value="item.type" v-model="currType">
              <label class="form-check-label" :for="`type-${item.type}`">
                {{ item.name }}
              </label>
            </div>
          </div>

          <template v-if="currType === 'library'">
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

          </template>

          <template v-else-if="currType === 'empty'"></template>

          <template v-else-if="currType === 'import_'">
            <div class="input-group has-validation mb-2">
              <input type="text" class="form-control" :class="invalidPath" placeholder="Choose a file" v-model="path" disabled>
              <button class="btn btn-outline-secondary" type="button" @click="clickOpen">Open...</button>
              <div class="invalid-feedback">
                Please choose a file.
              </div>
            </div>
          </template>

          <div class="alert alert-danger mb-0" v-if="error">{{ error }}</div>

        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-primary" @click="clickCreate" :disabled="creating">
            <span class="spinner-border spinner-border-sm" v-if="creating"></span>
            {{ creating ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
const { ipcRenderer } = window.require('electron');
import { Modal } from 'bootstrap';
import { DICTIONARIES } from '../../src/common';

export default {
  data() {
    const types = [
      { type: 'library', name: 'From Library' },
      { type: 'empty', name: 'Empty Plan' },
      { type: 'import_', name: 'Import...' },
    ];
    return {
      DICTIONARIES,
      dictionary: undefined,

      types,
      currType: types[0].type,

      name: '',
      tag: undefined,
      order: 'frq',
      path: '',

      invalidName: '',
      invalidTag: '',
      invalidDict: '',
      invalidPath: '',

      creating: false,
      error: '',
    };
  },

  created() {
    this.fetchSettings();
  },

  mounted() {
    this.modal = new Modal(this.$refs.modal, {});
    this.$parent.$on('newPlan', () => {
      this.name = '';
      this.tag = undefined;
      this.path = '';

      this.invalidName = this.invalidTag = this.invalidDict = this.invalidPath = '';
      this.error = '';

      this.modal.show();
    });
  },

  methods: {
    async fetchSettings() {
      const settings = await ipcRenderer.invoke('getSettings', 'dictionary');
      this.dictionary = settings.dictionary;
    },

    async clickOpen() {
      const path = await ipcRenderer.invoke('importPlan');
      if (path) {
        this.path = path;
      }
    },

    checkParams() {
      const invalid = [];
      if (!this.name) invalid.push('invalidName');
      switch (this.currType) {
        case 'library':
          if (!this.dictionary) invalid.push('invalidDict');
          if (!this.tag) invalid.push('invalidTag');
          break;
        case 'empty':
          break;
        case 'import_':
          if (!this.path) invalid.push('invalidPath');
          break;
      }

      for (const field of invalid) {
        this[field] = 'is-invalid';
      }

      return invalid.length === 0;
    },

    async clickCreate() {
      if (this.creating || !this.checkParams()) {
        return;
      }

      this.creating = true;

      const {err} = await ipcRenderer.invoke('newPlan', {
        name: this.name,
        type: this.currType,
        dict: this.dictionary,
        tag: this.tag,
        order: this.order,
        path: this.path,
      });

      if (err) {
        this.error = err;
      } else {
        this.modal.hide();
        this.$emit('planCreated');
      }

      this.creating = false;
    },
  },

  computed: {
    tags() {
      const dict = DICTIONARIES[this.dictionary];
      if (dict) {
        return dict.tags;
      } else {
        return {};
      }
    },
  },

  watch: {
    name() {
      this.invalidName = '';
    },

    dictionary() {
      this.invalidDict = '';
      this.tag = undefined;
    },

    tag() {
      this.invalidTag = '';
    },

    path() {
      this.invalidPath = '';
    }
  }
};
</script>
