<template>
  <div class="inbox-message">
    <div class="inbox-trigger" @click="drawerVisible = true">
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
        <el-icon :size="20" color="rgba(0, 0, 0, 0.65)"><Message /></el-icon>
      </el-badge>
    </div>

    <el-drawer
      v-model="drawerVisible"
      title="站内信"
      direction="rtl"
      size="400px"
      class="inbox-drawer"
    >
      <div class="message-list-wrapper">
        <div class="message-list-header">
          <el-button text @click="handleMarkAllAsRead">
            <el-icon style="margin-right: 4px"><View /></el-icon>
            标记所有为已读
          </el-button>
          <el-button text @click="handleDeleteAllRead">
            <el-icon style="margin-right: 4px"><Delete /></el-icon>
            删除全部已读
          </el-button>
        </div>

        <div v-if="webSideMessages.length === 0" class="empty-text">
          暂无消息
        </div>

        <div
          v-for="msg in webSideMessages"
          :key="msg.id"
          class="message-item"
          :class="{ unread: msg.readStatus === 0 }"
        >
          <div class="message-main">
            <div class="message-content" v-html="msg.sendMessage"></div>
            <div class="message-time">
              {{ formatTime(msg.gmtCreateTime) }}
            </div>
          </div>
          <div class="message-actions">
            <el-button
              text
              size="small"
              @click.stop="handleMarkAsRead(msg.id)"
            >
              已读
            </el-button>
            <el-button
              text
              size="small"
              type="danger"
              @click.stop="handleDeleteById(msg.id)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";
import {
  getUnreadCount,
  fetchMessages,
  setAllRead,
  deleteAllRead,
  read,
  deleteMessage,
} from "@/api/webside-message";

const unreadCount = ref(0);
const maxId = ref(0);
const webSideMessages = ref([]);
const drawerVisible = ref(false);

const formatTime = (time) =>
  time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "";

const loadUnreadCount = async () => {
  const res = await getUnreadCount();
  unreadCount.value = res.content || 0;
};

const loadMessages = async () => {
  const res = await fetchMessages({
    maxId: maxId.value,
    pageNo: 1,
    pageSize: 20,
    readStatus: 1,
  });
  const messages = res.content?.items;
  webSideMessages.value = Array.isArray(messages) ? messages : [];
};

const handleMarkAllAsRead = async () => {
  await setAllRead();
  await Promise.all([loadUnreadCount(), loadMessages()]);
  ElMessage.success("全部标记为已读");
};

const handleDeleteAllRead = async () => {
  await deleteAllRead();
  await loadMessages();
  ElMessage.success("删除全部已读站内信");
};

const handleMarkAsRead = async (messageId) => {
  await read({ messageIdList: [messageId] });
  await Promise.all([loadUnreadCount(), loadMessages()]);
  ElMessage.success("标记为已读");
};

const handleDeleteById = async (messageId) => {
  await deleteMessage({ messageIdList: [messageId] });
  await Promise.all([loadUnreadCount(), loadMessages()]);
  ElMessage.success("删除成功");
};

onMounted(() => {
  loadUnreadCount();
  loadMessages();
});
</script>

<style lang="less" scoped>
.inbox-trigger {
  cursor: pointer;
  padding: 4px;
  display: inline-flex;
  align-items: center;
}

.message-list-wrapper {
  .message-list-header {
    padding: 8px 0 16px;
    border-bottom: 1px solid var(--cm-border-lighter);
    display: flex;
    justify-content: space-between;
  }

  .empty-text {
    padding: 32px 0;
    text-align: center;
    color: #999;
    font-size: 14px;
  }

  .message-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 12px 8px;
    transition: all 0.3s;
    cursor: pointer;
    border-bottom: 1px solid var(--cm-border-lighter);

    &.unread {
      background-color: #f0f7ff;
    }

    .message-main {
      flex: 1;
      min-width: 0;

      .message-content {
        font-size: 13px;
        line-height: 1.4;
        color: #333;
        margin-bottom: 2px;
        word-break: break-all;
      }

      .message-time {
        font-size: 12px;
        color: #999;
        margin-top: 4px;
      }
    }

    .message-actions {
      flex-shrink: 0;
      margin-left: 8px;
      white-space: nowrap;
    }
  }
}
</style>
