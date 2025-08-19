// 获取本地流
export const getLocalStream = async (audio: boolean, video: boolean) => {
  const localStream = await navigator.mediaDevices.getUserMedia({
    audio,
    video
  });
  return localStream;
};

// RTCPeerConnection
export const iceConfiguration = {
  iceServers: [
    {
      urls: "stun:sturnturn.guxiaotong.cn:3478"
    },
    {
      urls: "stuns:sturnturn.guxiaotong.cn:5349"
    },
    {
      urls: "turn:sturnturn.guxiaotong.cn:3478",
      username: "testuser",
      credential: "testpassword"
    },
    {
      urls: "turns:sturnturn.guxiaotong.cn:5349",
      username: "testuser",
      credential: "testpassword"
    }
  ]
};
export const createPeerConnection = () => {
  const pc = new RTCPeerConnection(iceConfiguration);
  return pc;
};

// 将本地流添加到RTCPeerConnection
export const addLocalStreamToPeerConnection = (
  pc: RTCPeerConnection,
  stream: MediaStream
) => {
  stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
  });
};

// 创建offer
export const createOffer = async (pc: RTCPeerConnection) => {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
};

// 创建ansewer
export const createAnswer = async (
  pc: RTCPeerConnection,
  offer: RTCSessionDescriptionInit
) => {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
};

// 创建Channel
export const createChannel = (pc: RTCPeerConnection, channelName: string) => {
  const channel = pc.createDataChannel(channelName);
  return channel;
};

// 测试 TURN/STUN 可用性并打印候选地址
export const testIceServersStatus = (
  iceServers: RTCIceServer[] = iceConfiguration.iceServers,

  timeout = 5000
): Promise<{
  stun: boolean;
  turn: boolean;
  candidates: { candidate: string; type: string }[];
}> => {
  return new Promise(resolve => {
    const pc = new RTCPeerConnection({ iceServers });
    let stunAvailable = false;
    let turnAvailable = false;
    let settled = false;

    const candidates: { candidate: string; type: string }[] = [];

    const finish = () => {
      if (!settled) {
        settled = true;
        pc.close();
        resolve({ stun: stunAvailable, turn: turnAvailable, candidates });
      }
    };

    pc.onicecandidate = event => {
      if (event.candidate) {
        const typeMatch = /typ (\w+)/.exec(event.candidate.candidate);
        const type = typeMatch ? typeMatch[1] : "unknown";
        candidates.push({ candidate: event.candidate.candidate, type });

        if (type === "srflx") stunAvailable = true;
        if (type === "relay") turnAvailable = true;
      }
    };

    // 创建临时 data channel 确保 candidate 会生成
    pc.createDataChannel("test");
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(finish);

    // 超时处理
    setTimeout(finish, timeout);
  });
};

// 测试ICE服务器状态
export const testIceServers = async () => {
  try {
    ElMessage.info("正在测试ICE服务器状态...");
    const status = await testIceServersStatus(iceConfiguration.iceServers);
    console.log("STUN 可用:", status.stun);
    console.log("TURN 可用:", status.turn);
    console.log("候选地址列表:");
    status.candidates.forEach(c => console.log(c.type, c.candidate));

    // 构建表格HTML
    const stunStatus = status.stun
      ? "<span style='color: #67C23A'>✅ 可用</span>"
      : "<span style='color: #F56C6C'>❌ 不可用</span>";
    const turnStatus = status.turn
      ? "<span style='color: #67C23A'>✅ 可用</span>"
      : "<span style='color: #F56C6C'>❌ 不可用</span>";

    // 统计候选地址类型
    const candidateStats = status.candidates.reduce(
      (acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    let candidateRows = "";
    Object.entries(candidateStats).forEach(([type, count]) => {
      const typeDesc =
        {
          host: "本地地址",
          srflx: "STUN反射地址",
          relay: "TURN中继地址",
          prflx: "对等反射地址"
        }[type] || type;
      candidateRows += `
        <tr>
          <td style='padding: 8px; border: 1px solid #ddd;'>${typeDesc}</td>
          <td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>${count}</td>
        </tr>
      `;
    });

    const tableHTML = `
      <div style='font-family: Arial, sans-serif;'>
        <h3 style='margin-bottom: 15px; color: #303133;'>ICE服务器测试结果</h3>
        <table style='width: 100%; border-collapse: collapse; margin-bottom: 15px;'>
          <thead>
            <tr style='background-color: #f5f7fa;'>
              <th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>服务类型</th>
              <th style='padding: 10px; border: 1px solid #ddd; text-align: center;'>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style='padding: 10px; border: 1px solid #ddd;'>STUN服务器</td>
              <td style='padding: 10px; border: 1px solid #ddd; text-align: center;'>${stunStatus}</td>
            </tr>
            <tr>
              <td style='padding: 10px; border: 1px solid #ddd;'>TURN服务器</td>
              <td style='padding: 10px; border: 1px solid #ddd; text-align: center;'>${turnStatus}</td>
            </tr>
          </tbody>
        </table>
        
        <h4 style='margin: 15px 0 10px 0; color: #303133;'>候选地址统计</h4>
        <table style='width: 100%; border-collapse: collapse;'>
          <thead>
            <tr style='background-color: #f5f7fa;'>
              <th style='padding: 8px; border: 1px solid #ddd; text-align: left;'>地址类型</th>
              <th style='padding: 8px; border: 1px solid #ddd; text-align: center;'>数量</th>
            </tr>
          </thead>
          <tbody>
            ${candidateRows}
          </tbody>
        </table>
        
        <p style='margin-top: 15px; font-size: 12px; color: #909399;'>
          总计: ${status.candidates.length} 个候选地址<br>
          详细信息请查看浏览器控制台
        </p>
      </div>
    `;

    // 使用MessageBox显示表格
    ElMessageBox.alert(tableHTML, "测试结果", {
      dangerouslyUseHTMLString: true,
      customClass: "ice-test-result-dialog",
      confirmButtonText: "确定"
    });
  } catch (error) {
    console.error("测试ICE服务器失败:", error);
    ElMessage.error("测试ICE服务器失败，请查看控制台获取详细信息");
  }
};
