////////////////////////////////////////////////////////////////////////////////////////////
// File name	: nipTest.dbj
// Author		: TechnoHunter
// Purpose		: Test nip file(s) for correct functioning (grab and keep items that you want)
// File location: scripts\tools
////////////////////////////////////////////////////////////////////////////////////////////
// Methods of use : 
//     1) open default.dbj, add the following line -> load("tools/nipTest.dbj");
//        -> save/exit file start D2 manually and use d2bs.exe to attach
//     3) while in a bot game type .stop in the message box (hit enter to open message box)
//        when bot stops, type .flush to flush the existing script cache, then type .exec 
//        load("tools/nipTest.dbj"); (hit enter after each typed command, this will load nipTest.dbj manually)
////////////////////////////////////////////////////////////////////////////////////////////
// Directions : Edit nip files listed below to reflect YOUR nip files (configured for the Standard nip files by default)
// With scrip running the following keys will work
// F12 = Tests all items (inv, equiped and stash) against loaded nip files, output to both screen and file
// F11 = Stops the script
// F10 = Test a Single item with njip(item under cursor)
// F9  = hover your mouse over an item(anywhere, ground included) press F9 and stats for that item will show on 
//       screen and into a ItemStatDump file.


/**
 * @desc load the nj Item Parser engine
 */
include("njip.dbl");


/**
 * @desc Tell item parser engine what nip files to test with
 */
njipOpenFile("settings/potions.nip");
njipOpenFile("settings/runes.nip");
njipOpenFile("settings/gems.nip");
njipOpenFile("settings/ringsamulets.nip");
njipOpenFile("settings/charmsjewels.nip");
njipOpenFile("settings/magics.nip");
njipOpenFile("settings/rares.nip");
njipOpenFile("settings/uniques.nip");
njipOpenFile("settings/sets.nip");
njipOpenFile("settings/whites.nip");
njipOpenFile("settings/moneymaker.nip");

/**
 * @desc loop trigger to stop the script
 * @name shouldRun
 */
var shouldRun = true;

/**
 * @desc array of colored result values for printing on screen
 * @name screenResults
 */
var screenResults = ["ÿc9Maybeÿc0", "ÿc1Discardÿc0", "ÿc2Keepÿc0"];

/**
 * @desc array of non-colored result values for printing in file
 * @name results
 */
var results = ["Maybe", "Discard", "Keep"];

/**
 * @desc array of items to skip testing, useless/common/non-tracked items
 * @name SkipItems
 */
var SkipItems = new Array();
// Array of items to be ignored
SkipItems[587] =  1; // healing potions
SkipItems[588] =  2; // healing potions
SkipItems[589] =  3; // healing potions
SkipItems[590] =  4; // healing potions
SkipItems[591] =  5; // healing potions
SkipItems[592] =  6; // mana potions
SkipItems[593] =  7; // mana potions
SkipItems[594] =  8; // mana potions
SkipItems[595] =  9; // mana potions
SkipItems[596] = 10; // mana potions
SkipItems[515] = 11; // rejuv
SkipItems[516] = 12; // rejuv
SkipItems[526] = 13; // Arrows quiver
SkipItems[528] = 14; // Bolts quiver
SkipItems[543] = 15; // Keys
SkipItems[549] = 16; // Horadric Cube
SkipItems[518] = 17; // Tome of Town Portal
SkipItems[519] = 18; // Tome of Identify
SkipItems[529] = 19; // Scroll of Town Portal
SkipItems[530] = 20; // Scroll of Identify
SkipItems[514] = 21; // Antidote potion
SkipItems[513] = 22; // Stamina potion
SkipItems[517] = 23; // Thawing potion
SkipItems[80]  = 24; // Rancid Gas Pot
SkipItems[81]  = 25; // Oil Potion
SkipItems[82]  = 26; // Choking Gas Pot
SkipItems[83]  = 27; // Exploding Pot
SkipItems[84]  = 28; // Strangling Gas
SkipItems[85]  = 29; // Fulminating Pot


/**
 * @function
 * @desc Utility function, designed to return a cleaned full name for the item.fname being passed
 * @param {String} full name of item to clean
 * @returns {String} Cleaned full name string of the item being passed
 */
function ImproveFName(checkString) {
	var where, undef = null;
	// cutting 4 letters when finding a "["
	while ((where = checkString.indexOf("[")) != -1) 
		checkString = checkString.substring(0,where) + checkString.substring(where+4);
	// cutting CRLFs and rearanging the name (Tshako Harle --> Harle Tshako)
	while ((where = checkString.indexOf("\x0A")) != -1) 
		checkString = checkString.substring(where+1) + " " + checkString.substring(0,where);
	// changing double spaces to single spaces
	while ((where = checkString.indexOf("  ")) != -1) 
		checkString = checkString.substring(0,where) + checkString.substring(where+1);
	// cutting spaces at the end of the string
	while (checkString.substring(checkString.length-1) == " ") 
		checkString = checkString.substring(0,checkString.length-1);
	// cutting leading spaces
	while (checkString.substring(0,1) == " ") 
		checkString = checkString.substring(1);
	// clear all "undefined"
	while ((undef = checkString.indexOf("undefined")) != -1)
		checkString = checkString.substring(0,undef) + checkString.substring(undef+9);
	// remove color codes and return the result
	return checkString.replace(/ÿc(.)/g, "");
}

/*
function statidToName(id, value) { 
	return getLocaleString(getBaseStat(7, id, (value >= 0 ? "descstrpos" : "descstrneg"))); 
} 
	
	for each(var item in me.getItems()) 
	for(var i = 0; i < 358; i++) 
	print(statidToName(i, item.getStat(i)) + ' = ' + item.getStat(i));
*/

/**
 * @function
 * @desc Check all items currently in your possesion against loaded nip files, outputs to both screen and file
 * @param none
 * @returns none
 */
function traverse_items() {
	print("ÿc3===========================================================");
	delay(500);
	var outputFile = File.open("output/" + (me.account ? me.account : "SINGLEPLAYER") + "-" + me.name + "-nipTest.htm", FILE_WRITE);
	if(outputFile){
		print("outfile created");
		outputFile.write("<HTML><HEAD><TITLE>" + (me.account ? me.account : "SINGLEPLAYER") + " - " + me.name + " - Nip file(s) test results" + "</TITLE></HEAD><BODY TEXT=BLACK>\n");
	}
	var _items = me.getItems();
	if(_items.length){
		var i = 0;
		do {
			if(!_items[i].getFlag(0x8)) { 
				if(!(_items[i].classid in SkipItems)) {
					var report = njipCheckGoodItem( _items[i], NJIP_CHECK_REPORT );
					print("njipCheckGoodItem() Results for " + ImproveFName(_items[i].fname) + ": " + screenResults[report.result+1] + ( report.result ? " (line #" + report.lineno + " of '" + report.file + "')" : " (No Item Match in Files!)" ) );
					if(outputFile){
						outputFile.write("njipCheckGoodItem() Results for " + ImproveFName(_items[i].fname) + ": " + String(results[report.result+1]).replace(/ÿc(.)/g, "") + ( report.result ? " (line #" + report.lineno + " of '" + report.file + "')" : " (No Item Match in Files!)" ) + "<br>\n");
					}
					delay(500);
				}
				delay(20);
			}
			i++
		} while(i < _items.length);
	}
	if(outputFile){
		outputFile.write("<BR><CENTER>* Nip file test results created by nipTest.dbj *</CENTER></BODY></HTML><br>\n");
		outputFile.close();
	}
	print("ÿc3===========================================================");
}

/**
 * @function
 * @desc Dumps a complete statlist for the item currently hovered over, to both screen and file
 * @param {Bool} dumpType = true is getStat(-2), false = getStat(-1)
 * @returns none
 */
function dumpItemStats(dumpType){
	var unit = getUnit(101); // item hovered over
	var statType = dumpType ? -2 : -1;
	if(unit && unit.type == 4) {
		var statFile = File.open("output/" + me.name + "-ItemStatDump.htm", FILE_APPEND);
		if(statFile){
			statFile.write("<HTML><HEAD><TITLE>" + (me.account ? me.account : "SINGLEPLAYER") + " - " + me.name + "'s Item Stat Dump File" + "</TITLE></HEAD><BODY TEXT=BLACK>\n");
			statFile.write("===========================================================<br>\n");
			statFile.write("Outputting stats for item -> " + ImproveFName(unit.fname) + " using getStat(" + statType + ")<br>\n");
		}
		print("ÿc3===========================================================");
		print("Outputting stats for item -> " + ImproveFName(unit.fname) + " using getStat(" + statType + ")");
		var statList = unit.getStat(statType);
		if(statList) {
			for( var stat in statList ) {
				for( var substat in statList[stat] ) {
					var statLine = "Stat: [" + stat + ((substat!=0) ? (":" + substat) : "") + "] - Value: " + statList[stat][substat];
					print(statLine);
					if(statFile){
						statFile.write( statLine + "<br>" + "\n");
						delay(50);
					}
				}
			}
		}
		print("ÿc3===========================================================");
		if(statFile){
			statFile.write("===========================================================<br>\n");
			statFile.close();
		}
	}
}

/**
 * @function
 * @desc Tests a single item being hovered over by the mouse (exception :: potions in a belt)
 * @param none
 * @returns none
 */

function nipTestSingle(){
	var unit = getUnit(101);
	if(unit && unit.type == 4) {
		if(!(unit.classid in SkipItems)) {
			var report = njipCheckGoodItem( unit, NJIP_CHECK_REPORT );
			print("njipCheckGoodItem() Results for " + ImproveFName(unit.fname) + ": " + screenResults[report.result+1] + ( report.result ? " (line #" + report.lineno + " of '" + report.file + "')" : " (No Item Match in Files!)" ) );
		}
	}
}

/**
 * @function
 * @desc Handles key events passed by the core
 * @param {Int} value of the key pressed/released
 */
function keyUpHandler(key){
	switch(key){
		case 119:// f8 key to test while using debugger (f12 causes break in vis studio)
			dumpItemStats(true);
			break;
		case 120: 
			dumpItemStats(false);
			break;
		case 121: 
			nipTestSingle();
			break;
		case 122: 
			print("ALLSTOP!");
			shouldRun = false;
			break;
		case 123:
			traverse_items();
			break;
	}
}

/**
 * @function
 * @desc main function, adds the key listener, prints the key menu and loops till script is stopped with f11 keypress
 * @param none
 * @returns none
 */
function main() {
	addEventListener("keyup", keyUpHandler);
	print("njipTest Loaded (F12 = parse items, F11 = ALLSTOP, F10 = Test Single Item, F9 = Dump Item Stats)");
	print("To test a single item, hover your mouse over the item and hit F10");
	print("To dump the stats of an item, hover your mouse over the item and hit F9");
	while(shouldRun){
		delay(200);
	}
	stop();
}
