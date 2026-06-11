<template>
  <div class="host-group-tree">
    <el-input
      v-model="searchValue"
      placeholder="搜索指定机组"
      clearable
      class="search-input"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <el-tree
      ref="treeRef"
      :data="data"
      node-key="hostGroupId"
      :props="treeProps"
      :filter-node-method="filterNode"
      highlight-current
      default-expand-all
      @node-click="handleNodeClick"
    />
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["group-select"]);

const treeRef = ref(null);
const searchValue = ref("");

const treeProps = {
  label: "name",
  children: "children",
};

watch(searchValue, (val) => {
  treeRef.value && treeRef.value.filter(val);
});

const filterNode = (value, node) => {
  if (!value) {
    return true;
  }
  return node.name && node.name.indexOf(value) > -1;
};

const handleNodeClick = (node) => {
  if (node && node.hostGroupId) {
    emit("group-select", node.hostGroupId);
  }
};
</script>

<style lang="less" scoped>
.host-group-tree {
  width: 100%;

  .search-input {
    margin-bottom: 8px;
  }
}
</style>
