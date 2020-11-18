# Ginny Lover

PC Side ASETNIOP input method designed for the Ginny keyboard. Designed for use
with the included firmware. This firmware outputs using GeminiPR with this bit
layout:

```
00000000 00000000 [00000000] 00000000 00000000 00000000
  asetni [thumbs]   ^                          op      
                    |
            right chord? (1 or 0)
```

The spacebar outputs F16, as it is independent from the chording.
The left thumb outputs F15.

## Usage

Run `npm install` to install dependencies. Note that you will need git and a
recent version of node.

Get a keyboard flashed with either my QMK fw or one that exposes the same
functionality (geminiPR and thumb buttons). Edit `config.json` with your COM port.

## Functionality

The top row is aset - niop. Left thumb is a modifier, right thumb is spacebar.

By default there is autoprediction, and words you type only
get typed out once you press spacebar.

Press left thumb and left index to toggle char mode, this mode
is asetniop with no autoprediction. 

Press a  t - n  p to toggle numerical mode.

Left thumb + a is ctrl + a.
Left thumb + s is alt tab.
Left thumb + e is escape.
Left thumb + t is toggle char mode.

Double tap left thumb makes the next character uppercase.

Enable "Sound" in `config.json` to play a sound whenever char mode is toggled. This requires `ffplay`.

Enable "Debug Mode" in `config.json` to show the data sent over serial to verify that the correct
COM port has been selected.

## Dependencies

Note you have to build the latest version of robotjs yourself, see https://github.com/octalmage/robotjs/issues/530.
