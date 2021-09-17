<template>
  <div class="position-fixed m-3 no-select" :class="cls">
    <div ref="toast" class="toast">
      <div class="toast-header" v-if="title || subTitle">
        <strong class="me-auto">{{ title }}</strong>
        <small>{{ subTitle }}</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body" v-if="content" v-html="content"></div>
    </div>
  </div>

</template>

<script>
import { Toast } from 'bootstrap';

export default {
  data() {
    return {
      position: 'T',
      title: '',
      subTitle: '',
      content: '',
    };
  },

  mounted() {
    this.$parent.$on('showToast', this.showToast);
    this.$parent.$on('hideToast', this.hideToast);
  },

  methods: {
    showToast(option = {}) {
      this.position = option.position || 'T';
      this.title = option.title;
      this.subTitle = option.subTitle;
      this.content = option.content;
      delete option.title;
      delete option.subTitle;
      delete option.content;
      this.toast = new Toast(this.$refs.toast, option);
      this.toast.show();
    },

    hideToast() {
      this.toast.hide();
    },
  },

  computed: {
    cls() {
      switch (this.position) {
        case 'T':
          return 'top-0 start-50 translate-middle-x';
        case 'LB':
          return 'bottom-0 start-0';
        case 'RB':
          return 'bottom-0 end-0';
        default:
          return '';
      }
    }
  }
};
</script>
