<template>
  <div class="connection-info mb-4 p-3 bg-gray-50 rounded-lg">
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span class="font-semibold">连接类型:</span>
        <span :class="getConnectionTypeClass()">{{
          connectionInfo.connectionType
        }}</span>
      </div>
      <div>
        <span class="font-semibold">本地候选:</span>
        <span class="text-gray-600">{{ connectionInfo.localCandidate }}</span>
      </div>
      <div>
        <span class="font-semibold">远程候选:</span>
        <span class="text-gray-600">{{ connectionInfo.remoteCandidate }}</span>
      </div>
      <div>
        <span class="font-semibold">数据传输:</span>
        <span class="text-gray-600">
          ↓{{ formatBytes(connectionInfo.bytesReceived) }} ↑{{
            formatBytes(connectionInfo.bytesSent)
          }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";

interface Props {
  peerConnection?: RTCPeerConnection | null;
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  peerConnection: null
});

const connectionInfo = ref({
  connectionType: "检测中...",
  localCandidate: "",
  remoteCandidate: "",
  bytesReceived: 0,
  bytesSent: 0
});

let statsInterval: number | null = null;

// 格式化字节数
const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 获取连接类型的CSS类
const getConnectionTypeClass = () => {
  const type = connectionInfo.value.connectionType;
  if (type.includes("P2P") || type.includes("host")) {
    return "text-green-600 font-semibold";
  } else if (type.includes("TURN") || type.includes("relay")) {
    return "text-orange-600 font-semibold";
  } else if (type.includes("STUN") || type.includes("srflx")) {
    return "text-blue-600 font-semibold";
  }
  return "text-gray-600";
};

// 开始监控连接统计信息
const startStatsMonitoring = () => {
  if (!props.peerConnection || statsInterval) return;

  console.log("开始监控WebRTC连接统计信息");

  statsInterval = setInterval(async () => {
    try {
      const stats = await props.peerConnection!.getStats();
      let localCandidate = "";
      let remoteCandidate = "";
      let connectionType = "检测中...";
      let bytesReceived = 0;
      let bytesSent = 0;

      stats.forEach(report => {
        // 获取候选者信息
        if (report.type === "candidate-pair" && report.state === "succeeded") {
          const localCandidateId = report.localCandidateId;
          const remoteCandidateId = report.remoteCandidateId;

          // 声明候选者类型变量
          let localCandidateType = "";
          let remoteCandidateType = "";

          // 查找对应的候选者详情
          stats.forEach(candidateReport => {
            if (candidateReport.id === localCandidateId) {
              localCandidate = `${candidateReport.candidateType} (${candidateReport.protocol})`;
              localCandidateType = candidateReport.candidateType;
            }
            if (candidateReport.id === remoteCandidateId) {
              remoteCandidate = `${candidateReport.candidateType} (${candidateReport.protocol})`;
              remoteCandidateType = candidateReport.candidateType;
            }
          });

          // 统一的连接类型判断逻辑
          if (localCandidateType === "host" && remoteCandidateType === "host") {
            connectionType = "P2P 直连 (host-host)";
          } else if (
            localCandidateType === "srflx" ||
            remoteCandidateType === "srflx"
          ) {
            connectionType = "P2P NAT穿透 (STUN)";
          } else if (
            localCandidateType === "relay" ||
            remoteCandidateType === "relay"
          ) {
            connectionType = "TURN 中继";
          } else if (
            localCandidateType === "host" ||
            remoteCandidateType === "host"
          ) {
            connectionType = "P2P 直连";
          } else {
            // 如果无法匹配标准类型，显示详细信息
            connectionType = `${localCandidate} ↔ ${remoteCandidate}`;
          }
        }

        // 获取传输统计信息
        if (report.type === "inbound-rtp" && report.mediaType === "video") {
          bytesReceived += report.bytesReceived || 0;
        }
        if (report.type === "outbound-rtp" && report.mediaType === "video") {
          bytesSent += report.bytesSent || 0;
        }

        // 获取数据通道传输统计信息
        if (report.type === "data-channel") {
          bytesReceived += report.bytesReceived || 0;
          bytesSent += report.bytesSent || 0;
        }
      });

      // 更新连接信息
      connectionInfo.value = {
        connectionType,
        localCandidate,
        remoteCandidate,
        bytesReceived,
        bytesSent
      };
    } catch (error) {
      console.error("获取WebRTC统计信息失败:", error);
    }
  }, 2000); // 每2秒更新一次
};

// 停止监控连接统计信息
const stopStatsMonitoring = () => {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
    console.log("停止监控WebRTC连接统计信息");
  }
};

// 监控显示状态和PeerConnection
watch(
  () => [props.visible, props.peerConnection],
  ([isVisible, pc]) => {
    if (isVisible && pc) {
      // 组件可见且有PeerConnection时开始监控
      setTimeout(() => {
        startStatsMonitoring();
      }, 1000); // 延迟1秒开始监控，确保连接已建立
    } else {
      // 组件不可见时停止监控
      stopStatsMonitoring();
    }
  },
  { immediate: true }
);

// 组件卸载时清理
onUnmounted(() => {
  stopStatsMonitoring();
});
</script>
