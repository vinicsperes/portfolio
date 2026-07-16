import { useState, type MutableRefObject } from "react";
import { PedalBody } from "./PedalBody";

const noop = () => {};

export function PedalScene({
  palette,
  xray = false,
  explode = 0,
  explodeRef = null,
  circuitOnly = false,
  split = false,
  spin = null,
  hideTag = false,
  ledColor,
  ledActive = false,
  onTap = noop,
  onStomp = noop,
  knobDrive = 0.55,
  knobEcho = 0.5,
  knobTone = 0.6,
  knobReverb = 0.5,
  knobMod = 0.35,
  knobMaster = 0.7,
  onKnobChange = noop,
  setControlsEnabled = noop,
  bootTrigger = 0,
  presetIdx = null,
  onChassisEnter = noop,
  onChassisLeave = noop,
}: {
  palette: { pedal: string; ink: string; accent: string; cream: string; metal: string };
  xray?: boolean;
  explode?: number;
  explodeRef?: MutableRefObject<number> | null;
  circuitOnly?: boolean;
  split?: boolean;
  spin?: number | null;
  hideTag?: boolean;
  ledColor: string;
  ledActive?: boolean;
  onTap?: () => void;
  onStomp?: () => void;
  knobDrive?: number;
  knobEcho?: number;
  knobTone?: number;
  knobReverb?: number;
  knobMod?: number;
  knobMaster?: number;
  onKnobChange?: (
    knob: "drive" | "echo" | "tone" | "reverb" | "mod" | "master",
    value: number,
  ) => void;
  setControlsEnabled?: (enabled: boolean) => void;
  bootTrigger?: number;
  presetIdx?: number | null;
  onChassisEnter?: () => void;
  onChassisLeave?: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <PedalBody
      palette={palette}
      xray={xray}
      explode={explode}
      explodeRef={explodeRef}
      circuitOnly={circuitOnly}
      split={split}
      spin={spin}
      hideTag={hideTag}
      presetIdx={presetIdx}
      ledColor={ledColor}
      ledActive={ledActive}
      knobDrive={knobDrive}
      knobEcho={knobEcho}
      knobTone={knobTone}
      knobReverb={knobReverb}
      knobMod={knobMod}
      knobMaster={knobMaster}
      onKnobChange={onKnobChange}
      setControlsEnabled={setControlsEnabled}
      bootTrigger={bootTrigger}
      onChassisEnter={onChassisEnter}
      onChassisLeave={onChassisLeave}
      pressed={pressed}
      onPress={() => {
        setPressed(true);
        onStomp();
      }}
      onRelease={() => {
        if (pressed) {
          setPressed(false);
          onTap();
        }
      }}
      onCancel={() => setPressed(false)}
    />
  );
}
