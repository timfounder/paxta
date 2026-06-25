import type { ChangeEvent } from 'react';

import { Screen, useUiStore } from '@state/uiStore';
import { useSettingsStore } from '@state/settingsStore';
import { AudioChannel } from '@systems/audio/audio.types';

import { Button } from '../components/Button';

const VOLUME_CHANNELS: ReadonlyArray<{ channel: AudioChannel; label: string }> = [
  { channel: AudioChannel.Master, label: 'Master' },
  { channel: AudioChannel.Music, label: 'Music' },
  { channel: AudioChannel.Sfx, label: 'Effects' },
  { channel: AudioChannel.Ambience, label: 'Ambience' },
];

/** Audio, controls, haptics and accessibility preferences. */
export const SettingsScreen = (): React.JSX.Element => {
  const volumes = useSettingsStore((state) => state.volumes);
  const muted = useSettingsStore((state) => state.muted);
  const haptics = useSettingsStore((state) => state.hapticsEnabled);
  const lookSensitivity = useSettingsStore((state) => state.lookSensitivity);
  const invertLook = useSettingsStore((state) => state.invertLook);
  const headBob = useSettingsStore((state) => state.headBob);
  const setVolume = useSettingsStore((state) => state.setVolume);
  const toggleMuted = useSettingsStore((state) => state.toggleMuted);
  const setHaptics = useSettingsStore((state) => state.setHaptics);
  const setLookSensitivity = useSettingsStore((state) => state.setLookSensitivity);
  const setInvertLook = useSettingsStore((state) => state.setInvertLook);
  const setHeadBob = useSettingsStore((state) => state.setHeadBob);

  const onVolumeChange =
    (channel: AudioChannel) =>
    (event: ChangeEvent<HTMLInputElement>): void => {
      setVolume(channel, Number(event.target.value) / 100);
    };

  return (
    <div className="screen">
      <h2 className="title" style={{ fontSize: '1.6rem', letterSpacing: '0.25em' }}>
        Settings
      </h2>

      <div className="settings">
        <div className="field">
          <div className="field__row">
            <label htmlFor="look-sensitivity">Look sensitivity</label>
            <span>{Math.round(lookSensitivity * 100)}%</span>
          </div>
          <input
            id="look-sensitivity"
            type="range"
            min={25}
            max={300}
            step={5}
            value={Math.round(lookSensitivity * 100)}
            onChange={(event) => setLookSensitivity(Number(event.target.value) / 100)}
          />
        </div>

        <div className="field">
          <div className="field__row">
            <label htmlFor="invert-look">Invert look</label>
            <input
              id="invert-look"
              className="switch"
              type="checkbox"
              checked={invertLook}
              onChange={(event) => setInvertLook(event.target.checked)}
            />
          </div>
        </div>

        <div className="field">
          <div className="field__row">
            <label htmlFor="head-bob">Head bob</label>
            <input
              id="head-bob"
              className="switch"
              type="checkbox"
              checked={headBob}
              onChange={(event) => setHeadBob(event.target.checked)}
            />
          </div>
        </div>

        {VOLUME_CHANNELS.map(({ channel, label }) => (
          <div className="field" key={channel}>
            <div className="field__row">
              <label htmlFor={`vol-${channel}`}>{label}</label>
              <span>{Math.round(volumes[channel] * 100)}</span>
            </div>
            <input
              id={`vol-${channel}`}
              type="range"
              min={0}
              max={100}
              value={Math.round(volumes[channel] * 100)}
              onChange={onVolumeChange(channel)}
            />
          </div>
        ))}

        <div className="field">
          <div className="field__row">
            <label htmlFor="muted">Mute all</label>
            <input
              id="muted"
              className="switch"
              type="checkbox"
              checked={muted}
              onChange={toggleMuted}
            />
          </div>
        </div>

        <div className="field">
          <div className="field__row">
            <label htmlFor="haptics">Haptics</label>
            <input
              id="haptics"
              className="switch"
              type="checkbox"
              checked={haptics}
              onChange={(event) => setHaptics(event.target.checked)}
            />
          </div>
        </div>
      </div>

      <Button block onClick={() => useUiStore.getState().setScreen(Screen.Menu)}>
        Back
      </Button>
    </div>
  );
};
