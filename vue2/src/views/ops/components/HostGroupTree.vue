<template>
  <div class="host-group-tree">
    <el-input
      v-model="filterText"
      placeholder="搜索指定机组"
      prefix-icon="el-icon-search"
      clearable
      style="margin-bottom: 8px"
    />
    <el-tree
      ref="tree"
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

<script>
export default {
  name: "HostGroupTree",
  props: {
    data: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      filterText: "",
      treeProps: {
        label: "name",
        children: "children",
      },
    };
  },
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val);
    },
  },
  methods: {
    filterNode(value, node) {
      if (!value) return true;
      return node.name && node.name.indexOf(value) > -1;
    },
    handleNodeClick(node) {
      // 传递选择的分组信息给父组件
      this.$emit("group-select", node.hostGroupId);
    },
  },
};
</script>

<style lang="less" scoped>
.host-group-tree {
  width: 100%;
}
</style>
