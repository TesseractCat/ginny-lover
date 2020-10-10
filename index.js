const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')
const robot = require('robotjs')
const iohook = require('iohook')

const leftPad = require('left-pad')
const fs = require('fs')

const port = new SerialPort('COM5')
const parser = port.pipe(new ByteLength({length: 6}))

let chords_file = fs.readFileSync('chords.json')
let chords_dict = JSON.parse(chords_file)

let words_file = fs.readFileSync('30k.txt').toString()

var special_chords = [0b00001111, 0b10011001, 0b00010001]
var break_words_chars = "?.,!()[]{}"

//keyboard.config.autoDelayMs = 0
robot.setKeyboardDelay(0)

var type_word_cpm = 2200
var char_mode = false

var chords_list = []

var word_mode = true
var last_word = ""

var reset_word_timeout

parser.on('data', async (data) => {
    let bitmask = 0;
    let thumbmask = 0;
    let rightchord = data[2]
    bitmask = (bitmask | data[0]) << 2
    bitmask = bitmask | (data[5] >> 5)
    bitmask = 0b0111111111 & bitmask
    thumbmask = data[1] >> 5
    
    let chord = chords_dict[leftPad(bitmask.toString(2), 8, 0)];
    
    //console.log('Data: ' + leftPad(data[0].toString(2), 8, 0) + ' - ' + leftPad(data[1].toString(2), 8, 0) + ' - ' + leftPad(data[5].toString(2), 8, 0))
    //robot.typeString("Hello World!")
    //console.log(leftPad(bitmask.toString(2), 8, 0) + ' - ' + leftPad(thumbmask.toString(2), 2, 0))
    
    clearTimeout(reset_word_timeout)
    reset_word_timeout = setTimeout(() => {reset_word_mode()}, 2500)
    
    if (thumbmask == 0b10) {
        if (bitmask == 0b00010000) {
            console.log("Toggle char mode!")
            char_mode = !char_mode
            reset_word_mode()
            return
        }
        if (bitmask == 0b00100000) {
            robot.keyTap("escape")
            return
        }
        if (bitmask == 0b01000000) {
            robot.keyTap("tab", "alt")
            return
        }
        if (bitmask == 0b10000000) {
            robot.keyTap("a", "control")
            return
        }
    }
    
    if (bitmask != 0 && !special_chords.includes(bitmask) && char_mode) {
        if (chord.base != "") {
            robot.keyTap(chord.base)
            return;
        }/* else if (chord.left_partials.length != 0) {
            robot.typeString(chord.left_partials[0])
        }*/
    }
    
    if (bitmask != 0 && !special_chords.includes(bitmask) && thumbmask != 0b10 && !char_mode) {
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
                robot.typeString(chord.base)
            } else if (chord.left_partials.length != 0) {
                robot.typeString(chord.left_partials[0])
            }
        }
    } else if (special_chords.includes(bitmask)) {
        if (bitmask == 0b00010001) {
            if (chords_list.length != 0) {
                chords_list.pop();
                //redraw_word()
            } else {
                word_mode = false
                //Send backspace
                if (thumbmask == 0b10) {
                    robot.keyTap("backspace", "control")
                    reset_word_mode()
                } else {
                    robot.keyTap("backspace")
                }
            }
        } else if (bitmask == 0b00001111) {
            robot.keyTap("enter")
            reset_word_mode()
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
    
    //F15 -- Spacebar
    if (event.keycode == 93) {
        setTimeout(function() {
            if (!char_mode)
                robot.typeStringDelayed(predict_word(chords_list, true), type_word_cpm)
            robot.typeString(' ')
            reset_word_mode()
        }, 50)
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
    
    console.log("RegExp: " + pred_search)
    //console.log("Matches: ")
    //console.log(pred_scores.slice(0,5))
    
    if (pred_scores.length != 0) {
        return pred_scores[0].match;
    } else {
        let pred_out = ""
        for (var i = 0; i < chords.length; i++) {
            pred_out += chords_dict[chords[i].chord].base != "" ?
                chords_dict[chords[i].chord].base : chords_dict[chords[i].chord].left_partials[0]
        }
        return pred_out
    }
}
