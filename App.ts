/// <reference path="./rot.d.ts" />
/// <reference path="./Roomdata.ts" />
/// <reference path="./Nav.ts" />

interface Array<T> { fill(value: T): Array<T>; }

namespace H {
	export const distinctize = <T>(a: T[]): T[] => (a.filter((v, i, aa) => aa.indexOf(v) === i))
	export const randomVal = <T>(a: T[]): T => (a[RNG.dice(1, a.length) - 1])
	export const randTurn = <T>(a: Mtx<T>): Mtx<T> => a.turn(RNG.dice(0,3) + (RNG.coin() ? 4 : 0))
	// Colors
	export const dim = (c: string, n: number): string => rgbToHex.apply(null, hexToRgb(c).map(v => (v * n) | 0))
	export const dimDrawTile = (t: DrawTile, n: number): DrawTile => [t[0], (t[1] !== "" ? dim(t[1], n) : t[1]), t[2] !== "" ? dim(t[2], n) : t[2]]
	// Borrowed https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
	export const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => { const hex = x.toString(16); return hex.length === 1 ? '0' + hex : hex }).join('')
	export const hexToRgb = (hex): [number, number, number] => // NOTE: Works with short form (e.g. #fff)
	  hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g).map(x => parseInt(x, 16))
}
namespace RNG {
	export const roll = (t: number, atleast?: number): boolean => (dice(1, t) >= (atleast !== undefined ? atleast : t))
	export const dice = (f: number = 1, t: number = 10): number => ((ROT.RNG.getUniform() * (t - f + 1) + f) | 0)
	export const weighedRoll = (a: number[]): number => { const sum = (p, c) => (p + c); const rolled = dice(1, a.reduce(sum)) - 1; return a.findIndex((n,i,aaa) => aaa.slice(0, i + 1).reduce(sum) > rolled); }
	export const coin = (): boolean => (roll(2))
}
namespace UI {
	export const DISPLAY = new ROT.Display();
	const w = () => DISPLAY.getOptions().width!
	const h = () => DISPLAY.getOptions().height!
	export let messages: string[] = [];

	const resize = (): void => { DISPLAY.setOptions({ width: window.innerWidth / 9 - (window.innerWidth / 9 % 2 === 0 ? 3 : 2), height: window.innerHeight / 15 - (window.innerHeight / 15 % 2 === 0 ? 3 : 2)}); draw(); }
	const drawStats = (): void => DISPLAY.drawText(0, h() - 1, "HP: " + Eng.player.hp + "  Your coins: " + Eng.player.coinAmt + "  Dlvl: " + Eng.player.tile.rooms[0].lvl.z); //  + " Your pos: " + player.loc.toString());
	const drawMap = (): void => { // TODO: offset // Draw stuff according to player.memory
		const off = [(w() / 2 | 0) - (Eng.player.uiSight.w / 2 | 0), (h() / 2 | 0) - (Eng.player.uiSight.h / 2 | 0)];
		Eng.player.uiSight.forEach((t, i, ii) => t ? DISPLAY.draw.apply(DISPLAY, [i + off[0], ii + off[1], ...t]) : null);
	}
	const showMsgs = (): void => {
		messages.slice(0,3).forEach((v, i) => DISPLAY.drawText(0, i, v, w()));
		if (messages.length > 3) { DISPLAY.drawText(0, 3, " -- MORE -- ", w()); Input.inputCb.push(() => { messages = messages.slice(3); draw(); }); }
	}
	export const init = (): void => { document.body.appendChild(DISPLAY.getContainer()); window.onresize = () => resize(); resize(); }
	export const draw = (l?: Loc): void => { DISPLAY.clear(); drawMap(); drawStats(); showMsgs(); }
}
namespace Input {
	export const inputCb: (() => void)[] = [];
	export const keypress = (e: KeyboardEvent): void => { // console.log(e.which ? e.which : e.keyCode);
		if (inputCb.length) { inputCb.shift()!(); return; }
		if (Eng.current !== Eng.player) { return; }
		const isDir = codeToDir(e.which ? e.which : e.keyCode);
		if (isDir !== undefined) { UI.messages = []; Eng.player.direction(isDir, e.shiftKey); }
	} // 33, 34, 35, 36, // 57, 51, 49, 55, 
	const arrowsToDir: number[] = [38, 33, 39, 34, 40, 35, 37, 36, 12, 60, 62]; // Has '<', '>' as last
	const numbersToDir: number[] = [56, 57, 54, 51, 50, 49, 52, 55, 53];
	const codeToDir = (c: number): Dir | undefined => arrowsToDir.indexOf(c) !== -1 ? arrowsToDir.indexOf(c) : numbersToDir.indexOf(c) !== -1 ? numbersToDir.indexOf(c) : undefined

	let startPos: [number, number] = [0, 0];
	export const touchStart = (e: TouchEvent) => { startPos = [e.changedTouches[0].pageX, e.changedTouches[0].pageY]; }
	export const touchEnd = (e: TouchEvent) => {
		const diff: [number, number] = [e.changedTouches[0].pageX - startPos[0], e.changedTouches[0].pageY - startPos[1]];
		const dir = dirSum(diff[0] >= 100 ? Dir.W : diff[0] <= -100 ? Dir.E : Dir.Z, diff[1] >= 100 ? Dir.N : diff[1] <= -100 ? Dir.S : Dir.Z);
		UI.messages = [];
		Eng.player.direction(dir, false);
	}
}
document.addEventListener("keypress", Input.keypress);
document.addEventListener("touchstart", Input.touchStart);
document.addEventListener("touchend", Input.touchEnd);

namespace Eng {
	let actors: Being[] = [];
	const scheduler: ROT.Action = new ROT.Scheduler.Action();
	export let current: any;
	export let player: Player;
	export let levels: Level[] = []; // TODO: Duplicate rooms between levels, aka. short lived room appearances from other level

	const run = (): void => {
		const cb = (t: number) => { scheduler.setDuration(t); run(); }; // Sets delay to the current actor
		current = scheduler.next();
		if (current instanceof Being) { current.act((t) => cb(t)); }
		else if (typeof current === "function") { current(cb); }
		else if (typeof current === "string" && current === "End") { return; } // Stop the endless loop
		else { throw new Error ("Unknown actor!"); }
	}
	const tick = (): void => { } // Uhh, someday for DoT or items etc. with time stuff
	export const memoryLapse = (lvl: Level): void => lvl.modifyTiles((a: Mtx<Tile>) => H.randTurn(a))
	export const init = (): void => {
		scheduler.add((cb: (t: number) => void) => { tick(); cb(33); }, true); // Always first
		levels = [];
		new Player().init(H.randomVal(new Level(1).init().rooms[0]!.flat().filter(t => t.char === "?"))!);
		UI.messages = ["You wake up in the bath."];
		run();
	}
	export const stop = (): void => { console.log("Ending game!");
		scheduler.clear().add("End", false);
		UI.draw();
		Input.inputCb.push(() => { console.log("Restarted!"); Eng.init(); });
	}
	export const addActor = (b: Being): void => { actors.push(b); scheduler.add(b, true); } // Wrapped for safety
	export const removeActor = (b: Being): void => { actors = actors.filter(a => a !== b); scheduler.remove(b); }
}
// Basic leveltype follows layout: Majors and biggies connected with corridors or halls, which are paired with rooms and subrooms
class Level extends Mtx<Tile> {
	constructor(readonly z: number) { super(); Eng.levels.push(this); } // All levels start without any rooms
	rooms: Room[] = [];

	debug() { super.debug(t => t.char); }
	init(): Level { // TODO: quite unnecessary
		const settings = ROOMS.get(RoomType.MAJOR)!.get("Start")!();
		this.reserve(new Room(settings, this), new Loc(0, 0)); // First room always at 0,0
		return this;
	}
	amnesia(): void { // TODO: Rename
		// TODO: this.rooms.forEach(r => { if (r.loc) r.vanish(); }); // Kept separate from below to not run this again and again
		let roomL: number; // New rooms may be generated
		do {
			roomL = this.rooms.length;
			this.rooms.forEach(r => { while(r.toDo.length) { if (r.toDo[r.toDo.length - 1] !== undefined) { r.toDo.pop()!() } else { r.toDo.pop(); } }});
		} while (this.rooms.length !== roomL);
	}
	generate(gr: Room): void {
		if(gr.generated) { return; } // console.log("Generating " + r.settings.type + " at: " + r.loc!.toString());
		if(gr.settings.type === RoomType.SUBROOM) { gr.generated = true; return; }
		const nonNeighs = gr.nonNeighbours();
		if (nonNeighs.length && RNG.coin()) {
			gr.join(H.randomVal(nonNeighs));
			this.generate(gr);
			return;
		}
		const newRooms: Room[] = [];
		const lvlToUse = gr.settings.id === "StairConnector" ? new Level(gr.lvl.z + (gr.some(t => t !== undefined && t.char === ">" && t.rooms.length === 1) ? 1 : -1)) : this;
		if (gr.settings.type !== RoomType.CORRIDOR) {
			if (gr.settings.id === "Stairs") {
				for (let i = 0; i < 2 - gr.neighbours.filter(rrr => rrr.settings.id === "StairConnector").length; i++) {
					newRooms.push(new Room(ROOMS.get(RoomType.MISC)!.get("StairConnector")!(), this));
				}
			}
			//else {
				if(gr.settings.type === RoomType.MISC) {
					//const levtouse = ;
					newRooms.push(new Room(ROOMS.get(RoomType.MAJOR)!.get("Stairs")!(), lvlToUse));
				}
				else {
					for (let i = 0; i < gr.flat().reduce((p, c) => p + (c.char === PREFDOOR ? 1 : 0), 0); i++) {
						newRooms.push(new Room(ROOMS.get(RoomType.CORRIDOR)!.get("Basic")!(), this));
					}
					while (RNG.coin()) {
						if (this.rooms.filter(rr => rr.settings.type === RoomType.ROOM && rr !== gr && gr.neighbours.indexOf(rr) === -1 && newRooms.indexOf(rr) === -1).length) newRooms.push(this.rooms.filter(rr => rr.settings.type === RoomType.ROOM && rr !== gr && gr.neighbours.indexOf(rr) === -1 && newRooms.indexOf(rr) === -1)[0]);
						else newRooms.push(new Room(ROOMS.get(RoomType.ROOM)!.get("Basic")!(), this));
					}
				}
			//}
		}
		else {
			if (this.rooms.filter(r => r.settings.type === RoomType.MAJOR || r.settings.type === RoomType.BIGROOM).length < 3) {
				for (let i = 0; i < gr.flat().reduce((p, c) => p + (c.char === PREFDOOR ? 1 : 0), 0); i++) {
					newRooms.push(
						//RNG.coin() ? new Room(ROOMS.get(RoomType.CORRIDOR)!.get("Basic")!(), this) :
						
						!this.rooms.some(r => r.settings.id === "Tree") && RNG.coin() ? new Room(ROOMS.get(RoomType.BIGROOM)!.get("Tree")!(), this) :
						this.rooms.some(r => r.settings.id === "Stairs") ? new Room(ROOMS.get(RoomType.ROOM)!.get("Basic")!(), this) : new Room(ROOMS.get(RoomType.MAJOR)!.get("Stairs")!(), this));
				}
			}
			newRooms.push(new Room(ROOMS.get(RoomType.ROOM)!.get("Basic")!(), this));
		}
		const prefDoor = (arr: Tile[]) => arr[(arr.length / 2) | 0]!.prefDoor;
		let stairtofind = ">";
		const prefStair = (arr: Tile[]) => arr[(arr.length / 2) | 0]!.char === stairtofind;
		const nostairs = (arr: Tile[]) => !arr.some(t => isStairs(t.char));
		while (newRooms.length > 0) {
			const newRoom = newRooms.shift()!;
			const isPlaced = newRoom.loc !== undefined; //|| newRoom.settings.id === "StairConnector";
			const prefDoors = gr.flat().some(t => t.char === PREFDOOR) && newRoom.flat().some(t => t.char === PREFDOOR); // If both rooms have a prefdoor tile, try to attach to it // TODO: retry without
			const stairs: boolean =
				gr.some(t => { if(t !== undefined && t.rooms.length === 1 && isStairs(t.char) && t.char !== "X") { console.log(t.char); stairtofind = t.char; return true; } return false; }) &&
				newRoom.some(t => t !== undefined && t.rooms.length === 1 && t.char === stairtofind);
			// gr.settings.id === "Stairs" && 
			const curCons: Con[] = gr.freeEdges(undefined, isPlaced ? (t: Tile) => t.rooms.length <= 1 : undefined, stairs ? prefStair : prefDoors ? prefDoor : nostairs); // Tiles of portals between the existing rooms must only belong to those two
			if (curCons.length === 0) { break; }
			let done = false;
			let turnsToCheck = isPlaced ? 0 : 4; // If using existing room, no turnings
			do { // TODO: Comment
				const newCons: Con[] = newRoom.freeEdges(undefined, isPlaced ? (t: Tile) => t.rooms.length <= 1 : undefined, stairs ? prefStair : prefDoors ? prefDoor : undefined);
				if (newCons.length === 0) { break; }
				const tmpCurCons = curCons.slice();
				while (!done && tmpCurCons.length > 0) {
					
					const ranCon: Con = tmpCurCons.splice(RNG.dice(1, tmpCurCons.length) - 1, 1)[0]; // Just pick one randomly from the original room to use
					const possibles = newCons.filter(c => c[0] === oppositeDir(ranCon[0])) // Find connection pairs (opposite directions)
						.map(c => <[Con, Loc]>[c, ranCon[1].subtr(c[1])]); // Get the placement difference of the pairs
					if (stairs) { console.log(newCons[0] + " ,, " + ranCon + " ; " + possibles.length); }
					while (!done && possibles.length > 0) {
						const posCon = possibles.splice(RNG.dice(1, possibles.length) - 1, 1)[0];
						if (stairs || this.checkMerge(newRoom, posCon[1].add(gr.loc!), (t: Tile) => t.isPortal) > 0) {
							if (stairs) {
								console.log("Doing!");
								if (newRoom.settings.id === "Stairs") {
									lvlToUse.reserve(newRoom, new Loc(0,0));
								}
								//else {
									const newrtiles = newRoom.conVals(posCon[0]);
									gr.conVals(ranCon).forEach((v, i) => { newRoom.set(v, newRoom.findLoc(newrtiles[i])!); v.rooms.push(newRoom); });
									if (newRoom.settings.id === "StairConnector") { lvlToUse.rooms.push(newRoom); }
								//}
							}
							else if (isPlaced) {
								const mapped = newRoom.map((s, i, ii) => s ? [new Loc(i, ii).add(posCon[1]), new Loc(i, ii)] : undefined).conVals(posCon[0]); // Get the locations of the would-be new values
								mapped.forEach(l => { if(gr.at(l[0])) { gr.at(l[0])!.rooms.push(...newRoom.at(l[1])!.rooms); newRoom.at(l[1])!.rooms.forEach(rrr => rrr.set(gr.at(l[0])!, rrr.findLoc(newRoom.at(l[1])!)!)); this.set(gr.at(l[0])!, newRoom.loc!.add(l[1])); } });
								gr.flat().forEach(t => { t.updateTrn(); t.updatePortal(); });
								newRoom.flat().forEach(t => { t.updateTrn(); t.updatePortal(); });
							}
							else { this.reserve(newRoom, posCon[1].add(gr.loc!)); }
							gr.join(newRoom);
							done = true;
						}
					} 
				} 
				if (!done && turnsToCheck-- > 0) { newRoom.turn(1); } // NOTE: Mirroring at this stage is quite pointless
			} while (!done && turnsToCheck > 0);
		}
		Eng.player.fov();
		gr.generated = true;
	}
	private reserve(r: Room, l: Loc): Room {
		this.merge(r, l, (t1: Tile, t2: Tile) => { t1.rooms = H.distinctize(t1.rooms.concat(t2.rooms)); }); // TODO: Merge tiletypes (e.g. noneigh)
		this.updateTiles();
		this.rooms.push(r);
		return r;
	}
	unReserve(r: Room): void { // NOTE: parting is called at this point so no portals *shouldn't* exist
		r.forEach((t, i, ii) => {
			if (t && t.rooms.length === 1) { this.set(undefined, t.loc!); t.loc = undefined; t.lvl = undefined; }
			else if (t) { t.rooms.filter(rr => rr !== r); r.set(new Tile(t.char, r), [i, ii])!.rooms.push(r); }
		});
	}
	modifyTiles(cb: (t: Mtx<Tile>) => Mtx<Tile>): void { cb(this); this.updateTiles(); }
	updateTiles(): void { this.forEach((t, i, ii) => { if(t !== undefined) { t.lvl = this; t.loc = new Loc(i, ii); }}); }
}
enum RoomOps { WAT, GENERATE, TERRAINUPDATE, REROLL, REMOVE } // NOTE: Order is important! Atm. Generate has to be < Terrain
class Room extends Mtx<Tile> {
	static ID = 0;
	private static getJoint = (r1: Room, r2: Room): Tile[] => r1.inCommon(r2).filter((t, i, ii, o) => {
		const check = (l: [number, number]): boolean => o.at(l) !== undefined && o.at(l)!.char !== NONEIGH && isWall(o.at(l)!.char);
		return t !== undefined && (check([i - 1, ii]) && check([i + 1, ii]) || check([i, ii - 1]) && check([i, ii + 1]))
	}).flat()

	constructor (readonly settings: RoomSettings, public lvl: Level) { // NOTE: Rooms are ALWAYS randomly turned when created
		super(); // NOTE: new Tile needs *this* so cannot put values in super call
		this.init(settings.layout.map(s => s.split('').map(c => c === " " ? undefined : c)).map(a => a.map(char => char ? new Tile(char, this) : undefined)));
		H.randTurn(this);
		this.id = Room.ID++;
		this.morsogen().itemgen();
	}
	neighbours: Room[] = []; // TODO: Remove
	generated: boolean = false; // STUFTOMOVE
	seen: boolean = false;
	private id: number;
	toDo: (() => void)[] = []; // Indexed with RoomOps

	debug() { super.debug(t => t.char); }

	get loc(): Loc | undefined { const firstOwn = this.nonEdges().flat()[0]; return firstOwn.loc ? firstOwn.loc.subtr(this.findLoc(firstOwn)!) : undefined; }
	get inLos (): boolean { return this.flat().filter(t => !isWall(t.char)).some(t => t.inSight); }
	// TODO:::: get accessible(): number { return this.floors.length > 0 ? Eng.player.hasPath(this.floors[0].loc!) : 0; }
	private get floors(): Tile[] { return this.nonEdges().flat().filter(t => terrainMove(t.char)); }
	private get beings(): Being[] { return this.flat().filter(t => t.being).map(t => t.being!); }

	nonNeighbours(): Room[] {
		const isNot = (r: Room) => r !== this && r.neighbours.indexOf(this) === -1 && Room.getJoint(this, r).length > 0;
		return H.distinctize( (<Room[]>[]).concat(...(this.edges().flat().map(t => t.rooms.filter(r => isNot(r))))) );
	}
	join(r: Room): void {
		if (this.neighbours.indexOf(r) !== -1) { throw new Error("Doublejoining same room!"); }
		if (Room.getJoint(this, r).length === 0) { throw new Error("No jointiles!"); }
		this.neighbours.push(r); r.neighbours.push(this);
		const common: Tile[] = Room.getJoint(this, r);
		const pickedTile: Tile = common.some(t => t.prefDoor) ? common.filter(t => t.prefDoor)[0] : H.randomVal(Room.getJoint(this, r));
		pickedTile.updateTrn(this.settings.type === r.settings.type ? (this.settings.type === RoomType.CORRIDOR ? "." : "x") : 
			r.settings.type === RoomType.MISC || this.settings.type === RoomType.MISC ? undefined : "+");
	}
	part(r: Room): void {
		if(this.neighbours.indexOf(r) === -1) { throw new Error("Parting non-neighbour room!"); }
		this.neighbours = this.neighbours.filter(n => n !== r); r.neighbours = r.neighbours.filter(n => n !== this);
		this.inCommon(r).flat().forEach(t => {
			t.updateTrn("#");
			if (t.isPortal) {
				const newTile = new Tile("#", this);
				this.lvl.set(newTile, this.loc!.add(this.findLoc(t)!)); // NOTE: Cannot use t.loc since it can be totally somewhere wrong
				this.set(newTile, this.findLoc(t)!);
				this.flat().forEach(tt => tt.updateTrn());
				t.rooms = t.rooms.filter(tr => tr !== this);
				t.isPortal = false;
			}
		});
	} // prefDoors: boolean = false, 
	freeEdges(w: number = 3, cb?: (t: Tile) => boolean, arrCb?: (arr: Tile[]) => boolean): Con[] { // Free edges -> Find 3 w or h parts -> Edges
		return this.findEdges((a: (Tile | undefined)[]) =>
			a.every(t => t !== undefined) && a.every((t, i) => t!.isFree() && (cb ? cb(t!) : true) && (arrCb ? arrCb(<Tile[]>a) : true)), w)
	}
	vanish(): boolean { // Check Amnesia
		if (this.loc === undefined || this.inLos) { return false; } ///  || this.vanished
		// TODO::::::::::::::::::::::
		//if (this.nonEdges().flat().filter(t => t && !t.seen).length / this.nonEdges().flat().length > 0.66) { // console.log("Vanish " + this.loc.toString());
			// TODO:: FIX below // if (RNG.roll(10)) { this.reroll().flat().forEach(t => { t.forget(); t.updateTrn(); }); }
			// else if (RollD20()) { this.destroy(); this.flat.forEach(t => t.forget()); }
			//return true;
		//}
		return false;
	}
	itemgen(): Room { if(this.generated) { throw new Error("Room already generated!"); } if(RNG.roll(10, 7)) { H.randomVal(this.floors).item = true; } return this; }
	morsogen(): Room {
		if(this.generated) { throw new Error("Room already generated!"); }
		if(RNG.roll(10, 5)) {
			const rndMors = MORSOS.get(RNG.coin() ? "G" : "W");
			H.randomVal(this.floors.filter(t => t.being === undefined)).addBeing(new Morso(rndMors![0], rndMors![1]));
		}
		return this;
	}
	setSeen(): void {
		if (!this.seen) {
			this.seen = true;
			this.toDo[RoomOps.TERRAINUPDATE] = (() => this.forEach(t => t ? t.updateTrn() : null));//Eng.player.lvl.subArea(new Are(this.loc!.add(-1), this.w + 2, this.h + 2)).forEach(t => { if(t) t.updateTrn(); }));
			this.toDo[RoomOps.GENERATE] = (() => { this.lvl.generate(this); Eng.player.fov(); });
		}
	}
	private reroll(): Room { // console.log("Rerolled room at: " + this.Loc);
		this.neighbours.forEach(n => {
			const doorways: Tile[] = this.inCommon(n).flat().filter(t => !isWall(t.char));
			if (doorways.length === 0) { throw new Error("Neighbour without access!"); }
			const char: string = doorways[0].char;
			doorways.forEach(t => t.updateTrn("#"));
			//if (this.accessible) { this.part(n); if(!n.accessible) { n.destroy(true); }}
	 		//else { doorways.forEach(t => t.updateTrn(char)); }
		});
		this.empty().morsogen().itemgen();
		this.lvl.generate(this); // New rooms // TODO: Move
		return this;
	}
	private empty(): Room {
		this.generated = false;
		this.flat().forEach(t => { t.item = false; }); // TODO: Redo when items are real
		this.beings.forEach(b => { if (!(b instanceof Player)) b.remove() });
		return this;
	}
	private destroy(cascade: boolean = false): Room { console.log("Removed room at: " + this.loc!.toString());
		this.neighbours.forEach(r => { r.part(this); }); //if(cascade) { if(r.accessible) { Eng.curlvl.generate(r); } else { r.destroy(true); }}});
		//this.flat().forEach(t => t.forget()); // if (t.rooms.length === 1) { t.clear(); } t.rooms = t.rooms.filter(r => r !== this) clear()
		this.lvl.unReserve(this); // STUFTOMOVE
		return this;
	}
}
class Tile {
	constructor (public char: string, r: Room) { this.trn = drw(char); this.rooms.push(r); }
	loc: Loc | undefined; // Global loc // TODO: Better naming
	lvl: Level | undefined;
	rooms: Room[] = [];
	trn: DrawTile;
	trnEff: [string, string] | undefined; // fg, bg
	item: boolean = false;
	isPortal: boolean = false; // For performance
	private _being: Being | undefined;

	updatePortal() { if(this.lvl) this.isPortal = this.lvl.filter(t => t === this).flat().length > 1; }
	updateTrn(c?: string): void { // If ever needed: ["ǁ", "│", "─", "└", "│", "│", "┌", "├", "─", "┘", "─", "┴", "┐", "┤", "┬", "┼"]
		if (c) { this.char = c; }
		this.trn = drw(this.char);
		const nat = (d) => { const t = this.neighAt(d); return t && likeWall(t.char) && t.rooms.some(r => r.seen); };
		if (isWall(this.char)) { this.trn[0] = "ǁ│─└││┌├─┘─┴┐┤┬┼".substr([nat(Dir.N), nat(Dir.E), nat(Dir.S), nat(Dir.W)].reduce(((p, c, i) => p | (c ? 2 ** i : 0)), 0), 1); }
		const align = (d): boolean => { const t = this.neighAt(d); return t !== undefined && !isWall(t.char); }
		if (isStairs(this.char)) { this.trn[0] = "≡⦀".substr(align(Dir.N) || align(Dir.S) ? 0 : 1, 1); }
	}
	get draw(): DrawTile { return this.inSight ? (this._being ? this._being.draw : this.item ? drw("$") : this.trnEff ? [this.trn[0], this.trnEff[0], this.trnEff[1]] : this.trn) : this.memDraw; }
	get memDraw(): DrawTile { return H.dimDrawTile(this.trn, 0.3); }
	get being(): Being | undefined { return this._being; }
	addBeing(b: Being): void { this._being = b; b.tile = this; } // Wrapped for safety
	removeBeing(b: Being): void { if (this._being !== b) { throw new Error("No such dude!"); } this._being = undefined; }
	get inSight(): boolean { return Eng.player.seenTiles.flat().indexOf(this) !== -1; }
	get prefDoor(): boolean { return this.char === PREFDOOR; }
	neighbours(): (Tile | undefined)[] { return Array.from(Array(8).keys()).map(v => this.neighAt(v)); }
	neighAt(d: Dir): Tile | undefined { return this.rooms.map(r => r.at(r.findLoc(this)!.toDir(d))).find(t => t !== undefined); }
	isFree(): boolean { return this.char !== NONEIGH && this.char !== "="; } // For reserving // && this.rooms.length <= 1; // (isWall(this.char) || isStairs(this.char)
	setSeen(): void { // This is called basically always when player sees a tile
		if (this._being instanceof Morso) { this._being.seen = true; }
		if (this.rooms.length === 1) { this.rooms.forEach(r => r.setSeen()); }
	}
}
// Dudes
abstract class Being {
	static ID = 0;

	constructor() { this.id = Being.ID++; Eng.addActor(this); }
	combatants: Being[] = [];
	name: string;
	hp: number = 2;
	losr: number = 12;
	tile: Tile;
	draw: DrawTile = drw("@");
	seenTiles = new Mtx<Tile | undefined | null>().fill(this.losr * 2 + 1, this.losr * 2 + 1, null);
	path: Dir[] = [];
	private id: number;
	get rdy(): boolean { return this.tile !== undefined; }

	canMove(t: Tile | undefined | null): boolean { return this.rdy && t !== undefined && t !== null && (t.being === this || terrainMove(t.char)); }
	//hasPath(l: Tile): number { return this.rdy ? H.path(this.loc!, this.seenTiles.findLoc(t)!, (x,y) => this.canMove(this.seenTiles.at([x, y]))).length : 0; }
	pathTo(l: Loc) {
		let tempPath: Loc[] = [];
		const movetiles = this.seenTiles.clone();
		new ROT.Path.AStar(movetiles.w / 2 | 0, movetiles.w / 2 | 0, (x,y) => { this.checkTile(movetiles, x, y); return this.canMove(movetiles.at([x, y])); })
			.compute(l.x, l.y, (x, y) => tempPath.push(new Loc(x, y)));
		this.path = <Dir[]>tempPath.map((l, i, o) => i < o.length - 1 ? diffToDir(l.subtr(o[i + 1]).toArr()) : undefined).filter(v => v !== undefined);
	}
	wander(): Being { if (this.rdy) { const rnd = H.randomVal(this.tile.neighbours().filter(t => t && this.canMove(t))); if(rnd) { this.move(rnd); } } return this; }
	protected checkTile(a: Mtx<Tile | undefined | null>, x: number, y: number) { // Wrapper, basically tries to find already found tile at center direction
		if (a.at([x,y]) === null) {
			const r = a.w / 2 | 0;
			const dirCheck = (m: [number, number]): Tile | undefined | null => a.at([x + m[0], y + m[1]])
				? a.at([x + m[0], y + m[1]])!.neighAt(oppositeDir(dirMap.findIndex(v => v[0] === m[0] && v[1] === m[1])))
				: a.at([x + m[0], y + m[1]]) === undefined ? undefined : null;
			const prev1 = dirCheck([x < r ? 1 : x > r ? -1 : 0, y < r ? 1 : y > r ? -1 : 0]); // Just aim to the middle diagonal first
			const prev2 = x === y ? null : dirCheck(Math.abs(x - r) > Math.abs(y - r) ? [x < r ? 1 : x > r ? -1 : 0, 0] : [0, y < r ? 1 : y > r ? -1 : 0]); // To check the non-diag previous too
			a.set(prev1 !== null ? prev1 : prev2 !== null ? prev2 : null, [x,y]);
		}
	}
	fov(): Being { // Fov fuckery: Since there are portals and other things messing with ordinary coordinate system, we need to wrap FOV shadowcasting with self-made x,y-checker 
		this.seenTiles.fill(this.losr * 2 + 1, this.losr * 2 + 1, null);
		const tls = new Mtx<Tile | undefined | null>().fill(this.losr * 2 + 1, this.losr * 2 + 1, null); // TODO: Something else than null would be nice, undefined === seen but not a Tile
		tls.set(this.tile, [this.losr, this.losr]); // The initial tile to start the algorithm
		new ROT.FOV.RecursiveShadowcasting((x,y) => { this.checkTile(tls,x,y); return tls.at([x,y]) ? terrainLos(tls.at([x,y])!.char) : true;})
			.compute(this.losr, this.losr, this.losr - 1, (x, y, r, v) => { this.checkTile(tls,x,y); this.seenTiles.set(tls.at([x,y]), [x,y]); });
		return this;
	}
	move(t: Tile): Being { if (!this.rdy || t.being === this) { return this; } else if (this.canMove(t)) { this.tile.removeBeing(this); t.addBeing(this); } return this; };
	remove(): Being { Eng.removeActor(this); this.tile.removeBeing(this); return this; };
	act(cb: (t: number) => void): void { if (!this.rdy) throw new Error("Acting without location!"); };
	abstract damage(b: Being, d: number): boolean;
}

class Player extends Being {
	constructor() { super(); Eng.player = this; }

	name = "Player"; // General being values

	shifted: boolean = false; // Player specific values
	hp: number = 10;
	coinAmt: number = 0;
	memory = new Mtx<[DrawTile, number]>().fill(101, 101, undefined);
	private inputCb: ((t: number) => void) | undefined;

	act(cb: (t: number) => void): void { super.act(cb); UI.draw(); this.inputCb = cb; }
	direction(d: Dir, shift: boolean): void { // console.log(d + " " + shift);
		const tile = this.tile.neighAt(d);
		if (tile === undefined) { return; }
		if (tile.being && tile.being !== this) {
			if (RNG.roll(shift ? 3 : 5)) { UI.messages.push(shift ? "Your mighty swing misses." : "You miss."); }
			else if (tile.being.damage(this, shift ? 3 : 1)) {
				UI.messages.push("You slay the " + tile.being.name + (shift ? " with a mighty blow!" : "!"));
				tile.being!.remove();
				tile.updateTrn("%");
				H.randomVal(tile.neighbours().filter(t => t !== undefined))!.trnEff = ["#f00", "#200"];
			}
			else { console.log(tile.being.hp);
				UI.messages.push("You hit the " + tile.being.name);
				H.randomVal(tile.neighbours().filter(t => t !== undefined))!.trnEff = ["#f00", "#200"];
			}
			this.endTurn(shift ? 90 : 60);
		}
		else {
			const curt = this.tile;
			this.move(tile);
			if (curt !== this.tile) {
				this.memory.shift(oppositeDir(d));
				if(curt.char === "." && this.tile.char !== "X" && isStairs(this.tile.char)) {
					UI.messages.push("You " + (this.tile.char === "<" ? "climb up" : "go down") + " the stairs.");
				}
				else {
					if (shift && !this.shifted) { UI.messages.push("You shift forward"); this.shifted = true; }
					else { this.shifted = false; }
				}
			}
			this.endTurn(this.shifted ? 10 : 80);
		}
	}
	move(t: Tile): Being {
		super.move(t);
		if (this.tile.item) { this.tile.item = false; UI.messages.push("You pick up a coin."); this.coinAmt++; }
		return this;
	}
	endTurn(delay: number): void {
		this.fov();
		this.memory.forEach((v, i, ii, o) => { if (v) { v[1] -= RNG.roll(3) ? 0.1 : 0; v[1] < 0 ? o.set(undefined, [i, ii]) : null; }}); // Amnesia
		Eng.levels.forEach(l => l.amnesia());
		if(this.inputCb) { this.inputCb(delay); }
	}
	fov(): Being {
		super.fov();
		this.seenTiles.forEach((v, i, ii) => {
			if (v) { v.setSeen(); }
			if (v !== null) { this.memory.set(v !== undefined ? [v.memDraw, 1] : [H.dimDrawTile(drw("*"), 0.5), 1], [50 - this.losr + i, 50 - this.losr + ii]); }
		});
		return this;
	} 
	get uiSight() {
		const retVal = this.memory.map(v => v ? H.dimDrawTile.apply(null, v) : undefined);
		this.seenTiles.forEach((v, i, ii) => { if (v !== null) retVal.set(v ? v.draw : drw("*"), [50 - this.losr + i, 50 - this.losr + ii]); });
		return retVal;
	}
	damage(b: Being, d: number = 1): boolean {
		UI.messages.push(b.name + " hits you!");
		this.hp -= d;
		if(this.hp <= 0) {
			UI.messages.push("You die... It feels like splashing into water.");
			UI.messages.push(" - Press any key to continue - ");
			Eng.stop();
			return true;
		}
		return false;
	}
	init(t: Tile): Player { t.addBeing(this); this.endTurn(0); return this; }
}

class Morso extends Being {
	constructor (readonly name: string, c: string) { super(); this.draw = drw(c); }
	seen: boolean = false;

	canMove(t: Tile | undefined | null): boolean { return super.canMove(t) && !(t!.being instanceof Morso && this.tile.neighbours().some(tt => tt === t)); }
	act(cb: (t: number) => void): void {
		super.act(cb);
		if (this.seen) {
			const ploc: Loc | undefined = this.fov().seenTiles.findIndex(t => t !== undefined && t !== null && t.being instanceof Player);
			if (ploc) {	this.pathTo(ploc); }
			if (this.path.length > 0) {
				const ndir = this.path.pop()!;
				const newTile = this.tile.neighAt(ndir)!;
				if (newTile.being instanceof Player) { newTile.being.damage(this); this.path.push(ndir); }
				else { this.move(newTile); }
				cb(100);
				return;
			}
		}
		this.wander();
		cb(100);
	}
	damage(b: Being, d: number): boolean { this.hp -= d; return this.hp <= 0; }
}

Eng.init(); // Init everything
UI.init();