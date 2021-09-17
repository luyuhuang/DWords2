<template>
  <div class="mb-4">
    <h3 :id="id">General</h3>

    <div class="mb-2">
      <span class="form-label">Dictionary</span>
      <select class="form-select form-select-sm" v-model="settings.dictionary" @change="change('dictionary')">
        <option v-for="(dict, k) in DICTIONARIES" :key="k" :value="k">{{ dict.name }}</option>
      </select>
    </div>

    <div class="mb-3">
      <span class="form-label">Maximum current words</span>
      <input type="number" min="1" max="999" class="form-control form-control-sm"
        v-model.number="settings.maxCurrent" @change="change('maxCurrent')">
    </div>

    <div class="mb-4 form-check form-switch">
      <input class="form-check-input" type="checkbox" v-model="settings.autoRun" @change="change('autoRun')">
      <label class="form-check-label">Run DWords when my computer starts</label>
    </div>

    <div class="mb-3 d-flex flex-column">
      <span>External dictionaries:</span>
      <table class="mb-1">
        <tbody>
          <tr> <td>Name</td> <td>URL</td> </tr>
          <tr v-for="(dict, i) in settings.externalDictionaries" :key="i">
            <td>
              <input class="form-control form-control-sm" placeholder="Name"
                v-model="dict.name" @change="change('externalDictionaries')">
            </td>
            <td>
              <input class="form-control form-control-sm" placeholder="URL"
                v-model="dict.url" @change="change('externalDictionaries')">
            </td>
            <td style="text-align: right">
              <button type="button" class="btn-sm btn-close" @click="delExternalDict(i)"></button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="d-flex flex-row">
        <button type="button" class="btn btn-sm btn-outline-success" @click="addExternalDict">
          Add dictionary
        </button>
      </div>
    </div>

  </div>
</template>

<script>
import { DICTIONARIES } from '../../src/common';

export default {
  data() {
    return {
      DICTIONARIES
    };
  },

  updated() {
  },

  props: {
    id: String,
    settings: Object,
  },

  methods: {
    addExternalDict() {
      this.settings.externalDictionaries.push({name: '', url: ''});
      this.change('externalDictionaries');
      this.$nextTick(() => this.$parent.$emit('onModifyDOM'));
    },

    delExternalDict(i) {
      this.settings.externalDictionaries.splice(i, 1);
      this.change('externalDictionaries');
      this.$nextTick(() => this.$parent.$emit('onModifyDOM'));
    },

    change(...keys) {
      this.$emit('change', ...keys);
    },
  },
};
</script>
