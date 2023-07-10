import { getServerConfig, getRTCConfiguration } from "../../js/config.js";
import { createDisplayStringArray } from "../../js/stats.js";
import { VideoPlayer } from "./video-player.js";
import { RenderStreaming } from "../../module/renderstreaming.js";
import { Signaling, WebSocketSignaling } from "../../module/signaling.js";
import { registerGamepadEvents, registerKeyboardEvents, registerMouseEvents, sendClickEvent, sendMessage } from "./register-events.js";

/** @type {Element} */
let playButton;
/** @type {RenderStreaming} */
let renderstreaming;
/** @type {boolean} */
let useWebSocket;

const playerDiv = document.getElementById('player');
let videoPlayer;


setup();



window.document.oncontextmenu = function () {
  return false;     // cancel default menu
};

window.addEventListener('resize', function () {
  videoPlayer.resizeVideo();
}, true);

window.addEventListener('beforeunload', async () => {
  if (!renderstreaming)
    return;
  await renderstreaming.stop();
}, true);

const sliderEl = document.querySelector("#WallWidth")
const sliderValue = document.querySelector(".value2")

sliderEl.addEventListener("input", (event) => {
  const tempSliderValue = event.target.value;
  sliderValue.textContent = tempSliderValue;

  //const progress = (tempSliderValue / sliderEl.max) * 100;
})


async function setup() {
  const res = await getServerConfig();
  useWebSocket = res.useWebSocket;
  showWarningIfNeeded(res.startupMode);
  showPlayButton();
}

function showWarningIfNeeded(startupMode) {
  const warningDiv = document.getElementById("warning");
  if (startupMode == "private") {
    warningDiv.innerHTML = "<h4>Warning</h4> This sample is not working on Private Mode.";
    warningDiv.hidden = false;
  }
}

function showPlayButton() {
  if (!document.getElementById('playButton')) {
    const elementPlayButton = document.createElement('img');
    elementPlayButton.id = 'playButton';
    elementPlayButton.src = '../../images/Play.png';
    elementPlayButton.alt = 'Start Streaming';
    playButton = document.getElementById('player').appendChild(elementPlayButton);
    playButton.addEventListener('click', onClickPlayButton);
  }
}

function onClickPlayButton() {
  playButton.style.display = 'none';

  const playerDiv = document.getElementById('player');

  // add video player
  const elementVideo = document.createElement('video');
  elementVideo.id = 'Video';
  elementVideo.style.touchAction = 'none';
  playerDiv.appendChild(elementVideo);


  setupVideoPlayer([elementVideo]).then(value => videoPlayer = value);

  const WallWidth = document.getElementById("WallWidth");
  const Depth = document.getElementById("Depth");
  const Glasses = document.getElementById("Glasses");
  const RoomGlasses = document.getElementById("RoomGlasses");

  WallWidth.addEventListener("change", function () {
    let lol = [];
    lol[0] = WallWidth.value;
    lol[1] = Depth.value;
    lol[2] = Glasses.value;
    lol[3] = RoomGlasses.value;
    sendMessage(videoPlayer, lol);
  });

  Depth.addEventListener("change", function () {
    let lol = [];
    lol[0] = WallWidth.value;
    lol[1] = Depth.value;
    lol[2] = Glasses.value;
    lol[3] = RoomGlasses.value;
    sendMessage(videoPlayer, lol);
  });

  Glasses.addEventListener("change", function () {
    let lol = [];
    lol[0] = WallWidth.value;
    lol[1] = Depth.value;
    lol[2] = Glasses.value;
    lol[3] = RoomGlasses.value;
    sendMessage(videoPlayer, lol);
  });
  RoomGlasses.addEventListener("change", function () {
    let lol = [];
    lol[0] = WallWidth.value;
    lol[1] = Depth.value;
    lol[2] = Glasses.value;
    lol[3] = RoomGlasses.value;
    sendMessage(videoPlayer, lol);
  });

  // add blue button
  const elementBlueButton = document.createElement('button');
  elementBlueButton.id = "blueButton";
  elementBlueButton.innerHTML = "Light on";
  playerDiv.appendChild(elementBlueButton);
  elementBlueButton.addEventListener("click", function () {
    sendClickEvent(videoPlayer, 1);
  });

  // add green button
  const elementGreenButton = document.createElement('button');
  elementGreenButton.id = "greenButton";
  elementGreenButton.innerHTML = "Light off";
  playerDiv.appendChild(elementGreenButton);
  elementGreenButton.addEventListener("click", function () {
    sendMessage(videoPlayer);
  });

  // add orange button
  const elementOrangeButton = document.createElement('button');
  elementOrangeButton.id = "orangeButton";
  elementOrangeButton.innerHTML = "Play audio";
  playerDiv.appendChild(elementOrangeButton);
  elementOrangeButton.addEventListener("click", function () {
    sendClickEvent(videoPlayer, 3);
  });
}

async function setupVideoPlayer(elements) {
  const videoPlayer = new VideoPlayer(elements);
  await videoPlayer.setupConnection(useWebSocket);

  videoPlayer.ondisconnect = onDisconnect;
  registerGamepadEvents(videoPlayer);
  registerKeyboardEvents(videoPlayer);
  registerMouseEvents(videoPlayer, elements[0]);

  return videoPlayer;
}

async function setupRenderStreaming() {
  codecPreferences.disabled = true;

  const signaling = useWebSocket ? new WebSocketSignaling() : new Signaling();
  const config = getRTCConfiguration();
  renderstreaming = new RenderStreaming(signaling, config);
  renderstreaming.onConnect = onConnect;
  renderstreaming.onDisconnect = onDisconnect;
  renderstreaming.onTrackEvent = (data) => videoPlayer.addTrack(data.track);
  renderstreaming.onGotOffer = setCodecPreferences;

  await renderstreaming.start();
  await renderstreaming.createConnection();
}

function onConnect() {
  const channel = renderstreaming.createDataChannel("input");
  videoPlayer.setupInput(channel);
  showStatsMessage();
}

async function onDisconnect() {
  const playerDiv = document.getElementById('player');
  clearChildren(playerDiv);
  videoPlayer.stop();
  videoPlayer = null;
  showPlayButton();
}
function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}


/** @type {RTCStatsReport} */
let lastStats;
/** @type {number} */
let intervalId;

function showStatsMessage() {
  intervalId = setInterval(async () => {
    if (renderstreaming == null) {
      return;
    }

    const stats = await renderstreaming.getStats();
    if (stats == null) {
      return;
    }

    const array = createDisplayStringArray(stats, lastStats);
    if (array.length) {
      messageDiv.style.display = 'block';
      messageDiv.innerHTML = array.join('<br>');
    }
    lastStats = stats;
  }, 1000);
}

function clearStatsMessage() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  lastStats = null;
  intervalId = null;
  messageDiv.style.display = 'none';
  messageDiv.innerHTML = '';
}

