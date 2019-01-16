<template>
  <v-app dark>
    <router-view></router-view>
    <template v-if="noNavbar.indexOf($route.name) === -1">
      <navbar/>
    </template>
  </v-app>
</template>

<script>
import Navbar from "./components/common/Navbar";

export default {
  name: "utility",
  components: {
    Navbar
  },
  data: () => ({
    noNavbar: ["prompt"]
  })
};
</script>

<style lang="scss" scoped>
</style>
