<template>
    <div id="widget">
        <div class="inline">
            <div><img src="./assets/logo.svg" width="50" height="50"/></div>
            <div><h1 id="title">DWords</h1></div>
        </div>
    </div>
</template>

<script>
export default {
    name: "home",
    data() {
        return {
        }
    },
    methods: {
    }
}
</script>

<style>
#title {
    font-family: 'Courier New', Courier, monospace;
    font-size: 18;
}
div.inline {
    display: flex;
    flex-direction: row;
    align-items: center;
}
div.inline div {
    margin-right: 6px;
}
</style>
