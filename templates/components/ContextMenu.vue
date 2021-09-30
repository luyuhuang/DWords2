<template>
  <ul ref="menu" class="no-select dropdown-menu pt-1 pb-1 show shadow" tabindex="0" :style="menuStyle" v-if="show" @blur="focusOut">
    <li v-for="(item, i) in items" :key="i">
      <hr v-if="/^---+/.test(item)" class="m-1">
      <a v-else class="dropdown-item" href="#" @click="clickItem(item)" v-html="item.name"></a>
    </li>
  </ul>

</template>

<script>
export default {
  data() {
    return {
      show: false,
      x: 0,
      y: 0,
      items: [],
    };
  },

  mounted() {
    this.$parent.$on('showContextMenu', this.showContextMenu);
  },

  methods: {
    async showContextMenu(data) {
      this.show = true;
      this.x = data.x;
      this.y = data.y;
      this.items = data.items;

      await this.$nextTick();

      const menu = this.$refs.menu;
      menu.focus();
      if (this.x + menu.clientWidth > window.innerWidth) {
        this.x -= menu.clientWidth;
      }
      if (this.y + menu.clientHeight > window.innerHeight) {
        this.y -= menu.clientHeight;
      }

    },

    focusOut(e) {
      if (!this.$refs.menu.contains(e.relatedTarget)) {
        this.show = false;
      } else {
        this.$refs.menu.focus();
      }
    },

    clickItem(item) {
      item.action();
      this.show = false;
    }
  },

  computed: {
    menuStyle() {
      return {
        '--x': this.x + 'px',
        '--y': this.y + 'px',
      };
    },
  }
};
</script>

<style scoped>
.dropdown-menu {
  font-size: 0.9rem;
  position: fixed;
  left: var(--x);
  top: var(--y);
  z-index: 10;
}
.dropdown-menu:focus {
  outline: none;
}
</style>
