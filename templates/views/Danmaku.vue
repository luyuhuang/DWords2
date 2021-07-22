<template>
  <div class="d-flex flex-column danmaku" id="widget" ref="widget">
    <div class="align-self-start word" :class="color" :activated="activated" @mousedown="mouseDownWord">
      <span>{{ word }}</span>
      <span class="ms-1" v-if="showParaphrase">{{ paraphrase }}</span>
    </div>

    <div class="align-self-start card mt-2" style="width: 18rem;" v-if="activated">
      <div class="card-body">
        <h5> {{ word }} <a @click="pronounce" class="bi bi-volume-up pronounce" href="#"></a> </h5>
        <p>{{ paraphrase }}</p>
        <div v-for="(dict, i) in dictionaries" :key="i">
          <a @click="clickDictionary" href="#" :index="i"> {{ dict.name }} </a>
        </div>
      </div>
      <div class="d-flex flex-column">
        <div class="d-flex justify-content-evenly">
          <div v-for="(c, i) in colors" :key="i">
            <input class="radio" type="radio" name="color" :id="'radio-' + c" :value="c" hidden v-model="color"/>
            <label :for="'radio-' + c" class="radio" :class="c"></label>
          </div>
        </div>

        <div class="d-flex">
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
const { ipcRenderer, shell } = window.require('electron');

const urlParams = new URLSearchParams(window.location.search);

export default {
  data() {
    return {
      word: urlParams.get('word'),
      paraphrase: urlParams.get('paraphrase'),
      showParaphrase: urlParams.get('showParaphrase') === 'true',
      color: urlParams.get('color'),
      activated: false,
      beginX: 0,
      beginY: 0,
      lastX: 0,
      lastY: 0,
      collaspe: null,

      colors: ['red', 'coral', 'orange', 'green', 'blue', 'sky', 'dark', 'white'],
      dictionaries: [
        {
          name: 'Merriam Webster Dictionary',
          url: 'https://www.merriam-webster.com/dictionary/'
        }
      ],
    };
  },

  mounted() {
    new ResizeObserver(this.updateSize).observe(this.$refs.widget);
    this.updateSize();

    document.addEventListener('mousemove', this.mouseMove);
    document.addEventListener('mouseup', this.mouseUp);
  },

  methods: {
    mouseDownWord(e) {
      document.title = 'Danmaku-dragging';
      this.beginX = this.lastX = e.screenX;
      this.beginY = this.lastY = e.screenY;
    },
    mouseMove(e) {
      if (document.title === 'Danmaku-dragging') {
        const dx = e.screenX - this.lastX;
        const dy = e.screenY - this.lastY;
        ipcRenderer.sendSync('moveWin', dx, dy);
        this.lastX = e.screenX;
        this.lastY = e.screenY;
      }
    },
    mouseUp(e) {
      if (document.title === 'Danmaku-dragging') {
        const d = Math.abs(e.screenX - this.beginX) + Math.abs(e.screenY - this.beginY)
        if (d < 5) {
          this.clickWord(e)
        }
        document.title = this.activated ? 'Danmaku-activated' : 'Danmaku';
      }
    },

    clickWord() {
      this.activated = !this.activated;
    },

    clickClear() {
    },

    pronounce(e) {
      const c = this.word[0].toUpperCase();
      new Audio(`../assets/audio/${c}/${this.word}.mp3`).play();
    },

    clickDictionary(e) {
      const dict = this.dictionaries[e.target.getAttribute('index')]
      shell.openExternal(dict.url + this.word);
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
  position: absolute;
}

.danmaku .word {
  /* -webkit-app-region: drag; */
  user-select: none;
  border-radius: 10px;
  padding: 8px;
  opacity: 0.5;
  transition-duration: 0.3s;
}

.danmaku .word[activated] {
  opacity: 1;
}

.danmaku .word:hover {
  opacity: 1;
}

.danmaku .card {
  border-radius: 10px;
}

.pronounce {
  color: #6c757d;
}

.pronounce:hover {
  color: #212529;
}

label.radio {
  height: 17px;
  width: 17px;
  border-radius: 3px;
}

input.radio:checked + label.radio {
  border-style: solid;
  border-width: 2px;
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
