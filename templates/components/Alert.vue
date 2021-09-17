<template>
  <div class="modal fade no-select" tabindex="-1" ref="modal">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header" v-if="title">
          <h5 class="modal-title" id="staticBackdropLabel">{{ title }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div v-html="content"></div>
        </div>
        <div class="modal-footer" v-if="buttons.length > 0">
          <button type="button" data-bs-dismiss="modal" class="btn"
            v-for="(btn, i) in buttons" :key="i" :class="btn.class" @click="clickBtn(i)"
          >
            {{ btn.text }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap';

export default {
  data() {
    return {
      title: '',
      content: '',
      buttons: [],
    };
  },

  mounted() {
    this.modal = new Modal(this.$refs.modal, {});
    this.$parent.$on('showAlert', this.showAlert);
  },

  methods: {
    showAlert(title, content, buttons) {
      this.title = title;
      this.content = content;
      this.buttons = buttons;

      this.modal.show();
    },

    clickBtn(i) {
      const onClick = this.buttons[i].onClick;
      if (onClick) {
        onClick();
      }
    }
  }
};
</script>

<style scoped>
.close-modal {
  position: absolute;
  right: 13px;
}
</style>
