<template>
  <v-container class="pa-0">
    <v-list subheader two-line dense class="compensate-bar transparent">
      <v-subheader>General</v-subheader>
      <v-list-tile @click>
        <v-list-tile-content @click.prevent="portforwardWithoutPrompt = !portforwardWithoutPrompt">
          <v-list-tile-title>Port-Forward without prompt</v-list-tile-title>
          <v-list-tile-sub-title>
            <template v-if="portforwardWithoutPrompt">Will directly pump up the terminal.</template>
            <template v-else>Will prompt for port input</template>
          </v-list-tile-sub-title>
        </v-list-tile-content>
        <v-list-tile-action>
          <v-checkbox class="no-grow" v-model="portforwardWithoutPrompt"></v-checkbox>
        </v-list-tile-action>
      </v-list-tile>

      <v-list-tile @click>
        <v-list-tile-content @click.prevent="clearRecentHistory">
          <v-list-tile-title>Clear recent history</v-list-tile-title>
          <v-list-tile-sub-title>Remove all items from recent tab</v-list-tile-sub-title>
        </v-list-tile-content>
      </v-list-tile>

      <!-- <v-list-tile @click>
        <v-list-tile-content @click.prevent="$store.dispatch('pushRecentHistory', {type: 'command', context: 'test', namespace: 'test'})">
          <v-list-tile-title>Push recent history</v-list-tile-title>
          <v-list-tile-sub-title></v-list-tile-sub-title>
        </v-list-tile-content>
      </v-list-tile>-->
      <!-- <v-list-tile @click>
        <v-list-tile-content @click.prevent="$store.dispatch('replayRecentHistory', $store.state.Global.recentHistory[0])">
          <v-list-tile-title>Replay first in recent history</v-list-tile-title>
          <v-list-tile-sub-title></v-list-tile-sub-title>
        </v-list-tile-content>
      </v-list-tile>-->
    </v-list>
  </v-container>
</template>

<script>
import { mapComputed } from "../../store";

export default {
  name: "settings",
  computed: {
    ...mapComputed("portforwardWithoutPrompt", "Settings"),
    ...mapComputed("recentHistory")
  },
  methods: {
    clearRecentHistory() {
      this.recentHistory = [];
    }
  }
};
</script>

<style lang="scss" scoped>
.compensate-bar {
  margin-bottom: 56px;
}
.no-grow {
  flex-grow: 0;
}
</style>
