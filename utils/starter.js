js_strict(true);

include('gamemanager.dbl');

function main()
{
	var gameCount = 1,
		db = new SQLite('runstats.sqlite'),
		profile = '',
		gamePrefix = '',
		password = '',
		mode = '',
		gamesPerHour = 0,
		difficulty = 0;

	db.execute('CREATE TABLE IF NOT EXISTS "main"."runstats" (' +
					'"start" DATETIME NOT NULL,' +
					'"end" DATETIME,' +
					'"status" TEXT NOT NULL,' +
					'"game" TEXT NOT NULL,' +
					'"pass" TEXT NOT NULL,' +
					'"profile" TEXT NOT NULL);');
	db.execute('CREATE TABLE IF NOT EXISTS "main"."config" (' +
				'"name" TEXT NOT NULL, "value" TEXT, "profile" TEXT NOT NULL);');

	var startrun = db.query('INSERT INTO runstats (start, status, profile, game, pass) VALUES (?, ?, ?, ?, ?);');
	var newrun   = db.query('UPDATE runstats SET start=?, status=? WHERE _ROWID_=last_insert_rowid();');
	var endrun   = db.query('UPDATE runstats SET end=?, status=? WHERE _ROWID_=last_insert_rowid();');
	var firstrun = db.query("SELECT strftime('%s', start, 'utc'), _ROWID_ AS id FROM runstats WHERE start>=? AND start<=? AND profile=? ORDER BY start DESC LIMIT 1;");
	var numruns  = db.query('SELECT _ROWID_+1 AS run FROM runstats ORDER BY run DESC LIMIT 1;');

	addEventListener("scriptmsg", function (check, p) {
		if(check == 'profile' && p != undefined && typeof(p) == 'string' && p != '') {
			profile = p;
			removeEventListener("scriptmsg", arguments.callee);
		}
	});
	GameManager.requestProfile();
	sendCopyData(null, "OOG", 0,"ShowWindow 6" ); //OOG compatablity,
	while(profile == ''){
			locationAction( getLocation() ); 		
			sendCopyData(null, "OOG", 0,"Move "+getLocation() );
			delay(1000);	
   }

	var q = db.query('SELECT name, value FROM config WHERE profile = ?');
	q.bindAll(profile);
	while(q.next())
	{
		switch(q.getColumnValue(0))
		{
			case 'gamePrefix': gamePrefix = q.getColumnValue(1); break;
			case 'password': password = q.getColumnValue(1); break;
			case 'mode': mode = q.getColumnValue(1); break;
			case 'gamesPerHour': gamesPerHour = q.getColumnValue(1); break;
			case 'difficulty': difficulty = q.getColumnValue(1); break;
		}
	}

	while(true)
	{
		// wake up and check every 1 second for out of game
		while(me.ingame) delay(1000);
		delay(3000); // let the game catch up

		// if we finished a run, update the db
		if(db.lastRowId != 0)
		{
			// we finished a run
			endrun.bindAll(new Date(), 'finished');
			endrun.next();
			endrun.reset();
		}

		switch(getLocation())
		{
			case 1: // lobby
			case 3: // chat
				makeGame();
				break;
			case 24: case 26: case 28: // failed to join of some form or another
				GameManager.sendMessage('Failed to join the game, waiting 5 minutes');
				delay(300000);
				break;
			case 13: // realm down
				GameManager.sendMessage('Got restricted, waiting 2 hours');
				restart(120);
				break;
			case 8: // main menu
			case 18: // splash screen
				login(profile);
				break;
			case 21: // "Connecting" screen
			case 25: // "please wait" screen
				while(getLocation() == 25 || getLocation() == 21)
					delay(350);
				break;
			case 22: // invalid cd key
				GameManager.sendMessage('Your CD Key appears to be invalid, restarting in 5 minutes');
				restart(5);
				break;
			case 16: // "please wait" on char select screen
			case 9:  // login screen
			case 10: // bailed out during login()
				GameManager.sendMessage('Failed to log in! Check your profile settings and try again.');
				GameManager.reload = false;
				restart(1);
				break;
			default: // anywhere else
				// are we really lost, or just think we're out of game?
				if(me.ingame)
					break;

				var control = getControl();
				var msg = 'The bot got lost? Location is ' + getLocation() + ', first control is ' +
						(control == undefined || control == null ? 'undefined' : control.toSource()) +
						'. Please report this as an error (copy/paste this entire line with your report).';
				GameManager.sendMessage(msg);
				GameManager.sendMessage('Restarting...');
				restart(1);
				break;
		}
	}

	function makeGame() {
		if(gameCount % gamesPerHour == 0)
		{
			var time = getRemainingTime();
			GameManager.sendMessage('Waiting for ' + parseInt(time/1000, 10) +
					' seconds before going to the next game (games per hour delay).');
			delay(time);
		}
		switch(mode)
		{
			case 'create':
				var wait = rand(10, 15);
				GameManager.sendMessage('Waiting ' + wait + ' seconds before making the next game');
				delay(wait*1000);
				var name = (gamePrefix == 'random' ? makerand() : gamePrefix + '-' + getRunNumber());
				var pass = (password == 'random' ? makerand() : password);
				GameManager.sendMessage('Creating game ' + name + '/' + pass);
				startrun.bindAll(new Date(), 'creating', profile, name, pass);
				startrun.next();
				startrun.reset();
				createGame(name, pass, difficulty);
				gameCount++;
				break;
			case 'follow':
				print('Waiting for a game to join');
				addEventListener("scriptmsg", function (check, game, pass) {
					if(check != 'joingame' &&
					   game != undefined && typeof(game) == 'string' && game != '' &&
					   pass != undefined && typeof(pass) == 'string')
					{
						GameManager.sendMessage('Joining game ' + name + '/' + pass);
						startrun.bindAll(new Date(), 'joining', profile, name, pass);
						startrun.next();
						startrun.reset();
						joinGame(game, pass);
						removeEventListener("scriptmsg", arguments.callee);
					}
				});
				while(!me.ingame) delay(1000);
				break;
			default:
				GameManager.sendMessage('Invalid mode!');
				break;
		}

		// wait for the potential line
		while(getLocation() == 2)
			delay(500);

		// wait for game join
		for(let i = 0; i < 30; i++)
		{
			delay(1000)
			if(me.ingame)
			{
				newrun.bindAll(new Date(), 'joined');
				newrun.next();
				newrun.reset();
				GameManager.sendMessage('Game joined successfully');
				break;
			}
		}
		if(!me.ingame)
		{
			newrun.bindAll(new Date(), 'failed to join');
			newrun.next();
			newrun.reset();
			GameManager.sendMessage('Waiting 5 minutes due to failed join');
			delay(300000);
		}
	}

	function makerand() { return md5(getTickCount()+rand(1,150000)).substr(rand(0, 17), rand(5, 15)); }
	function getRemainingTime() {
		// find the first run this hour so we can determine how long to delay for
		var now = new Date();
		var y = now.getFullYear(),
			m = now.getMonth(),
			d = now.getDate(),
			h = now.getHours();
		var begin = new Date(y, m, d, h),
			end = new Date(y, m, d, h);
		end.setHours(h+1);

		firstrun.bindAll(begin, end, profile);
		if(!firstrun.next()) {
			GameManager.sendMessage('No rows found?! Waiting an hour, then...');
			firstrun.reset();
			return 3600000;
		}

		var start = new Date(parseInt(firstrun.getColumnValue(0), 10)*1000);
		firstrun.reset();
		start.setHours(start.getHours()+1);
		now = new Date();
		if(start.getTime() > now.getTime())
			return (start - now);
		GameManager.sendMessage('The delay is in the past?! Waiting an hour, then...');
		return 3600000;
	}
	function getRunNumber() {
		if(!numruns.next())
			return 1;
		var num = numruns.getColumnValue(0);
		numruns.reset();
		return num;
	}
	function restart(duration) {
		delay(duration*60*1000);
		quitGame();
	}
}

DBStatement.prototype.bindAll = function bindAll() {
	for(var i = 0; i < arguments.length; i++)
		if(arguments[i] instanceof Date)
			this.bind(i+1, arguments[i].toDBString());
		else
			this.bind(i+1, arguments[i]);
};

Date.prototype.toDBString = function () {
	function prefix(x) { return (x < 10 ? "0"+x : x); }

	var year = this.getFullYear(),
		month = prefix(this.getMonth()+1),
		day = prefix(this.getDate()),
		hour = prefix(this.getHours()),
		min = prefix(this.getMinutes()),
		sec = prefix(this.getSeconds()),
		msec = this.getMilliseconds();
	msec = (msec < 10 ? "00" + msec : (msec < 100 ? "0" + msec : msec));
	return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec + "." + msec;
};

function locationAction( location ) {  // oog location actions
	switch (location) { 
		case 3: // Chat 
			var con =getControl(4,28,410,354,298);
			if(con){
				var lin=con.getText();
				sendCopyData(null, "OOG", 0,"Chat "+lin );
			}
			break; 
		case 5: //Join Game
			var con =getControl(4,432,393,160,173);
			if (con){
				var lin=con.getText();
				sendCopyData(null, "OOG", 0,"Join "+lin );
			}
			break;
		case 11: // unable to connect
			//delay(300000); //5 min delay
			//quitGame(); 
	} 
}
