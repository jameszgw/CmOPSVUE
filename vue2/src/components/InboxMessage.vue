<template>
  <div class="inbox-message">
    <div class="inbox-trigger" @click="openDrawer">
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="inbox-badge">
        <i class="el-icon-message inbox-icon"></i>
      </el-badge>
    </div>

    <el-drawer
      :visible.sync="drawerVisible"
      direction="rtl"
      size="400px"
      :with-header="true"
    >
      <div slot="title" class="drawer-title">站内信</div>
      <div class="message-list-wrapper">
        <div class="message-toolbar">
          <el-button type="text" icon="el-icon-view" @click="handleMarkAllAsRead">
            标记所有为已读
          </el-button>
          <el-button type="text" icon="el-icon-delete" @click="handleDeleteAllRead">
            删除全部已读
          </el-button>
        </div>

        <div v-if="webSideMessages.length === 0" class="empty-text">暂无消息</div>

        <div
          v-for="msg in webSideMessages"
          :key="msg.id"
          class="message-item"
          :class="{ unread: msg.readStatus === 0 }"
        >
          <div class="message-main">
            <div class="message-content" v-html="msg.sendMessage"></div>
            <div class="message-time">{{ formatTime(msg.gmtCreateTime) }}</div>
          </div>
          <div class="message-actions">
            <el-button type="text" size="mini" @click.stop="handleMarkAsRead(msg.id)">
              已读
            </el-button>
            <el-button
              type="text"
              size="mini"
              class="danger-text"
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

<script>
import dayjs from "dayjs";
import {
  getUnreadCount,
  setAllRead,
  read,
  deleteAllRead,
  deleteMessage,
  fetchMessages,
} from "@/api/webside-message";

export default {
  name: "InboxMessage",
  data() {
    return {
      unreadCount: 0,
      maxId: 0,
      webSideMessages: [],
      drawerVisible: false,
    };
  },
  created() {
    this.loadUnreadCount();
    this.loadMessages();
  },
  methods: {
    formatTime(time) {
      return time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "";
    },
    openDrawer() {
      this.drawerVisible = true;
    },
    async loadUnreadCount() {
      const res = await getUnreadCount();
      this.unreadCount = res.content || 0;
    },
    async loadMessages() {
      const res = await fetchMessages({
        maxId: this.maxId,
        pageNo: 1,
        pageSize: 20,
        readStatus: 1,
      });
      const messages = res.content && res.content.items;
      this.webSideMessages = Array.isArray(messages) ? messages : [];
    },
    async handleMarkAllAsRead() {
      await setAllRead();
      this.loadUnreadCount();
      this.loadMessages();
      this.$message.success("全部标记为已读");
    },
    async handleDeleteAllRead() {
      await deleteAllRead();
      this.loadMessages();
      this.$message.success("删除全部已读站内信");
    },
    async handleMarkAsRead(messageId) {
      await read({ messageIdList: [messageId] });
      this.loadUnreadCount();
      this.loadMessages();
      this.$message.success("标记为已读");
    },
    async handleDeleteById(messageId) {
      await deleteMessage({ messageIdList: [messageId] });
      this.loadUnreadCount();
      this.loadMessages();
      this.$message.success("删除成功");
    },
  },
};
</script>

<style lang="less" scoped>
.inbox-message {
  display: inline-block;
}

.inbox-trigger {
  cursor: pointer;
  padding: 4px;

  .inbox-icon {
    font-size: 20px;
    color: rgba(0, 0, 0, 0.65);
  }
}

.drawer-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.message-list-wrapper {
  .message-toolbar {
    padding: 8px 24px 16px;
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
    padding: 12px 24px;
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

      .el-button {
        padding: 0 4px;
        height: 24px;
        font-size: 12px;
      }

      .danger-text {
        color: #f56c6c;
      }
    }
  }
}
</style>
