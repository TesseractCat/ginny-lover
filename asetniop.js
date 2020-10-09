//Version 1.2.0 
//added simple predictive

/*DIFFERENCES BETWEEN ANDRIOD/JAVA VERSION
JS will suggest all caps words as predictive regardless of shift state (but will suggest them in shifted form), A/J will only suggest them if first letter is capitalized (and uses a different threshold)


*/

//create master asetniop object to contain program states
asetniop = {}
settings = {}

//settings for determining initial output
settings.word_bonus = 100
settings.left_bonus = 4 //whether other formulation will supersede
settings.right_bonus = 4 //whether other formulation will supersede
settings.one_group_cutoff = 0.001 //if one-letter words do not occur with this frequency, it checks for autocorrect
settings.backspace_interval = [125,67,32,16]
settings.backspace_hold = [4,15,30,100]

settings.word_autocorrect_status = true //on/off switch for autocorrect; if FALSE it is always off.
settings.num_autocorrect_status = false //autcorrect always off for numbers and symbols

settings.autocorrect_status = settings.word_autocorrect_status

settings.predictive = true //on/off switch for predictive - current cannot be turned off because feeds into accent_inline functionality
settings.predictive_length = 1 //CANNOT BE LESS THAN 1
settings.predictive_factor = 3 //if top choice is this many times more common than second choice, will suggest

settings.accent_inline = true; //starts off true, can be toggled via the index page

settings.num_predictions = 5

settings.layout = "standard"

//init()

//ADD 'STATS' TO DICTIONARY
//FIND TOUCH-END KEYS TO PREVENT STUCK KEYS...still an issue
//RESOLVE LOST SPACES - SOMETIMES SPACE HITS DON'T REGISTER - think it's because if too many keys are down it won't register the space


function visual_key_down(active_button){
	$("#b_"+active_button).addClass("down_button")
}

function visual_key_up(active_button){
	$("#b_"+active_button).removeClass("down_button")
}

function visual_iterate_shift(active_button, new_shift_state){
	if(new_shift_state == 0){
		$("#b_"+active_button).removeClass("down_button")
		$("#b_"+active_button).removeClass("caps_button")
	}
	else if(new_shift_state == 1){
		$("#b_"+active_button).addClass("down_button")
	}
	else if(new_shift_state == 2){
		$("#b_"+active_button).removeClass("down_button")
		$("#b_"+active_button).addClass("caps_button")
	}
}

function visual_add_keystroke(keystroke){
	output_string = $("#output_text").text()
	if(keystroke == 'backspace'){
		output_string = output_string.substring(0,output_string.length - 1)
	}
	else if(keystroke == 'enter'){
		output_string += "\n"
	}
	else{
		output_string += keystroke
	}
	$("#output_text").text(output_string)
	additional_processing();
}

function additional_processing(){
	//currently does nothing; can be superseded (in html page or elsewhere) if needed
}

function visual_update_cursor(predictive, word){
	if(!predictive){
		if(asetniop.cursor_state == 'letters'){
			$("#cursor").text("_")
		}
		else if(asetniop.cursor_state == 'numsym'){
			$("#cursor").text("#")
		}
	}
	else{
		word_diff = word.length - asetniop.current_word.length
		suffix = word.substring(word.length - word_diff,word.length)
		$("#cursor").text(suffix)
		
	}
}

function visual_update_prediction(reset, choice_array){
	for(i = 0; i < settings.num_predictions; i++){
		$("#prediction_"+i).removeClass("predictive_highlight")
	}
	if(reset){
		for(i = 0; i < settings.num_predictions; i++){
			$("#prediction_"+i).text("")
		}
	}
	else{
		for(i = 0; i < choice_array.length; i++){
			$("#prediction_"+i).text(choice_array[i])
		}
	}
}


function visual_iterate_prediction(iteration){
	for(i = 0; i < settings.num_predictions; i++){
		$("#prediction_"+i).removeClass("predictive_highlight")
	}
	$("#prediction_"+asetniop.prediction_iteration).addClass("predictive_highlight")
}


function visual_display_keyboard(){
	//keyboard remains invisible until dictionary has finished loading
	$("#container").css("display", "block");
}

function visual_clear_text(){
	$("#output_text").text("")
	additional_processing()
	initial_states()
	reset_word_states()
	reset_key_states()
	visual_update_prediction(true)
}

function visual_update_labels(){
	
	if(settings.layout == "colemak"){
		base = ["A","R","S","T","N","E","I","O"]
		subbase = ["Q (","W Z","X F","P&hairsp;C&hairsp;D&hairsp;B&hairsp;V&hairsp;G","J K M H L",", U",". - Y","&larr; ) ' ? ! ;"]
		
		numbase = ["1","2","3","4","7","8","9","0"]
		numsubbase = ["` \ (","&#8226; &#163;","&#215;","{ 5 =","6 }","&#960; ,",". - &#8364;","? ) ' &larr; ! ;"]
		
		backspace_code = 129
	}
	else if(settings.layout == "dvorak"){
		base = ["A","O","E","I","H","T","N","S"]
		subbase = ["! ; ( '",", Q",". J","P Y U K X","B F D G M","W C","V R","- &larr; ) ? Z L"]
		
		numbase = ["1","2","3","4","7","8","9","0"]
		numsubbase = ["` \ (","&#8226; &#163;","&#215;","{ 5 =","6 }","&#960; ,",". - &#8364;","? ) ' &larr; ! ;"]
		
		backspace_code = 130
	}
	else{
		base = ["A","S","E","T","N","I","O","P"]
		subbase = ["Q Z (","W C","X D","F R B V G","J Y H U M","K ,",". - L","? ) ' &larr; ! ;"]
		
		numbase = ["1","2","3","4","7","8","9","0"]
		numsubbase = ["` \ (","&#8226; &#163;","&#215;","{ 5 =","6 }","&#960; ,",". - &#8364;","? ) ' &larr; ! ;"]
		
		backspace_code = 136
	}
	
	
	if(asetniop.num_keys_down == 0){
		if(asetniop.cursor_state == 'numsym')
		{
			for(i = 0; i < 8; i++){
				$("#label_"+i).html(numbase[i])
				$("#sublabel_"+i).html(numsubbase[i])
			}
		}
		else{
			for(i = 0; i < 8; i++){
				$("#label_"+i).html(base[i])
				$("#sublabel_"+i).html(subbase[i])
			}
		}
	}
	else if(asetniop.num_keys_down == 1){
		if (asetniop.max_num_keys_down == 1) {
			for(i = 0; i < 8; i++){
				calc_state = Math.pow(2, i);
				if (calc_state == asetniop.key_state) {
					//leave current label alone
				} else {
					
					if(calc_state + asetniop.key_state == backspace_code){
						output = "&larr;"
					}
					else{
						if (asetniop.shift == 1) {
							output = asetniop.active_keymap[calc_state + asetniop.key_state].baseshift
						} else {
							output = asetniop.active_keymap[calc_state + asetniop.key_state].base.toUpperCase()
						}
					}
					$("#label_"+i).html(output)
					$("#sublabel_"+i).html("")
					
				}
			}
		} else {
			//leaves them alone
		}
	}	
	else if(asetniop.num_keys_down == 2){
		if (asetniop.max_num_keys_down == 2) {
			for(i = 0; i < 8; i++){
				if (asetniop.pressed_buttons[i]) {
					if(asetniop.key_state == backspace_code){
						output = "&larr;"
					}
					else{
						if (asetniop.shift == 1) {
							output = asetniop.active_keymap[asetniop.key_state].baseshift
						} else {
							output = asetniop.active_keymap[asetniop.key_state].base.toUpperCase()
							//don't forget to update keymaps to include â† arrow key for backspace.base.
						}
					}
					$("#label_"+i).html(output)
					
				} else {
					$("#label_"+i).html("")
				}
			}
		} else {
			//leaves them alone
		}
		
	}
	
	
	
	
}


function initial_states(){ //only ones not covered by resets
	asetniop.shift = 0 //initial state; off
	visual_iterate_shift(8,0) //ensure shift key is not lit up
	asetniop.shift_no_reset = false;
	asetniop.backspace_repeat = 0;
	asetniop.backspace_interval = settings.backspace_interval[0]
	asetniop.cursor_state = 'letters'
}

function reset_word_states(){
	asetniop.current_word = ""
	asetniop.key_groups = []
	asetniop.text_groups = []
	asetniop.shift_status = []
	asetniop.autocorrect_state = settings.autocorrect_status
	asetniop.predictive = false
	asetniop.skip_predictive_iteration = true
	asetniop.prediction_iteration = -1;
	asetniop.num_active_predictions = 0;
	asetniop.basechoicearray = []
	
}

function reset_key_states(){
	asetniop.key_state = 0
	asetniop.max_key_state = 0
	asetniop.num_keys_down = 0
	asetniop.max_num_keys_down = 0
	asetniop.leading_space = false
	asetniop.trailing_space = false
	asetniop.key_sequence = []
	asetniop.pressed_buttons = []
	for(var i=0; i<10; i++){
		asetniop.pressed_buttons[i] = false
	}
	asetniop.backspace_first_time = true
	asetniop.backspace_counter = 0
	asetniop.autocorrect_tripped = false
		
	//scrolling behavior
	$(document).scrollTop($(document).height());
	
}

function reset_shift(){
	//only resets if shift has been released
	if(asetniop.predictive && !asetniop.keys_down[8] && !asetniop.skip_predictive_iteration){
		advance_prediction_iteration()
		visual_iterate_prediction()
	}
	if(!asetniop.keys_down[8] && asetniop.shift_no_reset){
		asetniop.shift = 0
		visual_iterate_shift(8,0)
		asetniop.shift_no_reset = false
	}
}

function iterate_shift(){
	if(asetniop.predictive && asetniop.predictive_output.length > 0){ //if predictive is on AND contains choices
		if(asetniop.keys_down[8] && asetniop.shift != 1){
			if(asetniop.shift == 0){
				asetniop.shift = 1
				visual_iterate_shift(8,1)
				asetniop.shift_no_reset = true
				asetniop.skip_predictive_iteration = false
			}
			if(asetniop.shift == 2){
				asetniop.shift_no_reset = false
				asetniop.skip_predictive_iteration = false
			}
		}
	}
	else{
		asetniop.shift_no_reset = false
		if(asetniop.shift == 0){
			asetniop.shift = 1
			visual_iterate_shift(8,1)
		}
		else if(asetniop.shift == 1){
			asetniop.shift = 2
			visual_iterate_shift(8,2)
		}
		else if(asetniop.shift == 2){
                //if CAPS is down and user tried to hold and shift punctuation, (say, >) shift will iterate instead.  Maybe add separate action for key release?
			asetniop.shift = 0
			visual_iterate_shift(8,0)
		}
	}
}


function backspace_actions(){
	//reset shift if in basic shift mode
	if(asetniop.shift == 1){
		asetniop.shift_no_reset = true
		reset_shift()
	}
		
	//generate new predictions
	if(asetniop.current_word.length > 0){
		asetniop.shift_status.pop()
		if(!asetniop.autocorrect_tripped){
			asetniop.current_word = asetniop.current_word.substring(0,asetniop.current_word.length - 1)
		}
		//keep key_groups and text_groups clean
		asetniop.key_groups.pop()
		asetniop.text_groups.pop()
	}
	predictive_generation(1)
	
}

function advance_prediction_iteration(){
	asetniop.prediction_iteration += 1
	if(asetniop.prediction_iteration >= asetniop.num_active_predictions){
		asetniop.prediction_iteration = -1
	}
	
	if(asetniop.prediction_iteration >= 0 && asetniop.current_word.length == asetniop.predictive_base[asetniop.prediction_iteration].length && settings.accent_inline){
		accent_replace(asetniop.predictive_output[asetniop.prediction_iteration], asetniop.predictive_base[asetniop.prediction_iteration])
	}else{ 
		accent_replace(asetniop.current_word, asetniop.current_word)
	}
}

function accent_replace(word, base){

	//trim original
	output_string = $("#output_text").text()
	output_string = output_string.substring(0,output_string.length - base.length);
	$("#output_text").text(output_string)
	
	//update output
	for(var i=0; i<word.length; i++){
		visual_add_keystroke(word[i])
	}
	
	
}

	


//INTERFACE FUNCTIONS - VARIOUS FUNCTIONS THAT CONNECT FRONT-END INTERACTIONS (KEYBOARD PRESSES, TOUCHSCREEN TOUCHES, ETC.) TO BACK-END PROCESSING

//use these functions when keyboard keys are pressed, then send action to button_down and button_up functions
function keydown(event){
	event.preventDefault()
	//reference keycode to key
	if(event.keyCode == 8){
		button_down(3);
		button_down(7);
	}
	else{
		//console.log(event.keyCode)
		if(asetniop.active_keycodes[event.keyCode] != undefined){
			active_button = asetniop.active_keycodes[event.keyCode][1]
			button_down(active_button)
		}
		else{
			console.log("inactive key")
		}
	}
}

function keyup(event){
	event.preventDefault()
	//reference keycode to key
	if(event.keyCode == 8){
		button_up(3);
		button_up(7);
	}
	else if(asetniop.active_keycodes[event.keyCode] != undefined){
		active_button = asetniop.active_keycodes[event.keyCode][1]
		button_up(active_button)
	}
}


function init(){
	
	//bind touch functions to overlay elements
	
	$('#o_0').on({ 'touchstart' : function(){ button_down(0) } });
	$('#o_0').on({ 'touchend' : function(){ button_up(0) } });
	$('#o_0').on({ 'touchcancel' : function(){ button_up(0) } });
	
	$('#o_1').on({ 'touchstart' : function(){ button_down(1) } });
	$('#o_1').on({ 'touchend' : function(){ button_up(1) } });
	$('#o_1').on({ 'touchcancel' : function(){ button_up(1) } });
	
	$('#o_2').on({ 'touchstart' : function(){ button_down(2) } });
	$('#o_2').on({ 'touchend' : function(){ button_up(2) } });
	$('#o_2').on({ 'touchcancel' : function(){ button_up(2) } });
	
	$('#o_3').on({ 'touchstart' : function(){ button_down(3) } });
	$('#o_3').on({ 'touchend' : function(){ button_up(3) } });
	$('#o_3').on({ 'touchcancel' : function(){ button_up(3) } });
	
	$('#o_4').on({ 'touchstart' : function(){ button_down(4) } });
	$('#o_4').on({ 'touchend' : function(){ button_up(4) } });
	$('#o_4').on({ 'touchcancel' : function(){ button_up(4) } });
	
	$('#o_5').on({ 'touchstart' : function(){ button_down(5) } });
	$('#o_5').on({ 'touchend' : function(){ button_up(5) } });
	$('#o_5').on({ 'touchcancel' : function(){ button_up(5) } });
	
	$('#o_6').on({ 'touchstart' : function(){ button_down(6) } });
	$('#o_6').on({ 'touchend' : function(){ button_up(6) } });
	$('#o_6').on({ 'touchcancel' : function(){ button_up(6) } });
	
	$('#o_7').on({ 'touchstart' : function(){ button_down(7) } });
	$('#o_7').on({ 'touchend' : function(){ button_up(7) } });
	$('#o_7').on({ 'touchcancel' : function(){ button_up(7) } });
	
	$('#o_8').on({ 'touchstart' : function(){ button_down(8) } });
	$('#o_8').on({ 'touchend' : function(){ button_up(8) } });
	$('#o_8').on({ 'touchcancel' : function(){ button_up(8) } });
	
	$('#o_9').on({ 'touchstart' : function(){ button_down(9) } });
	$('#o_9').on({ 'touchend' : function(){ button_up(9) } });
	$('#o_9').on({ 'touchcancel' : function(){ button_up(9) } });
	
	/*
	mouse versions
	$("#b_0").mousedown(function() {button_down(0)});
	$("#b_0").mouseup(function() {button_up(0)});
	$("#b_0").mouseout(function() {button_up(0)});
	
	*/
	
	asetniop.keys_down = {}
	for(var i=0; i<10; i++){
		asetniop.keys_down[i] = false
	}	
	initial_states()
	reset_word_states()
	reset_key_states()
	
	load_new_language()
	
}


function load_new_language(){
	
	language = $('#language_select').val()
	full_language = language;
	if(language.indexOf("colemak") > -1){
		language = language.substring(0,2)
		settings.layout = "colemak"
	}
	else if(language.indexOf("dvorak") > -1){
		language = language.substring(0,2)
		settings.layout = "dvorak"
	}
	else{
		settings.layout = "standard"
	}

	
	//load settings file
	$.getJSON("../resources/settings/settings_arrays.json", function(data){
		asetniop.settings = data
		
		//set up initial settings
		asetniop.active_keycodes = asetniop.settings.keycodes.QWERTY
		
		if(settings.layout == "colemak"){
			asetniop.active_keycodes = asetniop.settings.keycodes.Colemak
		}
		else if(settings.layout == "dvorak"){
			asetniop.active_keycodes = asetniop.settings.keycodes.Dvorak
		}
		else{
			//already good
		}	
	})
	
	$.getJSON("../resources/keymaps/" + full_language + "-keymap.json", function(data){
		asetniop.keymap = data
		//sets active_keymap to letters
		asetniop.active_keymap = asetniop.keymap
	})
	
	$.getJSON("../resources/keymaps/num-keymap.json", function(data){
		asetniop.numkeymap = data
	})
	
	//load dictionary and predictive objects
	$.getJSON("../resources/dictionaries/" + language + "-initial.json", function(data){
		asetniop.totalwordcount = data.dictionarystats.totalwordcount
	})
	
	
	$.getJSON("../resources/dictionaries/" + language + "-snap.json", function(data){
		asetniop.snapdic = data
	})
	
	$.getJSON("../resources/dictionaries/" + language + "-dictionary.json", function(data){
		asetniop.prioritydic = data.prioritydic
		//add "asetniop" to dictionary
		add_word_to_prioritydic("asetniop", 100)
		
		visual_display_keyboard()
	})
	
	visual_update_labels()
	
}

function add_word_to_prioritydic(word, count){

		letterarray = word.split("");
		numletters = letterarray.length;
		
		evalexpression = 'asetniop.prioritydic';
		for(y = 0; y < numletters; y++){
			evalexpression = evalexpression + '.' + letterarray[y];
			//breaks loop if it finds a mistake
			if(!eval(evalexpression)){
				eval(evalexpression + " = {}")
			}
		}
		eval(evalexpression + ".nn = " + count)
	
}



function button_down(active_button){
	
	//activate key
	if(!asetniop.keys_down[active_button]){
		asetniop.keys_down[active_button] = true
		
		if(active_button <= 7){
			//add keypress to tracked sequence for autocorrect
			if(!asetniop.pressed_buttons[active_button]){
				asetniop.key_sequence.push(active_button)
				asetniop.max_key_state += Math.pow(2,active_button);
				asetniop.max_num_keys_down += 1
				
			}
			
			if(asetniop.max_num_keys_down == 2 && asetniop.active_keymap[asetniop.max_key_state].special == 'bksp'){
				asetniop.backspace_active = true
				asetniop.backspace_repeat=setInterval(backspace_repeat_function, asetniop.backspace_interval)
				backspace_repeat_function();
				
			}
			else{ //make sure clearInterval stops appropriately
				if(asetniop.backspace_active){
					clearInterval(asetniop.backspace_repeat);
					asetniop.backspace_interval = settings.backspace_interval[0]
					asetniop.backspace_counter = 0
				}
			}
			
			asetniop.pressed_buttons[active_button] = true
			
			//visual elements
			visual_key_down(active_button)
			
			// original code used |= instead; think it only allows addition
			asetniop.key_state += Math.pow(2,active_button);

			asetniop.num_keys_down += 1
			
			//deactivates shift hold for predictive
			asetniop.skip_predictive_iteration = true
			
		}
		//special case for shift
		else if(active_button == 8){
			iterate_shift()
		}
		//special case for space
		else if(active_button == 9){
			visual_key_down(active_button)
			
			if(asetniop.num_keys_down > 0){
				asetniop.trailing_space = true
			}
			else{
				asetniop.leading_space = true
			}
		}
	}
	
	visual_update_labels()
	
}


function button_up(active_button){

	//deactivate key
	if(asetniop.keys_down[active_button]){
		asetniop.keys_down[active_button] = false
		
		// original code used &= instead; think it allows only subtraction
		if(active_button <= 7){
			visual_key_up(active_button)			
			asetniop.key_state -= Math.pow(2,active_button);
			asetniop.num_keys_down -= 1
			
			//backspace special case
			if(asetniop.num_keys_down == 1 && asetniop.active_keymap[asetniop.max_key_state].special == 'bksp'){
				if(asetniop.backspace_active){
					//stop repeater and reset intervals
					clearInterval(asetniop.backspace_repeat);
					asetniop.backspace_interval = settings.backspace_interval[0]
				}
				if(asetniop.backspace_counter <= settings.backspace_hold[0]){
					//need to prevent extra backspace on release when repeater is active
					if(asetniop.backspace_first_time){
						//run autocorrect check for potential t/p and p/t words
						backspace_fix = backspace_autocorrect(asetniop.current_word)
						if(backspace_fix[0]){
							processed_output = backspace_fix[1]
							processed_shift = backspace_fix[2]
							for(var i=0; i<processed_output.length; i++){
								processed_letter = processed_output[i]
								visual_add_keystroke(processed_letter)
								//update trackers
								asetniop.current_word += processed_letter
								asetniop.text_groups.push(processed_letter)
								asetniop.key_groups.push([asetniop.key_sequence[i]])
								asetniop.shift_status.push(processed_shift[i])
								
							}
						}
						else{
							asetniop.backspace_first_time = false
							asetniop.autocorrect_state = false
							backspace_actions()
							visual_add_keystroke('backspace')
						}
					}
					else{
						backspace_actions()
						visual_add_keystroke('backspace')
					}
				}
				asetniop.backspace_counter = 0
			}
			asetniop.backspace_active = false
		}
		//special cases for space and shift
		if(active_button == 9){
			visual_key_up(active_button)
		}
		if(active_button == 8){
			reset_shift()
		}
		
		if(asetniop.key_state == 0){
			//process key
			process_output()
			reset_key_states()
		}
	}
	
	visual_update_labels()
}	


function backspace_repeat_function(){
	if(asetniop.backspace_counter > settings.backspace_hold[0]){
		backspace_actions()
		visual_add_keystroke('backspace')
	}
	asetniop.backspace_counter += 1
	
	//run through various tiers to see if time to accelerate
	for(var i=1; i<settings.backspace_hold.length; i++){
		if(asetniop.backspace_counter == settings.backspace_hold[i]){
			asetniop.backspace_interval = settings.backspace_interval[i]
			//kill old repeater and restart with new interval
			clearInterval(asetniop.backspace_repeat);
			asetniop.backspace_repeat=setInterval(backspace_repeat_function, asetniop.backspace_interval)
			backspace_repeat_function();
		}
	}
	
}


function process_output(){
	
	//deal with special cases (backspace, etc.)
	
	if(asetniop.active_keymap[asetniop.max_key_state].special){
		if(asetniop.active_keymap[asetniop.max_key_state].special == 'bksp'){
			//has already processed
			return true
		}
		if(asetniop.active_keymap[asetniop.max_key_state].special == 'enter'){
			visual_add_keystroke('enter')
			reset_key_states()
			reset_word_states()
			visual_update_prediction(true)
			return true
		}
		else if(asetniop.active_keymap[asetniop.max_key_state].special == 'numsym'){
			asetniop.active_keymap = asetniop.numkeymap
			settings.autocorrect_status = settings.num_autocorrect_status			
			asetniop.autocorrect_state = false
			asetniop.cursor_state = 'numsym'
			visual_update_cursor(false)
			return true
		}
		else if(asetniop.active_keymap[asetniop.max_key_state].special == 'letters'){
			asetniop.active_keymap = asetniop.keymap
			settings.autocorrect_status = settings.word_autocorrect_status			
			asetniop.autocorrect_state = false
			asetniop.cursor_state = 'letters'
			visual_update_cursor(false)
			return true
		}
	}
	
	backtrack = 0 //how far back it will reach
	original_output = ""
	processed_output = ""
	alpha_output = ""
	if(asetniop.leading_space){
		//close off previous word and check autocorrect
		if(asetniop.autocorrect_state && asetniop.prediction_iteration < 0){
			replacement = word_autocorrect(asetniop.current_word)
			if(replacement[0]){
				processed_output += replacement[1]
				backtrack += replacement[1].length + (asetniop.current_word.length - replacement[1].length)
			}
		}
		
		original_output += " "
		processed_output += " " 
		backtrack += 0
		
		//actuate prediction, if appropriate
		if(processed_output == " " && asetniop.predictive == true && asetniop.shift == 1){
			advance_prediction_iteration()
			visual_iterate_prediction()
			actuate_prediction(0)
			backtrack = 0
		}
		else if(processed_output == " " && asetniop.predictive == true && asetniop.prediction_iteration > -1){
			actuate_prediction(0)
			backtrack = 0
		}
		reset_word_states()
		
	}
	if(asetniop.max_key_state > 0){
		output_object = asetniop.active_keymap[asetniop.max_key_state]
		
		//record shift status
		asetniop.shift_no_reset = true
		if(asetniop.max_num_keys_down < 3){
			
			if(asetniop.shift == 0){ // regular
				alpha_output = output_object.base
			}
			else if(asetniop.shift == 1){ // shift OR shift key currently being held down
				alpha_output = output_object.baseshift
				//reset_shift()
			}
			else if(asetniop.shift == 2){ // caps lock - ignores punctuation
				if(asetniop.keys_down[8]){ //if shift is currently being held down
					//shift output and prevent caps lock from turning off
					asetniop.shift_no_reset = false
					if("!(?).,-;'1234567890".indexOf(output_object.base) > -1){
						alpha_output = output_object.baseshift
					}
					else{
						alpha_output = output_object.base
					} 
				}
				else{
					if("!(?).,-;'1234567890".indexOf(output_object.base) > -1){
						alpha_output = output_object.base
					}
					else{
						alpha_output = output_object.baseshift
					}
				}
			}
		}
		else{
			//figure out first/base choice
			
			for(var i=0; i<asetniop.key_sequence.length; i++){
				alpha_output += asetniop.active_keymap[binary_calculator([asetniop.key_sequence[i]])].base // base output only used if there is NOTHING else
			}
		
			//determine bonuses
			word_bonus = 1
			left_bonus = 1
			right_bonus = 1
			
			//supersede with more practical option, if available
			if(asetniop.key_sequence[0] < 4){
				left_bonus = settings.left_bonus
				if(asetniop.trailing_space && asetniop.current_word == "" && output_object.tlw){ //pure word
					word_bonus = settings.word_bonus
					alpha_output = output_object.tlw[0]
				}
				else if(output_object.tlp){
					alpha_output = output_object.tlp[0]
				}
			}
			else if(asetniop.key_sequence[0] >= 4){
				right_bonus = settings.right_bonus
				if(asetniop.trailing_space && asetniop.current_word == "" && output_object.trw){ //pure word
					word_bonus = settings.word_bonus
					alpha_output = output_object.trw[0]
				}
				else if(output_object.trp){
					alpha_output = output_object.trp[0]
				}
			}
			
			// if possible make smarter decision about what to use
			beta_array = []
			//push objects into beta_array after adjusting counts based on keyboard state - won't consider ones that don't make sense as words
			if(output_object.tlp && wordcheck(asetniop.current_word + output_object.tlp[0], true)){
				beta_array.push([output_object.tlp[0],output_object.tlp[1]*left_bonus])
			}
			if(output_object.trp && wordcheck(asetniop.current_word + output_object.trp[0], true)){
				beta_array.push([output_object.trp[0],output_object.trp[1]*right_bonus])
			}
			if(output_object.tlw && wordcheck(asetniop.current_word + output_object.tlw[0], true)){
				beta_array.push([output_object.tlw[0],output_object.tlw[1]*left_bonus*word_bonus])
			}
			if(output_object.trw && wordcheck(asetniop.current_word + output_object.trw[0], true)){
				beta_array.push([output_object.trw[0],output_object.trw[1]*right_bonus*word_bonus])
			}
			if(beta_array.length > 0){
				beta_array = beta_array.sort(function(x,y) { return y[1] - x[1] });
				alpha_output = beta_array[0][0]
			}
			
			//update shift status and apply appropriate shift response
			if(asetniop.shift == 1){ // capitalize first letter
				alpha_output = alpha_output.charAt(0).toUpperCase() + alpha_output.slice(1);
				//reset_shift()
			}
			else if(asetniop.shift == 2){ // caps lock - uppercase all except punctuation/hyphens etc.
				alpha_output = alpha_output.toUpperCase();
			}
		}
		
		asetniop.current_word += alpha_output
		
		//update shift status and reset
		for(var i=0; i<alpha_output.length; i++){
			if(asetniop.shift == 2){
				asetniop.shift_status.push(2)
			}
			else if(i == 0 && asetniop.shift == 1){
				asetniop.shift_status.push(1)
				reset_shift()
			}
			else{
				asetniop.shift_status.push(0)
			}
		}
		
		original_output += alpha_output
		processed_output += alpha_output
		backtrack += 0
		
		//update key history
		asetniop.key_groups.push(asetniop.key_sequence)
		asetniop.text_groups.push(alpha_output)
		
		if(asetniop.autocorrect_state && !asetniop.trailing_space && asetniop.prediction_iteration < 0){ // will not process if there's a trailing space; will do word_autocorrect only
		
			replacement = partial_autocorrect(asetniop.current_word)
			if(replacement[0]){
				processed_output = replacement[1]
				backtrack = replacement[1].length + (asetniop.current_word.length - replacement[1].length) - original_output.length
				asetniop.current_word = replacement[1]
				asetniop.autocorrect_tripped = true
			}
		}
	}
	
	if(asetniop.trailing_space){
		//close off word and run autocorrect check
		if(asetniop.autocorrect_state && asetniop.prediction_iteration < 0){
			
			replacement = word_autocorrect(asetniop.current_word)
			if(replacement[0]){
				//replace these with corrections
				processed_output = replacement[1]
				backtrack = replacement[1].length + (asetniop.current_word.length - replacement[1].length) - original_output.length
			}
		}
		processed_output += " "
		backtrack += 0
		original_output += " "
		
		if(processed_output == " " && asetniop.predictive == true){
			actuate_prediction(0)
			backtrack = 0
		}
		
		punctuation_string = " , < . > ? / ! | ; : ' \" - _ ( ) [ ] { } Â¿ Â¡ "
		if(processed_output.length == 2 && punctuation_string.indexOf(processed_output) > -1 && asetniop.predictive == true && asetniop.prediction_iteration > -1){
			actuate_prediction(1)
			backtrack = 0
		}
		
		
		reset_word_states()
	}
	
	//special situations; unshift after space
	if(original_output == " " && asetniop.shift == 1){
		asetniop.shift_no_reset = true
		reset_shift()
	}
	
	//special situation; punctuation after prediction has been selected
	punctuation_string = ",<.>?/!|;:'\"-_()[]{}Â¿Â¡"
	if(processed_output.length == 1 && punctuation_string.indexOf(processed_output) > -1 && asetniop.predictive == true && asetniop.prediction_iteration > -1){
		actuate_prediction(1)
		backtrack = 0
		reset_word_states()
	}
	
	
	
	//SEND PROCESSED OUTPUT TO SCREEN
	for(var i=0; i<backtrack; i++){
		if(!asetniop.autocorrect_tripped){
			backspace_actions()
		}
		visual_add_keystroke('backspace')
	}
	
	for(var i=0; i<processed_output.length; i++){
		visual_add_keystroke(processed_output[i])
	}
	visual_update_cursor(false) //resets cursor
	
	//GENERATE PREDICTIONS
	predictive_generation(processed_output.length)
	
	
}

function actuate_prediction(correction){
	if(!settings.accent_inline && asetniop.prediction_iteration > -1){
		word = asetniop.predictive_output[asetniop.prediction_iteration]
		backtrack = asetniop.current_word.length - correction
				
		for(var i=0; i<backtrack; i++){
			backspace_actions()
			visual_add_keystroke('backspace')
		}
		for(var i=0; i<word.length; i++){
			visual_add_keystroke(word[i])
		}
	}
	//otherwise does nothing
}


function predictive_generation(proceed){
	
	if(!settings.predictive){
		return false
	}
	//COMPLEX AUTOFILL 
	if(proceed > 0){
		if(wordcheck(asetniop.current_word, true)){
					
			//NOTE THAT IN ANDROID/JAVA VERSION CAPS VERSION ARE FILTERED OUT IF FIRST LETTER IS NOT SHIFTED		
					
			//clear previous
			asetniop.prediction_iteration = -1;
			visual_update_prediction(true, [])
			asetniop.predictive = false
			
			if(asetniop.current_word.length >= settings.predictive_length){
				//turns on predictive (if applicable), generates suggestions, fills
				asetniop.predictive = true
				
				if(asetniop.predictive){
					//determine if front of word contains punctuation, update current_word to remove
					//HOW TO MAKE SURE IT DOESN'T DISRUPT AUTOCORRECT?

					predictive_word = asetniop.current_word
					first_letter = predictive_word[0].toLowerCase()
					test_first_letter = first_letter.replace(/[^a-z]$/g,'')
					if(first_letter != test_first_letter){
						predictive_word = predictive_word.slice(1,predictive_word.length)
						asetniop.current_word = predictive_word
						asetniop.shift_status = asetniop.shift_status.slice(1,asetniop.shift_status.length)
						//trim key groups
						sliced_key_groups = []
						for(j = 1; j < asetniop.key_groups.length; j++){
							sliced_key_groups[j-1] = asetniop.key_groups[j]
						}
						asetniop.key_groups = []
						asetniop.key_groups = sliced_key_groups
						
						asetniop.text_groups = asetniop.text_groups.slice(1,asetniop.text_groups.length)
					}
					
					if(asetniop.snapdic[predictive_word.toLowerCase()]){
						//no need to sort as it's already been done
						asetniop.basechoicearray = asetniop.snapdic[predictive_word.toLowerCase()]
					}
					else if(predictive_word.length > 0){
						predictive_object = get_partial_object(predictive_word.toLowerCase())
						asetniop.basechoicearray = []
						purePriority(predictive_object, asetniop.current_word.toLowerCase())
						asetniop.basechoicearray = asetniop.basechoicearray.sort(function(x,y) { return y[1] - x[1] });
					}
					
					asetniop.predictive_output = []
					asetniop.predictive_base = []
					filled = 0;
					current_word_compare = asetniop.current_word.toLowerCase()
					
					//only allow words with one less if remaining letter is NOT one of asetniop (i.e. a chord)
					
					for(k = 0; k < asetniop.basechoicearray.length; k++){
						
						base_word = asetniop.basechoicearray[k][0]
						true_word = asetniop.basechoicearray[k][3]
						fill_proceed = true
						
						if(filled >= settings.num_predictions){
							fill_proceed = false
							}
						else if(true_word == current_word_compare){
							//console.log(true_word + ' same word')
							fill_proceed = false
							}
						else if(settings.accent_inline && base_word.length != current_word_compare.length){
							//bail if accent_inline is active and predicted word is not the same length
							fill_proceed = false
						}
						else if(true_word.length == current_word_compare.length+1 && 'asetniop'.indexOf(true_word[true_word.length-1]) > -1 && true_word == asetniop.basechoicearray[k][0] )
						{
							//console.log(true_word + ' rejected cause last letter asetniop')
							fill_proceed = false
							}
						
						if(fill_proceed){
							
							shift_array = []
							
							for(j = 0; j < true_word.length; j++){
								if(j < asetniop.current_word.length && !asetniop.basechoicearray[k][4]){
									shift_array[j] = asetniop.shift_status[j]
								}
								else if(asetniop.basechoicearray[k][4] && j == 0){
									if(asetniop.shift == 2){
										shift_array[j] = 2
									}
									else{
										shift_array[j] = 1
									}
								}
								else{
									if(asetniop.shift == 2){
										shift_array[j] = 2
									}
									else{
										shift_array[j] = 0
									}
								}
							}
							
							output_word = recapitalize(true_word, shift_array)
							asetniop.predictive_output[filled] = output_word
							asetniop.predictive_base[filled] = base_word //deals with ligatures and stuff
							filled += 1
						}
					}
					asetniop.num_active_predictions = filled;
					visual_update_prediction(false, asetniop.predictive_output)
						
				}
			}
		}
		else{
			//clears choices in case input word not found
			asetniop.prediction_iteration = -1;
			asetniop.predictive_output = []
			asetniop.predictive_base = []
			asetniop.num_active_predictions = 0
			visual_update_prediction(true)
		}
	}
	
}


function backspace_autocorrect(input){
	
	if(!asetniop.autocorrect_state){
		return [false]
	}
	
	new_input = ""
	new_shift = []
	for(i = 0; i < asetniop.key_sequence.length; i++){
		if(asetniop.shift == 0){ // regular
			new_input += asetniop.active_keymap[Math.pow(2,asetniop.key_sequence[i])].base
			new_shift.push(asetniop.shift)
		}
		else if(asetniop.shift == 1){ // shift
			new_input += asetniop.active_keymap[Math.pow(2,asetniop.key_sequence[i])].baseshift
			new_shift.push(asetniop.shift)
			reset_shift()
		}
		else if(asetniop.shift == 2){ // caps lock - ignores punctuation
			new_input += asetniop.active_keymap[Math.pow(2,asetniop.key_sequence[i])].baseshift
			new_shift.push(asetniop.shift)
		}
	}	
	
	input += new_input
	if(wordcheck(input,true)){
		//correct for special 'pt' case at the beginning of a word.
		if(input == 'pt'){
			return [false]
		}
		else{
			return [true, new_input, new_shift]
		}
	}
	else{
		return [false]
	}
	
}

function partial_autocorrect(input){
	input = input.toLowerCase();
	if(input.length < 2 || wordcheck(input, true)){ //won't look at a one-letter entry; does nothing if word is valid as typed
		return [false, ""]
	}
	else{
		protoword = input.substring(0, input.length - 1);
		terminal_punctuation = input.replace(/[^a-z]$/g,'') //remove last character if punctuation
		
		if(asetniop.key_groups[asetniop.key_groups.length-1].length == 1 && wordcheck(protoword, true) && protoword == protoword.replace(/[^a-z]/g,'_')){
			//console.log('protoword is okay AND last letter is single key AND protoword contains no punctuation - bailing')
			return [false, ""]
		}
		else if(input != terminal_punctuation){
			//console.log('last character is punctuation; will not try to autocorrect')
			return [false, ""]
		}
		
		else{
			potential_replacements = []
			//check for step-on mistakes - same as word_autocorrect except for obtaining word count
			for(i = 0; i < asetniop.key_groups.length; i++){
				if(asetniop.key_groups[i].length == 2){
					//rebuild word using split of group
					replacement_word = ""
					replacement_key_groups = []
					replacement_text_groups = []
					replacement_shift_status = []
					progress_counter = 0
					
					for(j = 0; j < asetniop.key_groups.length; j++){
						if(j == i){
							//split it
							for(k = 0; k < asetniop.key_groups[i].length; k++){
								replacement_text = asetniop.active_keymap[Math.pow(2,asetniop.key_groups[i][k])].base
								replacement_word += replacement_text
								replacement_key_groups.push([asetniop.key_groups[i][k]])
								replacement_text_groups.push(replacement_text)
								if(asetniop.shift_status[progress_counter] == 1 && k != 0){ //if first letter is capitalized and is being split, second letter will be lower-case
									replacement_shift_status.push(0)
								}
								else{
									replacement_shift_status.push(asetniop.shift_status[progress_counter])
								}
							}
							progress_counter += 1;
						}
						else{
							//original letter(s)
							replacement_word += asetniop.text_groups[j]
							replacement_key_groups.push(asetniop.key_groups[j])
							replacement_text_groups.push(asetniop.text_groups[j])
							for(m = 0; m < asetniop.text_groups[j].length; m++){
								replacement_shift_status.push(asetniop.shift_status[progress_counter])
								progress_counter += 1;
							}
						}
					}
					replacement_word = replacement_word.toLowerCase();
					if(wordcheck(replacement_word, true)){
						activeobject = get_partial_object(replacement_word)
						asetniop.originalcount = 0
						asetniop.runningword = replacement_word
						partialPriority(activeobject);
						
						potential_replacements.push([replacement_word, asetniop.originalcount, replacement_key_groups, replacement_text_groups, replacement_shift_status])
					}
				}
			}
			
			//check for fragmented chords
			for(i = 0; i < asetniop.key_groups.length-1; i++){
				if(asetniop.key_groups[i].length == 1 && asetniop.key_groups[i+1].length == 1 && asetniop.key_groups[i][0] != asetniop.key_groups[i+1][0]){
					replacement_word = ""
					replacement_key_groups = []
					replacement_text_groups = []
					replacement_shift_status = []
					progress_counter = 0;
					
					for(j = 0; j < asetniop.key_groups.length; j++){
						if(j == i){
							//combine them and skip next letter
							replacement_text = asetniop.active_keymap[Math.pow(2,asetniop.key_groups[j][0]) + Math.pow(2,asetniop.key_groups[j+1][0])].base
							replacement_word += replacement_text
							replacement_key_groups.push([asetniop.key_groups[j][0], asetniop.key_groups[j+1][0]])
							replacement_text_groups.push(replacement_text)
							replacement_shift_status.push(asetniop.shift_status[progress_counter])
							progress_counter += 2;
							j++
						}
						else{
							//original letter(s)
							replacement_word += asetniop.text_groups[j]
							replacement_key_groups.push(asetniop.key_groups[j])
							replacement_text_groups.push(asetniop.text_groups[j])
							for(m = 0; m < asetniop.text_groups[j].length; m++){
								replacement_shift_status.push(asetniop.shift_status[progress_counter])
								progress_counter += 1;
							}
						}
					}
					replacement_word = replacement_word.toLowerCase();
					if(wordcheck(replacement_word, true)){			
						activeobject = get_partial_object(replacement_word)
						asetniop.originalcount = 0
						asetniop.runningword = replacement_word
						partialPriority(activeobject);
						potential_replacements.push([replacement_word, asetniop.originalcount, replacement_key_groups, replacement_text_groups, replacement_shift_status])
					}
				}
			}
			
			//check for incorrect partials
			for(i = 0; i < asetniop.key_groups.length; i++){
				if(asetniop.key_groups[i].length > 2){
					replacement_prefix = ""
					replacement_middles = []
					replacement_suffix = ""
					
					replacement_prefix_text_groups = []
					replacement_suffix_text_groups = []
					
					replacement_prefix_shift_status = []
					replacement_middle_shift_status = []
					replacement_suffix_shift_status = []
					
					progress_counter = 0;
					
					//no need to reconstruct key groups or shift_status, because they won't be changed
									
					for(j = 0; j < asetniop.key_groups.length; j++){
						if(j < i){ //front part of word
							replacement_prefix += asetniop.text_groups[j]	
							replacement_prefix_text_groups.push(asetniop.text_groups[j])
							for(m = 0; m < asetniop.text_groups[j].length; m++){
								replacement_prefix_shift_status.push(asetniop.shift_status[progress_counter])
								progress_counter += 1;
							}
							
						}
						else if(j == i){ //potential replacement text - builds arrays of ALL partials and ALL words
							lookup_value = binary_calculator(asetniop.key_groups[j])
							replacement_middles.push(asetniop.active_keymap[lookup_value].lp)
							replacement_middles.push(asetniop.active_keymap[lookup_value].rp)
							for(m = 0; m < asetniop.text_groups[j].length; m++){
								replacement_middle_shift_status.push(asetniop.shift_status[progress_counter])
								progress_counter += 1;
							}
						}
						else if(j > i){ // back part of word
							replacement_suffix += asetniop.text_groups[j]
							replacement_suffix_text_groups.push(asetniop.text_groups[j])
							for(m = 0; m < asetniop.text_groups[j].length; m++){
								replacement_suffix_shift_status.push(asetniop.shift_status[progress_counter])
								progress_counter += 1;
							}
						}
					}
					
					//build and test potential words
					for(j = 0; j < replacement_middles.length; j++){
						for(k = 0; k < replacement_middles[j].length; k++){
							replacement_word = replacement_prefix + replacement_middles[j][k] + replacement_suffix
							replacement_word = replacement_word.toLowerCase();
							if(wordcheck(replacement_word, true)){
								replacement_text_groups = replacement_prefix_text_groups.concat([replacement_middles[j][k]],replacement_suffix_text_groups)
								activeobject = get_partial_object(replacement_word)
								asetniop.originalcount = 0
								asetniop.runningword = replacement_word
								partialPriority(activeobject);
								
								new_replacement_middle_shift_status = []
														
								for(m = 0; m < replacement_middles[j][k].length; m++){
									if(m < replacement_middle_shift_status.length){
										new_replacement_middle_shift_status.push(replacement_middle_shift_status[m])
									}
									else{
										if(replacement_middle_shift_status[0] == 2){
											new_replacement_middle_shift_status.push(2)
										}
										else{
											new_replacement_middle_shift_status.push(0)
										}
									}
								}
								
								replacement_shift_status = replacement_prefix_shift_status.concat(new_replacement_middle_shift_status,replacement_suffix_shift_status)

								potential_replacements.push([replacement_word, asetniop.originalcount, asetniop.key_groups, replacement_text_groups, replacement_shift_status])
							}
						}
					}
				}
			}
			
			//correct for shift status of new word
			if(potential_replacements.length == 0){
				return [false, ""]
			}
			
			else{
				potential_replacements = potential_replacements.sort(function(x,y) { return y[1] - x[1] });
				
				//update key groups
				asetniop.key_groups = potential_replacements[0][2]
				asetniop.text_groups = potential_replacements[0][3]
				asetniop.shift_status = potential_replacements[0][4]
				
				final_replacement_word = recapitalize(potential_replacements[0][0], potential_replacements[0][4])
				return [true, final_replacement_word, potential_replacements[0][4]]
			}
		}
		
	}
	
}

function recapitalize(word, shift_array){
	output = ""
	for(i = 0; i < word.length; i++){
		text_group = word[i]
		if(shift_array[i] == 0){
			output += text_group.toLowerCase()
		}
		else if(shift_array[i] == 1){
			output += text_group.charAt(0).toUpperCase() + text_group.slice(1);
		}
		else if(shift_array[i] == 2){
			output += text_group.toUpperCase()
		}
	}
	return output
}

function word_autocorrect(input){ 
	input = input.toLowerCase();
	//OPERATES INDEPENDENTLY OF PROCESSED OUTPUT
		
	if(!wordcheck(input) || (wordcount(input)/asetniop.totalwordcount < settings.one_group_cutoff && (asetniop.key_groups.length == 1 || (asetniop.key_groups.length == 2 && /[^a-z]/.test(input[input.length-1]))))){
		potential_replacements = []
		
		
		//determine potential alternates - CHECKS FOR ONE MISTAKE ONLY
		//probably possible to combine all these loops
		
		//check for step-on mistakes
		for(i = 0; i < asetniop.key_groups.length; i++){
			if(asetniop.key_groups[i].length == 2){
				//rebuild word using split of group
				replacement_word = ""
				replacement_text_groups = []
				replacement_shift_status = []
				progress_counter = 0;
				for(j = 0; j < asetniop.key_groups.length; j++){
					if(j == i){
						//split it
						for(k = 0; k < asetniop.key_groups[i].length; k++){
							replacement_text = asetniop.active_keymap[Math.pow(2,asetniop.key_groups[i][k])].base
							replacement_word += replacement_text
							replacement_text_groups.push(replacement_text)
							if(asetniop.shift_status[progress_counter] == 1 && k != 0){ //if first letter is capitalized and is being split, second letter will be lower-case
								replacement_shift_status.push(0)
							}
							else{
								replacement_shift_status.push(asetniop.shift_status[progress_counter])
							}
						}
						progress_counter += 1;
					}
					else{
						//original letter(s)
						replacement_word += asetniop.text_groups[j]
						replacement_text_groups.push(asetniop.text_groups[j])
						for(m = 0; m < asetniop.text_groups[j].length; m++){
							replacement_shift_status.push(asetniop.shift_status[progress_counter])
							progress_counter += 1;
						}
					}
				}
				if(wordcheck(replacement_word)){
					potential_replacements.push([replacement_word, wordcount(replacement_word), replacement_text_groups, replacement_shift_status])
				}
			}
		}
		//check for fragmented chords
		for(i = 0; i < asetniop.key_groups.length-1; i++){
			if(asetniop.key_groups[i].length == 1 && asetniop.key_groups[i+1].length == 1 && asetniop.key_groups[i][0] != asetniop.key_groups[i+1][0]){
				replacement_word = ""
				replacement_text_groups = []
				replacement_shift_status = []
				progress_counter = 0;
				for(j = 0; j < asetniop.key_groups.length; j++){
					if(j == i){
						//combine them and skip next letter
						replacement_text = asetniop.active_keymap[Math.pow(2,asetniop.key_groups[j][0]) + Math.pow(2,asetniop.key_groups[j+1][0])].base
						replacement_word += replacement_text
						replacement_text_groups.push(replacement_text)
						replacement_shift_status.push(asetniop.shift_status[progress_counter])
						progress_counter += 1;
						j++
					}
					else{
						//original letter(s)
						replacement_word += asetniop.text_groups[j]
						replacement_text_groups.push(asetniop.text_groups[j])
						for(m = 0; m < asetniop.text_groups[j].length; m++){
							replacement_shift_status.push(asetniop.shift_status[progress_counter])
							progress_counter += 1;
						}
					}
				}
				if(wordcheck(replacement_word)){
					potential_replacements.push([replacement_word, wordcount(replacement_word), replacement_text_groups, replacement_shift_status])
				}
			}
		}
		
		//check for incorrect partials
		word_bonus = 1
		if(asetniop.key_groups.length == 1){
			word_bonus = 1 //doesn't do anything at the moment
		}
		
		
		for(i = 0; i < asetniop.key_groups.length; i++){
			if(asetniop.key_groups[i].length > 2){
				replacement_prefix = ""
				replacement_middles = []
				replacement_bonuses = []
				replacement_suffix = ""
				
				replacement_prefix_text_groups = []
				replacement_suffix_text_groups = []
					
				replacement_prefix_shift_status = []
				replacement_middle_shift_status = []
				replacement_suffix_shift_status = []
				
				progress_counter = 0
				
				//set up preferences depending on which key was pressed first
				left_bonus = 1
				right_bonus = 1
				if(asetniop.key_groups[i][0] < 4){
					left_bonus = settings.left_bonus
				}
				else if(asetniop.key_groups[i][0] >= 4){
					right_bonus = settings.right_bonus
				}
				for(j = 0; j < asetniop.key_groups.length; j++){
					if(j < i){ //front part of word
						replacement_prefix += asetniop.text_groups[j]	
						replacement_prefix_text_groups.push(asetniop.text_groups[j])
						for(m = 0; m < asetniop.text_groups[j].length; m++){
							replacement_prefix_shift_status.push(asetniop.shift_status[progress_counter])
							progress_counter += 1;
						}	
					}
					else if(j == i){ //potential replacement text - builds arrays of ALL partials and ALL words
						lookup_value = binary_calculator(asetniop.key_groups[j])
						
							replacement_middles.push(asetniop.active_keymap[lookup_value].lp)
							replacement_bonuses.push(left_bonus)
							
							replacement_middles.push(asetniop.active_keymap[lookup_value].rp)
							replacement_bonuses.push(right_bonus)
							
							if(asetniop.active_keymap[lookup_value].tlw){
								replacement_middles.push([asetniop.active_keymap[lookup_value].tlw[0]])
								replacement_bonuses.push(left_bonus*word_bonus)
							}
							if(asetniop.active_keymap[lookup_value].trw){
								replacement_middles.push([asetniop.active_keymap[lookup_value].trw[0]])
								replacement_bonuses.push(right_bonus*word_bonus)
							}
							
							for(m = 0; m < asetniop.text_groups[j].length; m++){
								replacement_middle_shift_status.push(asetniop.shift_status[progress_counter])
								progress_counter += 1;
							}	
					}
					else if(j > i){ // back part of word
						replacement_suffix += asetniop.text_groups[j]
						replacement_suffix_text_groups.push(asetniop.text_groups[j])
						for(m = 0; m < asetniop.text_groups[j].length; m++){
							replacement_suffix_shift_status.push(asetniop.shift_status[progress_counter])
							progress_counter += 1;
						}
					}
				}
							
				//build and test potential words
				for(j = 0; j < replacement_middles.length; j++){
					for(k = 0; k < replacement_middles[j].length; k++){
						replacement_word = replacement_prefix + replacement_middles[j][k] + replacement_suffix
						if(wordcheck(replacement_word)){
							replacement_text_groups = replacement_prefix_text_groups.concat([replacement_middles[j][k]],replacement_suffix_text_groups)
							
							new_replacement_middle_shift_status = []
													
							for(m = 0; m < replacement_middles[j][k].length; m++){
								if(m < replacement_middle_shift_status.length){
									new_replacement_middle_shift_status.push(replacement_middle_shift_status[m])
								}
								else{
									if(replacement_middle_shift_status[0] == 2){
										new_replacement_middle_shift_status.push(2)
									}
									else{
										new_replacement_middle_shift_status.push(0)
									}
								}
							}
							
							replacement_shift_status = replacement_prefix_shift_status.concat(new_replacement_middle_shift_status,replacement_suffix_shift_status)
														
							potential_replacements.push([replacement_word, wordcount(replacement_word)*replacement_bonuses[j], replacement_text_groups, replacement_shift_status])
						}
					}
				}
			
				
			}
		}
		if(potential_replacements.length == 0){
			return [false, ""]
		}
		else{
			potential_replacements = potential_replacements.sort(function(x,y) { return y[1] - x[1] });
			if(input == potential_replacements[0][2]){
				return false;
			}
			else{
				final_replacement_word = recapitalize(potential_replacements[0][0], potential_replacements[0][3])
				return [true, final_replacement_word, potential_replacements[0][3]]
			}
		}
		
	}
	else{
		return [false,""]
		//console.log('looking fine')
	}
	
	asetniop.current_word = ""
	
}


function binary_calculator(array){
	value = 0
	for(x = 0; x < array.length; x++){
		value += Math.pow(2,array[x])
	}
	return value
}

function get_partial_object(word){
	word = word.replace(/[^a-z]/g,'_')
	
	evalword = "asetniop.prioritydic"
	for(var x = 0; x < word.length; x++){
		evalword += "." + word[x];
	}
	activeobject = eval(evalword);
	return activeobject
}

function partialPriority(object) {
    for (var property in object) {
        if (object.hasOwnProperty(property)) {
            if (typeof object[property] == "object"){
				if(property != 'aa'){
					asetniop.runningword += property;
					partialPriority(object[property]);
					asetniop.runningword = asetniop.runningword.substring(0,asetniop.runningword.length-1); //back up and erase new addition from running word
				}
				else{
					//include original suggestion
					alternatearray = object['aa']
					for (var j = 0; j < alternatearray.length; j++){
						asetniop.originalcount += alternatearray[j][1]
					}
				}
            }else if(property == 'nn'){
				if(object.pp){
					asetniop.originalcount += object['nn']
				}
				else{
					asetniop.originalcount += object['nn']
				}
            }
        }
    }
}

function purePriority(object, runningword) {
	accent_bonus = 1;
    for (var property in object) {
        if (object.hasOwnProperty(property)) {
            if (typeof object[property] == "object"){
				if(property != 'aa'){
					runningword += property;
					purePriority(object[property], runningword);
					runningword = runningword.substring(0,runningword.length-1); //back up and erase new addition from running word
				}
				else{
					//include original suggestion
					alternatearray = object['aa']
					caps = false
					if(object.cc){caps = true}
					for (var j = 0; j < alternatearray.length; j++){
						if(runningword == asetniop.current_word.toLowerCase()){
							accent_bonus = 1000;
						}
						asetniop.basechoicearray.push([runningword,alternatearray[j][1]*accent_bonus,'a',alternatearray[j][0], caps]);
					}
				}
            }else if(property == 'nn'){
                //found a property which is not an object - push base word and check for pure form later
				caps = false
				if(object.cc){caps = true}
				if(object.pp){
					if(runningword == asetniop.current_word.toLowerCase()){
						accent_bonus = 1000;
					}
					asetniop.basechoicearray.push([runningword,object['nn']*accent_bonus,'a',object['pp'],caps]);
				}
				else{
					asetniop.basechoicearray.push([runningword,object['nn'],'a',runningword, caps]);
				}
            }
        }
    }
}
//need to compare original punctuation so words like "backspa" don't get converted to "back(a" because "back-and-forth" is viable 

function wordcheck(word, partial){ //check if word exists in dictionary matrix
	word = word.toLowerCase();
	//trim any preceding apostrophes or quotation marks - add upside-down ! and ? for other languages
	word = word.replace(/^['"(Â¿Â¡]/,"")
	//trim any trailing punctuation (can't know if it's an issue to end of word)
	closer_word = word
	word = word.replace(/[^a-z]$/g,'')
	
	if(partial && closer_word != word){ //will not add punctuation to end of partial words
		return false
	}
	
	original_word = word;
	//convert all non alphanumerics to "_"
	word = word.replace(/[^a-z]/g,'_')
	
	letterarray = word.split("");
	numletters = letterarray.length;
	
	evalexpression = 'asetniop.prioritydic';
	for(y = 0; y < numletters; y++){
		evalexpression = evalexpression + '.' + letterarray[y];
		//breaks loop if it finds a mistake
		if(!eval(evalexpression)){
			break
		}
	}
	if(eval(evalexpression)){
		if(word == original_word){	//no special characters	
			if(partial){
				//console.log('check-partialOK')
				return true
			}
			else if(eval(evalexpression + ".nn")){
				//console.log('check-wordOK')
				return true
			}
			else{
				//console.log('check-word-problem')
				return false
			}
		}
		else{ // make sure special characters match up with potential options
			object = eval(evalexpression)
			asetniop.basechoicearray = []
			purePriority(object, word)
			for(z = 0; z < asetniop.basechoicearray.length; z++){
				if(asetniop.basechoicearray[z][3].indexOf(original_word) > -1){
					return true //if it finds one that works
				}
				
			}
			return false //if it doesn't find a valid match
		}
		
	}
	else{
		//console.log('check-partial-problem')
		return false
	}
}

function wordcount(word){
	word = word.toLowerCase();
	
	//trim any preceding apostrophes or quotation marks - add upside-down ! and ? for other languages
	word = word.replace(/^['"(]/,"")
	
	//trim any trailing punctuation (can't know if it's an issue to end of word)
	word = word.replace(/[^a-z]$/g,'')
	
	//convert all non alphanumerics to "_"	
	word = word.replace(/[^a-z]/g,'_')
	
	letterarray = word.split("");
	numletters = letterarray.length;
	evalexpression = 'asetniop.prioritydic';
	for(y = 0; y < numletters+1; y++){
		if(y == numletters){
			evalexpression = evalexpression + ".nn"
		}
		else{
			evalexpression = evalexpression + '.' + letterarray[y];
		}
	}
	count = eval(evalexpression)
	return count
}




