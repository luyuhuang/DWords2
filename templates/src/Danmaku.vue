<template>
  <div class="d-flex flex-column danmaku" id="widget" ref="widget">
    <div class="align-self-start word" :class="color" @mousedown="mouseDownWord" @mouseup="mouseUpWord" ref="word">
      <span>{{ word }}</span>
      <span class="ms-1" v-if="showParaphrase">{{ paraphrase }}</span>
    </div>

    <div class="align-self-start card mt-2" style="width: 18rem;" v-if="activated">
      <div class="card-body">
        {{ paraphrase }}
      </div>
      <div class="container">
        <div class="row">
          <button type="button" @click="clickClear" class="col m-1 btn btn-outline-secondary btn-sm">Clear</button>
          <button type="button" @click="toggleParaphrase" class="col m-1 btn btn-outline-secondary btn-sm">
            {{ showParaphrase ? 'Hide' : 'Show'}} paraphrase
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
const { ipcRenderer } = window.require('electron');

const urlParams = new URLSearchParams(window.location.search);

export default {
  data() {
    return {
      word: urlParams.get('word'),
      paraphrase: urlParams.get('paraphrase'),
      showParaphrase: urlParams.get('showParaphrase') === 'true',
      color: urlParams.get('color'),
      activated: false,
      lastX: 0,
      lastY: 0,
      collaspe: null,
    };
  },

  mounted() {
    new ResizeObserver(this.updateSize).observe(this.$refs.widget);
    this.updateSize();
  },

  methods: {
    mouseDownWord(e) {
      this.lastX = e.screenX;
      this.lastY = e.screenY;
    },
    mouseUpWord(e) {
      const d = Math.abs(e.screenX - this.lastX) + Math.abs(e.screenY - this.lastY)
      if (d < 5) {
        this.clickWord(e)
      }
    },

    clickWord() {
      this.activated = !this.activated;
      const word = this.$refs.word;
      if (this.activated) {
        word.classList.add('activated');
      } else {
        word.classList.remove('activated');
      }
    },

    clickClear() {
    },

    toggleParaphrase() {
      this.showParaphrase = !this.showParaphrase;
    },

    updateSize() {
      const widget = this.$refs.widget;
      ipcRenderer.send('setWinSize', widget.clientWidth, widget.clientHeight);
    },
  }
}
</script>

<style scoped>
.danmaku {
  pointer-events: all;
  position: absolute;
}

.danmaku .word {
  -webkit-app-region: drag;
  user-select: none;
  border-radius: 10px;
  padding: 8px;
  opacity: 0.5;
}

.danmaku .card {
  border-radius: 10px;
}

.danmaku .word.activated {
  opacity: 1;
}

.danmaku .word:hover {
  opacity: 1;
}

.danmaku .word.red {
  background-color: #ff4757;
  color: #ffffff;
}
.danmaku .word.coral {
  background-color: #ff7f50;
  color: #ffffff;
}
.danmaku .word.orange {
  background-color: #ffa502;
  color: #ffffff;
}
.danmaku .word.green {
  background-color: #2ed573;
  color: #ffffff;
}
.danmaku .word.blue {
  background-color: #1e90ff;
  color: #ffffff;
}
.danmaku .word.sky {
  background-color: #5352ed;
  color: #ffffff;
}
.danmaku .word.dark {
  background-color: #2f3542;
  color: #ffffff;
}
.danmaku .word.white {
  background-color: #ecf0f1;
  border-style: solid;
  border-width: 1px;
  border-color: rgba(0, 0, 0, 0.125);
  color: #000000;
}
</style>
