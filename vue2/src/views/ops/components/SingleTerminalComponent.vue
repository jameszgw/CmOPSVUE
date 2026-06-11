<template>
  <el-dialog
    :visible="open"
    width="90vw"
    top="24px"
    :close-on-click-modal="false"
    append-to-body
    @close="handleClose"
    @opened="handleOpened"
  >
    <template #title>
      <span class="terminal-title">
        <span>主机终端</span>
        <span style="font-size: 12px; margin-left: 8px" v-if="modalHost">
          {{ modalHost.username + "@" + modalHost.serverAddr }}
        </span>
        <el-tag v-if="connectionStatus === '已断开'" type="warning" size="small" style="margin-left: 8px">已断开</el-tag>
        <el-tag v-if="connectionStatus === '已连接'" type="success" size="small" style="margin-left: 8px">已连接</el-tag>
        <el-tag v-if="connectionStatus === '错误'" type="danger" size="small" style="margin-left: 8px">连接错误</el-tag>
        <el-button size="mini" style="margin-left: 12px" @click="reconnect">重连</el-button>
        <el-button size="mini" icon="el-icon-setting" @click="settingsVisible = true">设置</el-button>
      </span>
    </template>

    <div
      class="terminal-body"
      :style="{ background: (terminalConfig && terminalConfig.backgroundColor) || '#212529' }"
      @contextmenu.prevent="handleRightClick"
    >
      <div ref="terminal" class="terminal" />
      <div
        v-if="rightMenu.visible"
        class="right-menu"
        :style="{ top: rightMenu.y + 'px', left: rightMenu.x + 'px' }"
        @click.stop
      >
        <div class="right-menu-item" @click="handleMenuClick('selectAll')">全选</div>
        <div :class="['right-menu-item', clipboardContent ? '' : 'disabled']" @click="handleMenuClick('copy')">复制</div>
        <div :class="['right-menu-item', clipboardContent ? '' : 'disabled']" @click="handleMenuClick('paste')">粘贴</div>
        <div class="right-menu-item" @click="handleMenuClick('clear')">清除</div>
        <div class="right-menu-item" @click="handleMenuClick('toTop')">到顶部</div>
        <div class="right-menu-item" @click="handleMenuClick('toBottom')">到底部</div>
        <div class="right-menu-item" @click="handleMenuClick('openSearch')">搜索</div>
      </div>
    </div>

    <!-- 终端设置 -->
    <el-dialog title="终端设置" :visible.sync="settingsVisible" width="480px" append-to-body>
      <el-form ref="settingsForm" :model="settingsForm" label-position="top">
        <el-form-item label="终端类型" prop="terminalType">
          <el-select v-model="settingsForm.terminalType" style="width: 100%">
            <el-option v-for="item in supportPty" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item
          label="字体大小"
          prop="fontSize"
          :rules="[{ required: true, message: '请输入字体大小' }]"
        >
          <el-input v-model.number="settingsForm.fontSize" type="number" :min="10" :max="50" />
        </el-form-item>
        <el-form-item
          label="字体"
          prop="fontFamily"
          :rules="[{ required: true, message: '请输入字体' }]"
        >
          <el-input v-model="settingsForm.fontFamily" />
        </el-form-item>
        <el-form-item label="字体颜色" prop="fontColor">
          <el-color-picker v-model="settingsForm.fontColor" />
        </el-form-item>
        <el-form-item label="背景颜色" prop="backgroundColor">
          <el-color-picker v-model="settingsForm.backgroundColor" />
        </el-form-item>
        <el-form-item label="启用网页链接" prop="enableWebLink">
          <el-switch
            v-model="settingsForm.enableWebLink"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSettingsSubmit">保存</el-button>
          <el-button @click="settingsVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </el-dialog>
</template>

<script>
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "xterm-addon-fit";
import { SearchAddon } from "xterm-addon-search";
import { WebLinksAddon } from "xterm-addon-web-links";
import { debounce } from "lodash";
import {
  getConfig,
  updateConfig,
  getTerminalAccessToken,
  getSupportedPty,
} from "@/api/host";

export const TERMINAL_STATUS = {
  NOT_CONNECT: { value: 0, label: "未连接", color: "#FFD43B" },
  CONNECTED: { value: 20, label: "已连接", color: "#4DABF7" },
  DISCONNECTED: { value: 30, label: "已断开", color: "#ADB5BD" },
  ERROR: { value: 40, label: "错误", color: "#E03131" },
};

export const TERMINAL_CLIENT_OPERATOR = {
  KEY: { value: "0" },
  CONNECT: { value: "1" },
  PING: { value: "2" },
  PONG: { value: "3" },
  RESIZE: { value: "4" },
  COMMAND: { value: "5" },
  CLEAR: { value: "6" },
};

export default {
  name: "SingleTerminalComponent",
  props: {
    wsUrl: {
      type: String,
      required: true,
    },
    modalHost: {
      type: Object,
      default: null,
    },
    open: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      connectionStatus: TERMINAL_STATUS.NOT_CONNECT.label,
      connStatus: TERMINAL_STATUS.NOT_CONNECT.value,
      accessConfig: null,
      terminalConfig: null,
      supportPty: [],
      clipboardContent: "",
      rightMenu: { visible: false, x: 0, y: 0 },
      settingsVisible: false,
      settingsForm: {
        terminalType: "",
        fontSize: 14,
        fontFamily: "courier-new, courier, monospace",
        fontColor: "#FFFFFF",
        backgroundColor: "#212529",
        enableWebLink: 0,
      },
    };
  },
  created() {
    // 非响应式实例属性
    this.term = null;
    this.socket = null;
    this.fitAddon = null;
    this.searchAddon = null;
    this.pingTimer = null;
    this.resizeHandler = null;
  },
  mounted() {
    document.addEventListener("click", this.handleGlobalClick);
  },
  beforeDestroy() {
    document.removeEventListener("click", this.handleGlobalClick);
    this.teardownTerminal();
  },
  methods: {
    handleGlobalClick() {
      this.rightMenu.visible = false;
    },
    handleClose() {
      this.teardownTerminal();
      this.$emit("close");
    },
    async handleOpened() {
      if (!this.modalHost || !this.modalHost.hostId) return;
      try {
        await this.refreshConfig();
        const [tokenRes, ptyRes] = await Promise.all([
          getTerminalAccessToken({ hostId: this.modalHost.hostId }),
          getSupportedPty(),
        ]);
        this.accessConfig = tokenRes.content;
        this.supportPty = ptyRes.content || [];
        this.$nextTick(() => {
          this.initTerminal();
        });
      } catch (e) {
        // 错误已由拦截器提示
      }
    },
    async refreshConfig() {
      const res = await getConfig({ hostId: this.modalHost.hostId });
      this.terminalConfig = res.content || {};
      this.settingsForm = {
        terminalType: this.terminalConfig.terminalType,
        fontSize: this.terminalConfig.fontSize,
        fontFamily: this.terminalConfig.fontFamily,
        fontColor: this.terminalConfig.fontColor || "#FFFFFF",
        backgroundColor: this.terminalConfig.backgroundColor || "#212529",
        enableWebLink: this.terminalConfig.enableWebLink,
      };
    },
    async handleSettingsSubmit() {
      const values = this.settingsForm;
      await updateConfig({
        hostId: this.modalHost.hostId,
        terminalType: values.terminalType,
        backgroundColor: values.backgroundColor,
        fontColor: values.fontColor,
        fontSize: values.fontSize,
        fontFamily: values.fontFamily,
        enableWebLink: values.enableWebLink,
      });
      await this.refreshConfig();
      this.settingsVisible = false;
    },
    initTerminal() {
      if (!this.accessConfig || !this.accessConfig.accessToken) return;
      this.teardownTerminal();

      const config = this.terminalConfig || {};
      const term = new Terminal({
        cursorStyle: "bar",
        cursorBlink: true,
        fastScrollModifier: "shift",
        theme: {
          foreground: config.fontColor || "#FFFFFF",
          background: config.backgroundColor || "#212529",
        },
        fontFamily: config.fontFamily || "courier-new, courier, monospace",
        fontSize: config.fontSize || 14,
      });

      this.fitAddon = new FitAddon();
      this.searchAddon = new SearchAddon();
      if (config.enableWebLink) {
        term.loadAddon(new WebLinksAddon());
      }
      term.loadAddon(this.fitAddon);
      term.loadAddon(this.searchAddon);

      if (this.$refs.terminal) {
        term.open(this.$refs.terminal);
        this.fitAddon.fit();
      }
      this.term = term;

      const fullUrl = `${this.wsUrl}${this.accessConfig.accessToken}`;
      const socket = new WebSocket(fullUrl);
      this.socket = socket;

      socket.onopen = () => {
        const body = `${TERMINAL_CLIENT_OPERATOR.CONNECT.value}|${term.cols}|${term.rows}|${this.accessConfig.terminalToken}`;
        socket.send(body);
      };

      socket.onmessage = (event) => {
        const msg = event.data;
        const code = msg.substring(0, 1);
        const len = msg.length;
        switch (code) {
          case "0":
            term.write(msg.substring(2, len));
            break;
          case "1":
            this.connStatus = TERMINAL_STATUS.CONNECTED.value;
            this.connectionStatus = TERMINAL_STATUS.CONNECTED.label;
            if (this.pingTimer) clearInterval(this.pingTimer);
            this.pingTimer = setInterval(() => {
              socket.send(TERMINAL_CLIENT_OPERATOR.PING.value); // send ping
            }, 15000);
            break;
          case "2":
            socket.send(TERMINAL_CLIENT_OPERATOR.PONG.value);
            break;
          default:
            break;
        }
      };

      socket.onerror = (event) => {
        console.error("WebSocket error observed:", event);
        term.write("\r\n\x1b[91mfailed to establish connection\x1b[0m");
        this.connStatus = TERMINAL_STATUS.ERROR.value;
        this.connectionStatus = TERMINAL_STATUS.ERROR.label;
      };

      socket.onclose = (event) => {
        term.write(`\r\n\x1b[91m${event.reason}\x1b[0m`);
        term.options.cursorBlink = false;
        this.connStatus = TERMINAL_STATUS.DISCONNECTED.value;
        this.connectionStatus = TERMINAL_STATUS.DISCONNECTED.label;
      };

      term.onResize(({ cols, rows }) => {
        if (this.connStatus !== TERMINAL_STATUS.CONNECTED.value) return;
        socket.send(`${TERMINAL_CLIENT_OPERATOR.RESIZE.value}|${cols}|${rows}`);
      });

      term.onData((data) => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(`${TERMINAL_CLIENT_OPERATOR.KEY.value}|${data}`);
        }
      });

      this.resizeHandler = debounce(() => {
        if (this.fitAddon && this.term) {
          this.fitAddon.fit();
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const { cols, rows } = this.term;
            this.socket.send(
              `${TERMINAL_CLIENT_OPERATOR.RESIZE.value}|${cols}|${rows}`
            );
          }
        }
      }, 100);
      window.addEventListener("resize", this.resizeHandler);

      // 注册自定义快捷键
      term.attachCustomKeyEventHandler((event) => {
        if (event.key === "c" && event.ctrlKey && event.shiftKey && event.type === "keydown") {
          if (term.hasSelection()) {
            this.clipboardContent = term.getSelection();
          }
          return false;
        }
        if (event.key === "v" && event.ctrlKey && event.shiftKey && event.type === "keydown") {
          navigator.clipboard.readText().then((clipboardText) => {
            term.write(clipboardText);
          });
          return false;
        }
        if (event.key === "f" && event.ctrlKey && event.shiftKey && event.type === "keydown") {
          const searchTerm = prompt("Enter the text to search:");
          if (searchTerm) {
            this.searchAddon.findNext(searchTerm);
          }
          return false;
        }
        return true;
      });
    },
    teardownTerminal() {
      if (this.pingTimer) {
        clearInterval(this.pingTimer);
        this.pingTimer = null;
      }
      if (this.resizeHandler) {
        window.removeEventListener("resize", this.resizeHandler);
        this.resizeHandler = null;
      }
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      if (this.term) {
        this.term.dispose();
        this.term = null;
      }
    },
    reconnect() {
      if (this.socket) {
        this.socket.close();
      }
      this.connStatus = TERMINAL_STATUS.NOT_CONNECT.value;
      this.connectionStatus = TERMINAL_STATUS.NOT_CONNECT.label;
    },
    handleRightClick(event) {
      this.rightMenu = { visible: true, x: event.clientX, y: event.clientY };
      navigator.clipboard.readText().then((clipText) => {
        this.clipboardContent = clipText;
      });
    },
    handleMenuClick(key) {
      this.rightMenu.visible = false;
      const term = this.term;
      if (!term) return;
      switch (key) {
        case "selectAll":
          term.selectAll();
          term.focus();
          break;
        case "copy":
          if (this.clipboardContent) {
            navigator.clipboard.writeText(term.getSelection());
          }
          term.focus();
          break;
        case "paste":
          if (this.clipboardContent) {
            term.paste(this.clipboardContent);
          }
          term.focus();
          break;
        case "clear":
          term.clear();
          term.focus();
          break;
        case "toTop":
          term.scrollToTop();
          term.focus();
          break;
        case "toBottom":
          term.scrollToBottom();
          term.focus();
          break;
        case "openSearch":
          this.searchAddon.findNext("");
          term.focus();
          break;
        default:
          break;
      }
    },
  },
};
</script>

<style lang="less" scoped>
@defaultBackgroundColor: #212529;
@menuBackgroundColor: #ffffff;
@menuBorderColor: #cccccc;
@menuHoverBackgroundColor: #007bff;
@menuHoverTextColor: #ffffff;

.terminal-title {
  display: inline-flex;
  align-items: center;
}

.terminal-body {
  position: relative;
  height: 70vh;
  background: @defaultBackgroundColor;
}

.terminal {
  height: 100%;
  width: 100%;
}

.right-menu {
  position: fixed;
  background: @menuBackgroundColor; // 白色背景
  border: 1px solid @menuBorderColor; // 边框颜色
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); // 阴影效果
  border-radius: 4px;
  z-index: 3000; // 确保菜单显示在前面
  min-width: 150px; // 最小宽度
  .right-menu-item {
    padding: 10px 20px;
    cursor: pointer;
    transition: background 0.3s, color 0.3s; // 平滑过渡效果
    font-family: Arial, sans-serif; // 使用易读的字体
    font-size: 14px;
    color: #333;

    &:hover {
      background: @menuHoverBackgroundColor; // 悬停背景颜色
      color: @menuHoverTextColor; // 悬停字体颜色
    }

    &.disabled {
      color: #aaa;
      cursor: not-allowed;
    }
  }
}
</style>
