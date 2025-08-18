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
      urls: "stun:stun.guxiaotong.cn:5349"
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
