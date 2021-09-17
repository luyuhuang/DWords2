<template>
  <div class="d-flex flex-row p-2 bg-light shadow-sm align-items-center no-select" style="-webkit-app-region: drag">
    <a class="btn btn-sm btn-primary ms-2" style="width: 70px; -webkit-app-region: no-drag" href="#/">
      <i class="bi bi-chevron-left me-1"></i>Back
    </a>
    <div class="text-center fs-6 col">{{ title }}</div>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
  },
};
</script>
