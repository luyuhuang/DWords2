<template>
  <div ref="menu" class="context-menu no-select" tabindex="0" :style="menuStyle" v-if="show" @blur="focusOut">
    <ul ref="dropdown" class="dropdown-menu pt-1 pb-1 show shadow">
      <li v-for="(item, i) in items" :key="i">
        <hr v-if="/^---+/.test(item)" class="m-1">
        <a v-else class="dropdown-item" href="#" @click="clickItem(item)" v-html="item.name"></a>
      </li>
    </ul>
  </div>

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
      this.$refs.menu.focus();

      const dropdown = this.$refs.dropdown;
      if (this.x + dropdown.clientWidth > window.innerWidth) {
        this.x -= dropdown.clientWidth;
      }
      if (this.y + dropdown.clientHeight > window.innerHeight) {
        this.y -= dropdown.clientHeight;
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
.context-menu {
  position: fixed;
  left: var(--x);
  top: var(--y);
}

.dropdown-menu {
  font-size: 0.9rem;
}
</style>
