<template>
  <div class="d-flex flex-column no-select" style="height: 100vh">
    <Title title="Settings"></Title>

    <div class="d-flex flex-row" style="flex: 1; overflow-y: auto">

      <div ref="catalog" class="nav nav-pills flex-column border-end overflow-hidden col-3 p-3">
        <a class="nav-link link-dark" href="#settings-1">General</a>
        <a class="nav-link link-dark" href="#settings-2">Danmaku</a>
        <a class="nav-link link-dark" href="#settings-3">Synchronization</a>
        <a class="nav-link link-dark" href="#settings-4">Advanced</a>
      </div>

      <div ref="setting" class="col-9 ps-3 mt-3 mb-3 pe-3" style="overflow-y: auto; position: relative">
        <GeneralSettings id="settings-1" :settings="settings" @change="change"></GeneralSettings>
        <DanmakuSettings id="settings-2" :settings="settings" @change="change"></DanmakuSettings>
        <SyncSettings id="settings-3" :settings="settings" @change="change"></SyncSettings>
        <AdvancedSettings id="settings-4" :settings="settings" @change="change"></AdvancedSettings>
      </div>

    </div>

  </div>
</template>

<script>
import Title from '../components/Title.vue';
import GeneralSettings from '../components/GeneralSettings.vue';
import DanmakuSettings from '../components/DanmakuSettings.vue';
import SyncSettings from '../components/SyncSettings.vue';
import AdvancedSettings from '../components/AdvancedSettings.vue';
import { ScrollSpy } from 'bootstrap';
const { ipcRenderer } = window.require("electron");

export default {
  data() {
    return {
      settings: {}
    };
  },

  async created() {
    this.settings = await ipcRenderer.invoke("getSettings");
  },

  mounted() {
    this.scrollSpy = new ScrollSpy(this.$refs.setting, {
      target: this.$refs.catalog,
    });

    this.$on('onModifyDOM', () => this.scrollSpy.refresh());
  },

  updated() {
    this.scrollSpy.refresh();
  },

  components: {Title, GeneralSettings, DanmakuSettings, SyncSettings, AdvancedSettings},

  methods: {
    change(...keys) {
      const update = {};
      for (const key of keys) {
        update[key] = this.settings[key];
      }
      ipcRenderer.invoke("updateSettings", update);
    }
  },
};
</script>
