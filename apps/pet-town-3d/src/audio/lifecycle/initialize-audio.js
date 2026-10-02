import { isGameInputCaptured } from "../../core/input-capture.js";
/** Sound dispatch, volume/mute controls, browser unlock, buffer preparation and frame updates. */
import { audioState } from "../state.js";
import { initializeAudioGraph } from "../synthesis/initialize-audio-graph.js";
import { unlockAudio } from "./unlock-audio.js";
import { setAudioMuted } from "./set-audio-muted.js";
import { setAudioVolume } from "./set-audio-volume.js";
import { playSoundEffect } from "./play-sound-effect.js";
export function initializeAudio(context) {
  audioState.audioGameContext = context;
  try {
    initializeAudioGraph();
  } catch {
    audioState.webAudioContext = null;
  }
  let callback = () => {
    if ((unlockAudio(), audioState.webAudioContext?.state === `running`)) {
      for (let result of [`pointerdown`, `keydown`, `touchend`]) {
        removeEventListener(result, callback, true);
      }
    }
  };
  for (let result2 of [`pointerdown`, `keydown`, `touchend`]) {
    addEventListener(result2, callback, true);
  }
  addEventListener(`keydown`, (event) => {
    if (isGameInputCaptured(context, event)) return;
    if (!(
      event.repeat ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName ?? ``)
    )) {
      if (event.code === `KeyM`) {
        setAudioMuted(!audioState.audioRuntime.muted);
        audioState.audioGameContext.hud?.toast?.(
          audioState.audioRuntime.muted ? `Sound off` : `Sound on`,
          {
            icon: audioState.audioRuntime.muted ? `mute` : `sound`,
            color: audioState.audioRuntime.muted ? `#ffd2c8` : `#c9f0dd`,
            sound: !audioState.audioRuntime.muted,
          },
        );
      } else {
        if (event.code === `BracketLeft` || event.code === `BracketRight`) {
          setAudioVolume(
            Math.round(
              (audioState.audioRuntime.volume + (event.code === `BracketRight` ? 0.1 : -0.1)) * 10,
            ) / 10,
          );
          if (audioState.audioRuntime.muted && audioState.audioRuntime.volume > 0) {
            setAudioMuted(false);
          }
          audioState.audioGameContext.hud?.toast?.(
            `Volume ${Math.round(audioState.audioRuntime.volume * 100)}%`,
            {
              icon: `sound`,
              color: `#c9f0dd`,
              duration: 1200,
            },
          );
        }
      }
    }
  });
  document.addEventListener(`visibilitychange`, () => {
    if (audioState.webAudioContext && audioState.audioRuntime.started) {
      if (document.hidden) {
        audioState.webAudioContext.suspend().catch(() => {});
      } else {
        audioState.webAudioContext.resume().catch(() => {});
      }
    }
  });
  context.audio = {
    sfx: playSoundEffect,
    play: playSoundEffect,
    setVolume: setAudioVolume,
    setMuted: setAudioMuted,
    toggleMute: () => {
      setAudioMuted(!audioState.audioRuntime.muted);
      if (audioState.soundEffectHandlers.click) {
        playSoundEffect(`click`);
      }
    },
    setMusic(value) {
      audioState.audioRuntime.music = !!value;
    },
    get volume() {
      return audioState.audioRuntime.volume;
    },
    get muted() {
      return audioState.audioRuntime.muted;
    },
    get unlocked() {
      return !!audioState.webAudioContext && audioState.webAudioContext.state === `running`;
    },
    get ready() {
      return !!audioState.audioRuntime.ready;
    },
    get prepMs() {
      return audioState.audioRuntime.prepMs;
    },
    get context() {
      return audioState.webAudioContext;
    },
    _nodes: audioState.audioNodes,
  };
}
