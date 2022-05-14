<template>
  <div class="mb-4">
    <h3 :id="id">Synchronization</h3>

    <div class="mb-2">
      <span class="form-label">WebDAV URL</span>
      <input type="text" class="form-control form-control-sm"
        v-model="settings.syncURL" @change="change('syncURL')">
    </div>

    <div class="mb-2">
      <span class="form-label">User name</span>
      <input type="text" class="form-control form-control-sm"
        v-model="settings.username" @change="change('username')">
    </div>

    <div class="mb-2">
      <span class="form-label">Password</span>
      <input type="password" class="form-control form-control-sm"
        v-model="settings.password" @change="change('password')">
    </div>

    <div class="mb-2">
      <span>Synchronization Interval: {{ interval }}</span>
      <input type="range" class="form-range" min="60" max="3600" step="10"
        v-model.number="settings.syncInterval" @change="change('syncInterval')">
    </div>

  </div>
</template>

<script>
export default {
  props: {
    id: String,
    settings: Object,
  },

  methods: {
    change(...keys) {
      this.$emit('change', ...keys);
    },
  },

  computed: {
    interval() {
      let seconds = this.settings.syncInterval;
      const min = Math.floor(seconds / 60);
      seconds %= 60;
      if (min > 0) {
        return `${min} min ${seconds} sec`;
      } else {
        return `${seconds} sec`;
      }
    }
  }
};
</script>
