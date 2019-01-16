<template>
  <v-bottom-nav :active.sync="lastPageVisited" :value="true" fixed color="#424242">
    <v-btn color="blue" flat value="home" to="/">
      <span>Recent</span>
      <v-icon>history</v-icon>
    </v-btn>

    <!-- <v-btn color="blue" flat value="links" to="/links">
      <span>Links</span>
      <v-icon>link</v-icon>
    </v-btn> -->

    <v-btn color="blue" flat value="settings" to="/settings">
      <span>Settings</span>
      <v-icon>settings</v-icon>
    </v-btn>
  </v-bottom-nav>
</template>

<script>
import { mapComputed } from "../../store";

export default {
  name: "navbar",
  computed: {
    ...mapComputed("lastPageVisited")
  }
};
</script>

<style lang="scss" scoped>
</style>