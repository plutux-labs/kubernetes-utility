<template>
  <v-dialog :value="true" fullscreen>
    <v-card class>
      <template v-if="type === 'error'">
        <v-card-title class="headline">{{ payload.error_title || 'Error' }}</v-card-title>
        <v-card-text class="expand">
          <pre>{{ payload.error_msg }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue" flat @click="cancel">OK</v-btn>
        </v-card-actions>
      </template>
      <template v-if="type === 'port-forward'">
        <v-card-title class="headline">{{ payload.title || 'Forwarding Port' }}</v-card-title>
        <v-card-text class="expand">
          <v-form ref="form" v-model="validation.valid">
            <v-text-field
              v-model="payload.port"
              type="number"
              :rules="validation.port"
              label="Port"
              @keyup.enter.native="replyPortForward"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue" flat @click="cancel">Cancel</v-btn>
          <v-btn color="blue" flat @click="replyPortForward" :disabled="!validation.valid">OK</v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "prompt",
  data: () => ({
    sessionId: null,
    type: null,
    payload: {},
    validation: {
      valid: false,
      port: [
        input => {
          const num = parseInt(input);
          return (
            (!isNaN(num) && num >= 0 && num <= 65535) ||
            "Port must be in range of 0 to 65535"
          );
        }
      ]
    }
  }),
  created: function() {
    this.$electron.ipcRenderer.once(
      "electron-osx-prompt-settings",
      (_, option) => {
        for (let i in option) {
          this.$set(this, i, option[i]);
        }
      }
    );
  },
  methods: {
    replyPortForward: function() {
      if (this.sessionId) {
        this.$electron.ipcRenderer.sendSync(
          `electron-osx-prompt-return-value-${this.sessionId}`,
          this.payload
        );
      }
    },
    cancel: function() {
      if (this.sessionId) {
        this.$electron.ipcRenderer.sendSync(
          `electron-osx-prompt-return-value-${this.sessionId}`,
          null
        );
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.expand {
  height: 132px;
  padding-top: 0;
  padding-bottom: 0;
  overflow-y: scroll;
}
</style>
