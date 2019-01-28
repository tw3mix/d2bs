[1]: https://markdown-here.com/livedemo.html
[markdown live demo][1] [마크다운 사용법](https://dooray.com/htmls/guides/markdown_ko_KR.html)
# rusher fatch

```javascript
	this.inviteParty = function () {
		var player, myPartyId;

		print("invte party");
		player = getParty();
		if (player) {
			myPartyId = player.partyid;

			while (player.getNext()) {
				if (player.partyflag !== 4 && player.partyflag !== 2 && player.partyid === 65535) {
					clickParty(player, 2);
					delay(100);
				}
			}
		}
	};

	addEventListener("chatmsg", this.chatEvent);
	
	if (Config.PublicMode !== 1 || Config.PublicMode !== 3) {
		this.inviteParty();
	}
```


# rushee fatch

```javascript
	this.changeAct = function (act) {
		...
		...
		if (!me.inTown && me.act !== 3) {
			Pather.usePortal(null, leader.name);
		}
```

```javascript
	addEventListener("chatmsg",
		function (who, msg) {
			if (msg === "rusher") {
				Config.Leader = who;
			}
			if (who === Config.Leader) {
				actions.push(msg);
			}
		});
```

```javascript
	this.checkParty = function () {
		var player, myPartyId;

		player = getParty();
		if (player) {
			myPartyId = player.partyid;

			while (player.getNext()) {
				if (player.partyflag === 2 &&
					(myPartyId === 65535 || player.partyid !== myPartyId)) {
					clickParty(player, 2);
					delay(100);
					break;
				}
			}
		}
	};
```

```javascript
				case "1":
					while (!leader.area) {
						delay(500);
					}

					//print(leader.area);

					if (!Config.Rushee.Quester) {
						//print("not a quester");
						switch (leader.area) {
						case 74: // ARCANE_SANCTUARY
						//case 83: // travincal
							target = getUnit(1, NPC.Cain);

							if (target && target.openMenu()) {
								me.cancel();
							}

							break;
						}
						actions.shift();

						break;
					}
```

```javascript
				case "a2":
					if (!this.changeAct(2)) {
						break;
					}

					target = getUnit(1, NPC.Jerhyn);

					if (target && getDistance(me, target) < 3) {
						target.openMenu();
					}
```