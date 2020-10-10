#include QMK_KEYBOARD_H
#include "keymap_steno.h"

//#include "g/engine.h"
//#include "g/keymap_engine.h"

/* Note: Don't edit this file! 
 *
 * You can tweak what dictionaries/languages are loaded in dicts.def
 * Your personal keymap is over in user.def
 *
 * This is the most non-QMK powered device ever :)
 * Happy Hacking,
 *		-- Germ
 */

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
//[0] = LAYOUT_ginny(
//		KC_Q, KC_W, KC_E, KC_R, KC_C, KC_SPC, KC_U, KC_I, KC_O, KC_P
//)};
[0] = LAYOUT_ginny(
		//STN_N1, STN_N2, STN_N3, STN_N4, STN_S1, STN_S2, STN_N5, STN_N6, STN_N7, STN_N8
		STN_N1, STN_N2, STN_N3, STN_N4, KC_F15, KC_F16, STN_N5, STN_N6, STN_N7, STN_N8
)};

uint16_t lastkeycode = 0;
uint8_t rightchord = 0;
bool process_steno_user(uint16_t keycode, keyrecord_t *record) {
    if (lastkeycode == 0) {
        switch (keycode) {
            case STN_N1:
            case STN_N2:
            case STN_N3:
            case STN_N4:
                rightchord = 0;
                break;
            default:
                rightchord = 1;
                break;
        }
    }
    lastkeycode = keycode;
    return true;
}

bool send_steno_chord_user(steno_mode_t mode, uint8_t chord[6]) {
    if (rightchord) {
        chord[2] = rightchord;
    }
    lastkeycode = 0;
    rightchord = 0;
    return true;
}
