// 获取本地流
export const getLocalStream = async (audio: boolean, video: boolean) => {
  const localStream = await navigator.mediaDevices.getUserMedia({
    audio,
    video
  });
  return localStream;
};

// RTCPeerConnection

export const createPeerConnection = () => {
  const iceConfiguration = {
    iceServers: [
      {
        urls: "turn:sturnturn.guxiaotong.cn:3478",
        username: "testuser",
        credential: "testpassword"
      }
    ]
  };
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
