<template>
  <div class="mb-4">
    <h3 :id="id">Danmaku</h3>

    <div class="mb-2">
      <span>Speed: {{ settings.danmakuSpeed }}</span>
      <input type="range" class="form-range" min="5" max="30" step="0.1"
        v-model.number="settings.danmakuSpeed" @change="change('danmakuSpeed')">
    </div>

    <div class="mb-2">
      <span>Frequency: per {{ settings.danmakuFrequency }}s</span>
      <input type="range" class="form-range" min="2" max="15" step="0.1"
        v-model.number="settings.danmakuFrequency" @change="change('danmakuFrequency')">
    </div>

    <div class="mb-2">
      <span>Transparency: {{ settings.danmakuTransparency / 100 }}</span>
      <input type="range" class="form-range" min="10" max="100"
        v-model.number="settings.danmakuTransparency" @change="change('danmakuTransparency')">
    </div>

    <div class="mb-2">
      <span>Size: {{ settings.danmakuSize }}</span>
      <input type="range" class="form-range" min="10" max="50"
        v-model.number="settings.danmakuSize" @change="change('danmakuSize')">
    </div>

    <div class="mb-2">
      <button type="button" class="btn btn-sm btn-outline-success me-3" @click="displayArea">
        Display area adjustment
      </button>
    </div>

    <div class="mb-2 form-check form-switch">
      <input class="form-check-input" type="checkbox"
        v-model="settings.disableClick" @change="change('disableClick')">
      <label class="form-check-label">Disable click</label>
    </div>

    <div class="mb-2 form-check form-switch">
      <input class="form-check-input" type="checkbox"
        v-model="settings.closeOnBlur" @change="change('closeOnBlur')">
      <label class="form-check-label">Close details when out of focus</label>
    </div>

    <div class="mb-2 form-check form-switch">
      <input class="form-check-input" type="checkbox"
        v-model="settings.defaultShowParaphrase" @change="change('defaultShowParaphrase')">
      <label class="form-check-label">Default show paraphrase</label>
    </div>

    <div class="mb-2">
      <span class="form-label">Paraphrase length limit</span>
      <input type="number" min="3" max="99" class="form-control form-control-sm"
        v-model.number="settings.maxPharaphraseLen" @change="change('maxPharaphraseLen')">
    </div>

    <div class="mb-2">
      <span>Default color:</span>
      <div class="d-flex flex-row justify-content-between">
        <div v-for="(c, i) in colors" :key="i">
          <input class="radio" type="radio" name="color" :id="'radio-' + c" :value="c" hidden
            v-model="settings.danmakuColor" @change="change('danmakuColor')"/>
          <label :for="'radio-' + c" class="radio" :class="c"></label>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron");

export default {
  data() {
    return {
      colors: ['red', 'coral', 'orange', 'green', 'blue', 'sky', 'dark', 'white'],
    };
  },

  props: {
    id: String,
    settings: Object,
  },

  methods: {
    change(...keys) {
      this.$emit('change', ...keys);
    },

    displayArea() {
      ipcRenderer.invoke('openDisplayArea');
    },
  },
};
</script>

<style scoped>
label.radio {
  height: 22px;
  width: 22px;
  border-radius: 5px;
}

input.radio:checked + label.radio {
  border-style: solid;
  border-width: 3px;
  border-color: black;
}

input.radio:checked + label.radio.dark {
  border-color: orange;
}

.red {
  background-color: #ff4757;
  color: #ffffff;
}
.coral {
  background-color: #ff7f50;
  color: #ffffff;
}
.orange {
  background-color: #ffa502;
  color: #ffffff;
}
.green {
  background-color: #2ed573;
  color: #ffffff;
}
.blue {
  background-color: #1e90ff;
  color: #ffffff;
}
.sky {
  background-color: #5352ed;
  color: #ffffff;
}
.dark {
  background-color: #2f3542;
  color: #ffffff;
}
.white {
  background-color: #ecf0f1;
  border-style: solid;
  border-width: 1px;
  border-color: rgba(0, 0, 0, 0.125);
  color: #000000;
}
</style>
