<template>
  <div>
    <v-system-bar fixed status color="#424242">
      <span class="caption mdi mdi-ship-wheel"></span>
      <span class="caption ml-1">Context: {{ currentContext }}</span>
      <v-spacer></v-spacer>
    </v-system-bar>
    <v-container grid-list-md class="compensate-bar">
      <v-layout row wrap>
        <v-flex xs12 v-if="!existRecentHistoryInContext" text-xs-center>
          <span class="caption">No recent history available</span>
        </v-flex>
        <v-flex xs12 v-for="(e, i) in recentHistoryInContext" :key="i">
          <v-card class="pa-2 tag" @click="replayRecentHistory(e)">
            <v-chip
              class="caption"
              small
              outline
              color="#b6bc00"
              v-if="e.metadata.action"
            >Action: {{ e.metadata.action }}</v-chip>
            <v-chip
              class="caption"
              small
              outline
              color="#9cbef4"
              v-if="e.metadata && e.metadata.namespace"
            >Namespace: {{ e.metadata.namespace }}</v-chip>
            <v-chip
              class="caption"
              small
              outline
              color="#ffffff"
              v-if="e.metadata && e.metadata.podName"
            >Pod: {{ e.metadata.podName }}</v-chip>
            <v-chip
              class="caption"
              small
              outline
              color="#ffffff"
              v-if="e.metadata && e.metadata.containerName"
            >Container: {{ e.metadata.containerName }}</v-chip>
            <v-chip
              class="caption"
              small
              outline
              color="#ffffff"
              v-if="e.metadata && e.metadata.svcName"
            >Service: {{ e.metadata.svcName }}</v-chip>
            <v-chip
              class="caption"
              small
              outline
              color="#ffffff"
              v-if="e.metadata && e.metadata.localPort && e.metadata.targetPort"
            >Port: localhost:{{ e.metadata.localPort }} -> {{ e.metadata.targetPort }}</v-chip>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import { mapComputed } from "../../store";

export default {
  name: "index",
  computed: {
    ...mapComputed("currentContext"),
    ...mapComputed("recentHistory"),
    recentHistoryInContext: function() {
      return this.recentHistory.filter(e => {
        if (e.metadata && e.metadata.context)
          return e.metadata.context === this.currentContext;
        return false;
      });
    },
    existRecentHistoryInContext: function() {
      return this.recentHistoryInContext.length !== 0;
    }
  },
  methods: {
    replayRecentHistory(x) {
      this.$store.dispatch("replayRecentHistory", x);
    }
  }
};
</script>

<style lang="scss" scoped>
.compensate-bar {
  margin-top: 24px;
  margin-bottom: 56px;
}
.tag {
  cursor: pointer;
  /deep/ .v-chip .v-chip__content {
    cursor: pointer !important;
    font-size: 10px;
  }
}
</style>
