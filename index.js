const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')
const { exec } = require('child_process')
const robot = require('robotjs')
const iohook = require('iohook')

const leftPad = require('left-pad')
const fs = require('fs')

let config_dict = JSON.parse(fs.readFileSync('config.json'))
console.log("Trying to connect to " + config_dict["COM Port"])

const port = new SerialPort(config_dict["COM Port"])
const parser = port.pipe(new ByteLength({length: 6}))

let chords_file = fs.readFileSync('chords.json')
let chords_dict = JSON.parse(chords_file)

let autoreplace_file = fs.readFileSync('autoreplace.json')
let autoreplace_dict = JSON.parse(autoreplace_file)

let words_file = fs.readFileSync('30k.txt').toString()

var special_chords = [0b00001111, 0b10011001, 0b00010001]
var break_words_chars = "?.,!()[]{}"

//keyboard.config.autoDelayMs = 0
robot.setKeyboardDelay(0)

const debug_mode = config_dict["Debug Mode"]
console.log("Debug Mode: " + debug_mode)

var type_word_cpm = 2200
var char_mode = false
var num_mode = false

var chords_list = []

var word_mode = true
var last_word = ""

var reset_word_timeout

var double_press_timeout = 200
var double_press_pending = false
var mod_down = false
var next_shift = false

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

parser.on('data', async (data) => {
    let bitmask = 0;
    let rightchord = data[2]
    bitmask = (bitmask | data[0]) << 2
    bitmask = bitmask | (data[5] >> 5)
    bitmask = 0b0111111111 & bitmask
    
    let chord = chords_dict[leftPad(bitmask.toString(2), 8, 0)];
    
    if (debug_mode) {
        console.log('Data: ' + leftPad(data[0].toString(2), 8, 0) + ' - ' + leftPad(data[1].toString(2), 8, 0) + ' - ' + leftPad(data[5].toString(2), 8, 0))
    }
    
    clearTimeout(reset_word_timeout)
    reset_word_timeout = setTimeout(() => {reset_word_mode()}, 2500)
    
    if (mod_down) {
        if (bitmask == 0b00010000) {
            console.log("Toggle char mode!")
            char_mode = !char_mode
            reset_word_mode()
            //Play noise
            exec("ffplay sound.mp3 -nodisp -autoexit")
            return
        }
        if (bitmask == 0b00100000) {
            robot.keyTap("escape")
            return
        }
        if (bitmask == 0b01000000) {
            robot.keyToggle("alt", "down")
            robot.keyTap("tab")
            return
        }
        if (bitmask == 0b10000000) {
            robot.keyTap("a", "control")
            return
        }
        if (bitmask == 0b00001000) {
            robot.keyTap("left")
            return
        }
        if (bitmask == 0b00000100) {
            robot.keyTap("down")
            return
        }
        if (bitmask == 0b00000010) {
            robot.keyTap("up")
            return
        }
        if (bitmask == 0b00000001) {
            robot.keyTap("right")
            return
        }
    }
    
    if (bitmask != 0 && !special_chords.includes(bitmask) && char_mode) {
        if (chord.base != "") {
            robot.keyTap(chord.base)
            return;
        }
    }
    
    if (bitmask != 0 && !special_chords.includes(bitmask) && num_mode) {
        if (chord.base != "") {
            if (chord.num != undefined) {
                robot.keyTap(chord.num)
            }
            return;
        }
    }
    
    if (bitmask != 0 && !special_chords.includes(bitmask) && !mod_down && !char_mode && !num_mode) {
        if (break_words_chars.includes(chords_dict[leftPad(bitmask.toString(2), 8, 0)].base)
            && chords_dict[leftPad(bitmask.toString(2), 8, 0)].base != '') {
            //Punctuation
            robot.typeStringDelayed(predict_word(chords_list, true), type_word_cpm)
            word_mode = false
            chords_list = []
            robot.typeString(chords_dict[leftPad(bitmask.toString(2), 8, 0)].base)
        } else if (word_mode) {
            chords_list.push({chord: leftPad(bitmask.toString(2), 8, 0), right: rightchord})
            //redraw_word()
        } else {
            //Send base
            if (chord.base != "") {
                robot.typeString((next_shift ? capitalizeFirstLetter(chord.base) : chord.base))
            } else if (chord.left_partials.length != 0) {
                robot.typeString((next_shift ? capitalizeFirstLetter(chord.left_partials[0]) : chord.left_partials[0]))
            }
            next_shift = false
        }
    } else if (special_chords.includes(bitmask)) {
        if (bitmask == 0b00010001) {
            if (chords_list.length != 0) {
                if (mod_down) {
                    chords_list = []
                } else {
                    chords_list.pop();
                }
                //redraw_word()
            } else {
                word_mode = false
                //Send backspace
                if (mod_down) {
                    robot.keyTap("backspace", "control")
                    reset_word_mode()
                } else {
                    robot.keyTap("backspace")
                }
            }
        } else if (bitmask == 0b00001111) {
            robot.keyTap("enter")
            reset_word_mode()
        } else if (bitmask == 0b10011001) {
            console.log("Num mode")
            num_mode = !num_mode
        }
    }
})

iohook.on('keydown', event => {
    //{
    //  keycode: 46,
    //  rawcode: 8,
    //  type: 'keydown',
    //  altKey: true,
    //  shiftKey: true,
    //  ctrlKey: false,
    //  metaKey: false
    //}
    
    //F15 -- Mod
    if (event.keycode == 93 && !double_press_pending && !mod_down) {
        double_press_pending = true
        setTimeout(function() {double_press_pending = false}, double_press_timeout)
        mod_down = true
    } else if (event.keycode == 93 && double_press_pending && !mod_down) {
        console.log("Double press!")
        next_shift = true
    }
    //F16 -- Spacebar
    if (event.keycode == 99) {
        setTimeout(function() {
            if (!char_mode) {
                robot.typeStringDelayed(
                    (next_shift ? capitalizeFirstLetter(predict_word(chords_list, true)) : predict_word(chords_list, true)),
                    type_word_cpm)
            }
            robot.typeString(' ')
            reset_word_mode()
            next_shift = false
        }, 50)
    }
})
iohook.on('keyup', event => {
    if (event.keycode == 93) {
        robot.keyToggle("alt", "up")
        mod_down = false
    }
})

iohook.start()

function bit_nums_in_num(num) {
    // 10010010 -> 00000010 00010000 10000000
    var out_arr = []
    for (var i = 1; i <= num; i*=2) {
        if ((num & i) != 0) {
            out_arr.push(i)
        }
    }
    return out_arr
}

function reset_word_mode() {
    chords_list = []
    word_mode = true
    last_word = ""
}

function redraw_word() {
    let predicted_word = predict_word(chords_list, false)
    if (last_word == "") {
        robot.typeString(predicted_word)
    } else {
        if (predicted_word.length > last_word.length) {
            var i
            for (i = 0; i < last_word.length; i++) {
                if (last_word[i] != predicted_word[i])
                    break;
            }
            for (var k = 0; k < last_word.length - i; k++)
                robot.keyTap("backspace")
            robot.typeString(predicted_word.slice(i))
        } else {
            for (var i = 0; i < last_word.length; i++)
                robot.keyTap("backspace")
            robot.typeString(predicted_word)
        }
    }
    last_word = predicted_word
}

function predict_word(chords, final) {
    let pred_search = "^("
    //Single chord word
    if (chords.length == 1 && (chords_dict[chords[0].chord].left_word != "" || chords_dict[chords[0].chord].right_word != "") && final) {
        if (chords[0].right) {
            pred_search += chords_dict[chords[0].chord].right_word
        } else {
            pred_search += chords_dict[chords[0].chord].left_word
        }
    } else {
        for (var i = 0; i < chords.length; i++) {
            pred_search += "(" + chords_dict[chords[i].chord].base
            if (bit_nums_in_num(parseInt(chords[i].chord, 2)).length == 2) {
                pred_search += "|" +
                    bit_nums_in_num(parseInt(chords[i].chord, 2)).map(x => chords_dict[leftPad(x.toString(2), 8, 0)].base).join("|") +
                    "|" + bit_nums_in_num(parseInt(chords[i].chord, 2)).map(x => chords_dict[leftPad(x.toString(2), 8, 0)].base).join("") +
                    "|" + bit_nums_in_num(parseInt(chords[i].chord, 2)).map(x => chords_dict[leftPad(x.toString(2), 8, 0)].base).reverse().join("")
            }
            if (chords[i].right) {
                //console.log("Right Chord")
                pred_search += (chords_dict[chords[i].chord].right_partials.length == 0 || chords_dict[chords[i].chord].base == "" ? "" :  "|")
                    + chords_dict[chords[i].chord].right_partials.join("|")
            } else {
                pred_search += (chords_dict[chords[i].chord].left_partials.length == 0 || chords_dict[chords[i].chord].base == "" ? "" :  "|")
                    + chords_dict[chords[i].chord].left_partials.join("|")
            }
            pred_search += ")"
        }
    }
    pred_search += ")$"
    pred_search.replace("?", "\\?")
    
    let pred_regexp = RegExp(pred_search, 'gim')
    let pred_matches = words_file.match(pred_regexp)
    let pred_scores = []
    if (pred_matches != null) {
        pred_matches.forEach(function(m) {
            pred_score = 0
            for (var i = 0; i < chords.length; i++) {
                if (chords_dict[chords[i].chord].base != "" && m.includes(chords_dict[chords[i].chord].base)) {
                    pred_score += 1
                }
            }
            pred_scores.push({match: m, score: pred_score})
        });
        pred_scores.sort((a,b) => b.score - a.score)
        pred_scores = pred_scores.filter(x => x.score == pred_scores[0].score)
    }
    
    //console.log("RegExp: " + pred_search)
    //console.log("Matches: ")
    //console.log(pred_scores.slice(0,5))
    
    if (pred_scores.length != 0) {
        if (pred_scores[0].match in autoreplace_dict) {
            return autoreplace_dict[pred_scores[0].match]
        } else {
            return pred_scores[0].match
        }
    } else {
        let pred_out = ""
        for (var i = 0; i < chords.length; i++) {
            pred_out += chords_dict[chords[i].chord].base != "" ?
                chords_dict[chords[i].chord].base : chords_dict[chords[i].chord].left_partials[0]
        }
        if (pred_out in autoreplace_dict) {
            return autoreplace_dict[pred_out]
        } else {
            return pred_out
        }
    }
}
