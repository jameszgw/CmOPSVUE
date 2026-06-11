<template>
  <el-dialog
    :model-value="open"
    width="90vw"
    top="24px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
    @opened="handleOpened"
  >
    <template #header>
      <el-space>
        <span>主机终端</span>
        <span style="font-size: 12px">
          {{ (modalHost?.username || "") + "@" + (modalHost?.serverAddr || "") }}
        </span>
        <el-tag v-if="connStatus === TERMINAL_STATUS.DISCONNECTED.value" type="warning">已断开</el-tag>
        <el-tag v-if="connStatus === TERMINAL_STATUS.CONNECTED.value" type="success">已连接</el-tag>
        <el-tag v-if="connStatus === TERMINAL_STATUS.ERROR.value" type="danger">连接错误</el-tag>
        <el-button size="small" @click="reconnect">重连</el-button>
        <el-button size="small" :icon="Setting" @click="settingsVisible = true">设置</el-button>
      </el-space>
    </template>

    <div
      class="terminal-body"
      :style="{ background: terminalConfig?.backgroundColor || defaultOptions.theme.background }"
      @contextmenu.prevent="handleRightClick"
    >
      <div ref="terminalRef" class="terminal" />
      <div
        v-if="visibleRightMenu"
        class="right-menu"
        :style="{ top: rightMenuPosition.y + 'px', left: rightMenuPosition.x + 'px' }"
        @click.stop
      >
        <div class="right-menu-item" @click="handleMenuClick('selectAll')">全选</div>
        <div
          class="right-menu-item"
          :class="{ disabled: !clipboardContent }"
          @click="handleMenuClick('copy')"
        >
          复制
        </div>
        <div
          class="right-menu-item"
          :class="{ disabled: !clipboardContent }"
          @click="handleMenuClick('paste')"
        >
          粘贴
        </div>
        <div class="right-menu-item" @click="handleMenuClick('clear')">清除</div>
        <div class="right-menu-item" @click="handleMenuClick('toTop')">到顶部</div>
        <div class="right-menu-item" @click="handleMenuClick('toBottom')">到底部</div>
        <div class="right-menu-item" @click="handleMenuClick('openSearch')">搜索</div>
      </div>
    </div>

    <!-- 终端设置 -->
    <el-dialog v-model="settingsVisible" title="终端设置" width="480px" append-to-body>
      <el-form :model="settingsForm" label-position="top">
        <el-form-item label="终端类型">
          <el-select v-model="settingsForm.terminalType" style="width: 100%">
            <el-option v-for="item in supportPty" :key="item" :value="item" :label="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="字体大小" required>
          <el-input-number v-model="settingsForm.fontSize" :min="10" :max="50" />
        </el-form-item>
        <el-form-item label="字体" required>
          <el-input v-model="settingsForm.fontFamily" />
        </el-form-item>
        <el-form-item label="字体颜色" required>
          <el-color-picker v-model="settingsForm.fontColor" />
        </el-form-item>
        <el-form-item label="背景颜色" required>
          <el-color-picker v-model="settingsForm.backgroundColor" />
        </el-form-item>
        <el-form-item label="启用网页链接">
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

<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from "vue";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "xterm-addon-fit";
import { SearchAddon } from "xterm-addon-search";
import { WebLinksAddon } from "xterm-addon-web-links";
import { debounce } from "lodash";
import { Setting } from "@element-plus/icons-vue";
import {
  getConfig,
  updateConfig,
  getTerminalAccessToken,
  getSupportedPty,
} from "@/api/host";

const TERMINAL_STATUS = {
  NOT_CONNECT: { value: 0, label: "未连接", color: "#FFD43B" },
  CONNECTED: { value: 20, label: "已连接", color: "#4DABF7" },
  DISCONNECTED: { value: 30, label: "已断开", color: "#ADB5BD" },
  ERROR: { value: 40, label: "错误", color: "#E03131" },
};

const TERMINAL_CLIENT_OPERATOR = {
  KEY: { value: "0" },
  CONNECT: { value: "1" },
  PING: { value: "2" },
  PONG: { value: "3" },
  RESIZE: { value: "4" },
  COMMAND: { value: "5" },
  CLEAR: { value: "6" },
};

const defaultOptions = {
  cursorStyle: "bar",
  cursorBlink: true,
  fastScrollModifier: "shift",
  fontSize: 14,
  fontFamily: "courier-new, courier, monospace",
  theme: {
    foreground: "#FFFFFF",
    background: "#212529",
  },
};

const props = defineProps({
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
});

const emit = defineEmits(["close"]);

const terminalRef = ref(null);
const connStatus = ref(TERMINAL_STATUS.NOT_CONNECT.value);
const accessConfig = ref(null);
const terminalConfig = ref(null);
const supportPty = ref([]);
const visibleRightMenu = ref(false);
const rightMenuPosition = reactive({ x: 0, y: 0 });
const clipboardContent = ref("");
const settingsVisible = ref(false);
const settingsForm = reactive({
  terminalType: undefined,
  fontSize: 14,
  fontFamily: defaultOptions.fontFamily,
  fontColor: "#FFFFFF",
  backgroundColor: "#212529",
  enableWebLink: 0,
});

let term = null;
let socket = null;
let pingTimer = null;
let resizeHandler = null;
const fitAddon = new FitAddon();
const searchAddon = new SearchAddon();

const refreshConfig = async () => {
  if (!props.modalHost?.hostId) {
    return;
  }
  const res = await getConfig({ hostId: props.modalHost.hostId });
  terminalConfig.value = res.content;
  Object.assign(settingsForm, {
    terminalType: res.content?.terminalType,
    fontSize: res.content?.fontSize || 14,
    fontFamily: res.content?.fontFamily || defaultOptions.fontFamily,
    fontColor: res.content?.fontColor || "#FFFFFF",
    backgroundColor: res.content?.backgroundColor || "#212529",
    enableWebLink: res.content?.enableWebLink || 0,
  });
};

const handleSettingsSubmit = async () => {
  await updateConfig({
    hostId: props.modalHost?.hostId,
    terminalType: settingsForm.terminalType,
    backgroundColor: settingsForm.backgroundColor,
    fontColor: settingsForm.fontColor,
    fontSize: settingsForm.fontSize,
    fontFamily: settingsForm.fontFamily,
    enableWebLink: settingsForm.enableWebLink,
  });
  await refreshConfig();
  settingsVisible.value = false;
};

const disposeTerminal = () => {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }
  if (socket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    socket.close();
    socket = null;
  }
  if (term) {
    term.dispose();
    term = null;
  }
};

const initTerminal = () => {
  disposeTerminal();
  if (!accessConfig.value?.accessToken || !terminalRef.value) {
    return;
  }

  term = new Terminal({
    ...defaultOptions,
    theme: {
      foreground: terminalConfig.value?.fontColor || defaultOptions.theme.foreground,
      background: terminalConfig.value?.backgroundColor || defaultOptions.theme.background,
    },
    fontFamily: terminalConfig.value?.fontFamily || defaultOptions.fontFamily,
    fontSize: terminalConfig.value?.fontSize || defaultOptions.fontSize,
  });

  if (terminalConfig.value?.enableWebLink) {
    term.loadAddon(new WebLinksAddon());
  }
  term.loadAddon(fitAddon);
  term.loadAddon(searchAddon);

  term.open(terminalRef.value);
  fitAddon.fit();

  const fullUrl = `${props.wsUrl}${accessConfig.value.accessToken}`;
  socket = new WebSocket(fullUrl);

  socket.onopen = () => {
    const body = `${TERMINAL_CLIENT_OPERATOR.CONNECT.value}|${term.cols}|${term.rows}|${accessConfig.value.terminalToken}`;
    socket.send(body);
  };

  socket.onmessage = (event) => {
    const msg = event.data;
    const code = msg.substring(0, 1);
    switch (code) {
      case "0":
        term.write(msg.substring(2, msg.length));
        break;
      case "1":
        connStatus.value = TERMINAL_STATUS.CONNECTED.value;
        if (pingTimer) {
          clearInterval(pingTimer);
        }
        pingTimer = setInterval(() => {
          socket && socket.send(TERMINAL_CLIENT_OPERATOR.PING.value);
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
    term && term.write("\r\n\x1b[91mfailed to establish connection\x1b[0m");
    connStatus.value = TERMINAL_STATUS.ERROR.value;
  };

  socket.onclose = (event) => {
    if (term) {
      term.write(`\r\n\x1b[91m${event.reason || ""}\x1b[0m`);
      term.options.cursorBlink = false;
    }
    connStatus.value = TERMINAL_STATUS.DISCONNECTED.value;
  };

  term.onResize((size) => {
    if (connStatus.value !== TERMINAL_STATUS.CONNECTED.value || !socket) {
      return;
    }
    socket.send(`${TERMINAL_CLIENT_OPERATOR.RESIZE.value}|${size.cols}|${size.rows}`);
  });

  term.onData((data) => {
    if (socket) {
      socket.send(`${TERMINAL_CLIENT_OPERATOR.KEY.value}|${data}`);
    }
  });

  resizeHandler = debounce(() => {
    if (!term) {
      return;
    }
    fitAddon.fit();
    if (socket && connStatus.value === TERMINAL_STATUS.CONNECTED.value) {
      socket.send(`${TERMINAL_CLIENT_OPERATOR.RESIZE.value}|${term.cols}|${term.rows}`);
    }
  }, 100);
  window.addEventListener("resize", resizeHandler);

  // 注册自定义快捷键
  term.attachCustomKeyEventHandler((event) => {
    if (event.key === "c" && event.ctrlKey && event.shiftKey && event.type === "keydown") {
      if (term.hasSelection()) {
        clipboardContent.value = term.getSelection();
      }
      return false;
    }
    if (event.key === "v" && event.ctrlKey && event.shiftKey && event.type === "keydown") {
      navigator.clipboard.readText().then((clipboardText) => {
        term && term.write(clipboardText);
      });
      return false;
    }
    if (event.key === "f" && event.ctrlKey && event.shiftKey && event.type === "keydown") {
      const searchTerm = prompt("Enter the text to search:");
      if (searchTerm) {
        searchAddon.findNext(searchTerm);
      }
      return false;
    }
    return true;
  });
};

const connectHost = async () => {
  if (!props.modalHost?.hostId) {
    return;
  }
  await refreshConfig();
  const res = await getTerminalAccessToken({ hostId: props.modalHost.hostId });
  accessConfig.value = res.content;
  initTerminal();
};

const handleOpened = () => {
  connectHost();
};

const handleClose = () => {
  disposeTerminal();
  connStatus.value = TERMINAL_STATUS.NOT_CONNECT.value;
  accessConfig.value = null;
  emit("close");
};

const reconnect = () => {
  connStatus.value = TERMINAL_STATUS.NOT_CONNECT.value;
  connectHost();
};

const handleRightClick = (event) => {
  rightMenuPosition.x = event.offsetX;
  rightMenuPosition.y = event.offsetY;
  visibleRightMenu.value = true;
  navigator.clipboard
    .readText()
    .then((clipText) => {
      clipboardContent.value = clipText;
    })
    .catch(() => {});
};

const handleMenuClick = (key) => {
  visibleRightMenu.value = false;
  if (!term) {
    return;
  }
  switch (key) {
    case "selectAll":
      term.selectAll();
      term.focus();
      break;
    case "copy":
      if (clipboardContent.value) {
        navigator.clipboard.writeText(term.getSelection());
      }
      term.focus();
      break;
    case "paste":
      if (clipboardContent.value) {
        term.paste(clipboardContent.value);
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
      searchAddon.findNext("");
      term.focus();
      break;
    default:
      break;
  }
};

const handleGlobalClick = () => {
  visibleRightMenu.value = false;
};

watch(
  () => props.open,
  (val) => {
    if (!val) {
      disposeTerminal();
    }
  }
);

onMounted(async () => {
  document.addEventListener("click", handleGlobalClick);
  try {
    const res = await getSupportedPty();
    supportPty.value = res.content || [];
  } catch (e) {
    // ignore
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleGlobalClick);
  disposeTerminal();
});
</script>

<style lang="less" scoped>
@defaultBackgroundColor: #212529;
@menuBackgroundColor: #ffffff;
@menuBorderColor: #cccccc;
@menuHoverBackgroundColor: #007bff;
@menuHoverTextColor: #ffffff;

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
  position: absolute;
  background: @menuBackgroundColor; // 白色背景
  border: 1px solid @menuBorderColor; // 边框颜色
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); // 阴影效果
  border-radius: 4px;
  z-index: 1000; // 确保菜单显示在前面
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
