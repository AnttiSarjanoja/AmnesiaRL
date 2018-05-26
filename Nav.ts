// Nav utilities
// Z = Same direction, as in zero, U = Up, D = Down
enum Dir { N, NE, E, SE, S, SW, W, NW, Z, U, D}; // NOTE: If touchy fishy, fix input keymapping too // TODO: Remove input keymappings
const dirMap: [number, number][] = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, 0]]
const diffToDir = (l: [number, number]) => { const retVal = dirMap.findIndex(v => v[0] === l[0] && v[1] === l[1]); return retVal !== -1 ? retVal : Dir.Z; }
const rotateDir = (d: Dir, i: number): Dir => (d + (i >= 0 ? i : i + 8)) % 8
const oppositeDir = (d: Dir): Dir => ((d + 4) % 8)
const dirSum = (d1: Dir, d2: Dir): Dir => { const sum = <[number, number]>dirMap[d1].map((v, i) => v + dirMap[d2][i]); return diffToDir(sum); } //dirMap.findIndex(v => v[0] === sum[0] && v[1] === sum[1]); }

type Con = [Dir, Loc, number]; // Connection: a location [x,y] where a horizontal or vertical w-wide join edge can be found to given direction
class Loc { // Just to have smart coordinates, NOTE: NONE of the methods modify the original Loc
	static argHelp = (l: Loc | [number, number] | number): Loc => l instanceof Loc ? l : Array.isArray(l) ? new Loc(l[0], l[1]) : new Loc(l, l)
	constructor(public x: number, public y: number) {}
	add(l: Loc | [number, number] | number): Loc { const ll = Loc.argHelp(l); return new Loc(this.x + ll.x, this.y + ll.y); }
	subtr(l: Loc | [number, number] | number): Loc { const ll = Loc.argHelp(l); return new Loc(this.x - ll.x, this.y - ll.y); }
	eq(l: Loc | [number, number]): boolean { const ll = Loc.argHelp(l); return this.x === ll.x && this.y === ll.y; }
	toDir(d: Dir): Loc { return this.add(dirMap[d]); }
	toString() { return this.x + "," + this.y; }
	toArr(): [number, number] { return [this.x, this.y]; }
}
class Are {
	constructor(l: Loc | [number, number], public w: number, public h: number) { this.loc = Loc.argHelp(l); }
	public loc: Loc;
	get x(): number { return this.loc.x; }
	get y(): number { return this.loc.y; }
	hasLoc(l: Loc | [number, number]): boolean { const ll = Loc.argHelp(l); return (ll.x >= this.x && ll.x < this.x + this.w && ll.y >= this.y && ll.y < this.y + this.h); }
}
interface MtxValue<T> { n: number; v: T; };
class Mtx<T> {
	constructor(a?: (T | undefined)[][]) { if(a) { this.init(a); this.rfsh = true; } };
	private values: (MtxValue<T> | undefined)[][] = [];
	private rfsh: boolean = false;
	private u(): Mtx<T> { if(this.rfsh) { this.rfsh = false; this.values.forEach((a, i) => a.forEach((v, ii) => { if(v) v.n = this.valueNeighs(new Loc(i, ii)).length; } )); } return this; }
	clone() { return new Mtx<T>(this.u().values.map(a => [...a.map(v => v ? v.v : v)])); }
	clear() { this.values = []; }
	init(a: (T | undefined)[][]) { this.values = a.map(aa => aa.map(v => v !== undefined && v !== null ? ({ n: -1, v: v }) : v )); this.rfsh = true; }
	fill(w: number, h: number, v: any): Mtx<T> { this.clear(); for (let x = 0; x < w; x++) { this.values[x] = new Array(h).fill(v) }; this.rfsh = true; return this; }
	// TODO: public d: Dir = Dir.N; // For fetching the original direction s
	debug(cb: (v: T) => string) { console.log(this.map(v => v !== undefined && v !== null ? cb(v) : " ").mirror().values.map(a => a.map(v => v ? v.v : v).join("")).join('\n')); } // Draws the values to console, mirror since x -> y
	
	get w(): number { return this.values.length; }
	get h(): number { return this.values[0] ? this.values[0].length : 0; }
	at(l: Loc | [number, number]): T | undefined { const ll = Loc.argHelp(l); return this.values[ll.x] ? (this.values[ll.x][ll.y] ? this.values[ll.x][ll.y]!.v : <undefined>this.values[ll.x][ll.y]) : undefined; }
	findLoc(v: T): Loc | undefined { const mpd = this.values.map((a, i) => new Loc(i, a.map(vv => vv ? vv.v : vv).indexOf(v))); return mpd.find(v => v.y !== -1); }//this.u().values.map((a, i) => a.map(vv => vv.v).indexOf(v) !== -1 ? new Loc(i, a.map(vv => vv.v).indexOf(v)) : undefined).find(l => l !== undefined); }
	set(v: T | undefined, l: Loc | [number, number]): T | undefined { const ll = Loc.argHelp(l); if (this.values[ll.x]) { this.values[ll.x][ll.y] = (v !== undefined && v !== null ? { n: -1, v: v } : v); this.rfsh = true; } return v; }

	forEach(cb: (v: T | undefined, i: number, ii: number, o: Mtx<T>) => void) { this.values.forEach((cols, x) => cols.forEach((v, y) => cb(v ? v.v : v, x, y, this))); }
	filter(cb: (v: T | undefined, i: number, ii: number, o: Mtx<T>) => boolean) { return new Mtx<T>(this.values.map((cols, x) => cols.map((v, y) => v && cb(v.v, x, y, this) ? v.v : undefined))); }
	map<U>(cb: (v: T | undefined, i: number, ii: number, o: Mtx<T>) => U | undefined) { return new Mtx<U>(this.values.map((cols, x) => cols.map((v, y) => cb(v ? v.v : v, x, y, this)))); }
	some(cb: (v: T | undefined, i: number, ii: number, o: Mtx<T>) => boolean): boolean { return this.values.some((a, i) => a.some((v, ii) => cb(v ? v.v : v, i, ii, this))); }

	// These two were written badly
	find(cb: (v: T | undefined, i: number, ii: number, o: Mtx<T>) => boolean): T | undefined { const findings = this.values.map((a, i) => a.find((v, ii) => cb(v ? v.v : v, i, ii, this))).map(v => v ? v.v : v); return findings.find(v => v !== undefined); }
	findIndex(cb: (v: T | undefined, i: number, ii: number, o: Mtx<T>) => boolean): Loc | undefined { let retval: Loc | undefined; this.values.forEach((a, i) => a.forEach((v, ii) => { if(cb(v ? v.v : v, i, ii, this)) retval = new Loc(i, ii); })); return retval; }

	flat(): T[] { return <T[]>(<(T | undefined)[]>[]).concat(...this.values.map(a => a.map(v => v ? v.v : v))).filter(v => v); } //  !== undefined && v !== null
	toOneDim(): (T | undefined)[] { if(this.values.length !== 1 && this.values[0].length !== 1) { throw new Error("Not one dimensioned!"); } return (<(T | undefined)[]>[]).concat(...this.values.map(a => a.map(v => v ? v.v : v))); }
	subArea(a: Are): Mtx<T> { return new Mtx<T>(this.values.filter((aa, i) => i >= a.x && i < a.x + a.w).map(aa => aa.filter((v, ii) => ii >= a.y && ii < a.y + a.h).map(v => v ? v.v : v))); }
	conVals(c: Con): T[] { return this.subArea(new Are(c[1], c[0] === Dir.N || c[0] === Dir.S ? c[2] : 1, c[0] === Dir.W || c[0] === Dir.E ? c[2] : 1)).flat(); }
	private valueNeighs(l: Loc): T[] { return this.subArea(new Are(l.add(-1), 3, 3)).flat(); } // NOTE: Inclusive!
	edges(): Mtx<T> { return new Mtx<T>(this.u().values.map(a => a.map(v => v && v.n !== 9 ? v.v : undefined))); }  //  this.valueNeighs(new Loc(i, ii)).length !== 9 ? v : undefined))); }
	nonEdges(): Mtx<T> { return new Mtx<T>(this.u().values.map(a => a.map(v => v && v.n === 9 ? v.v : undefined))); }//this.valueNeighs(new Loc(i, ii)).length === 9 ? v : undefined))); }
	inCommon(m: Mtx<T>): Mtx<T> { const f = m.flat(); return new Mtx<T>(this.values.map(a => a.map(v => v !== undefined && f.indexOf(v.v) !== -1 ? v.v : undefined))); }
	dirEdge(d: Dir): Mtx<T> { return this.filter((v, i, ii) => v !== undefined && this.at(new Loc(i, ii).toDir(d)) === undefined && this.at(new Loc(i, ii).toDir(oppositeDir(d))) !== undefined); } //  new Mtx<T>(

	findEdges(cb: (t: (T | undefined)[]) => boolean, w: number = 3): Con[] {
		let retval: Con[] = [];
		this.edges().forEach((v, i, ii, o) => {  // TODO: Modify this to return >= w edges
			if (i <= (o.w - w) && cb(o.subArea(new Are([i, ii], w, 1)).toOneDim())) { retval.push([this.at([i + 1, ii - 1]) ? Dir.S : Dir.N, new Loc(i, ii), w]); }
			if (ii <= (o.h - w) && cb(o.subArea(new Are([i, ii], 1, w)).toOneDim())) { retval.push([this.at([i - 1, ii + 1]) ? Dir.E : Dir.W, new Loc(i, ii), w]); }
		});
		return retval;
	}
	checkMerge(m: Mtx<T>, loc: Loc, cb: (T) => boolean): number { // Checks if merge can be done, returns the amount of values in common, cb is called for all found existing values
		const ned = this.nonEdges(); // For performance
		const found: boolean = m.some((v: T | undefined, i, ii) => { if(v) { const l = new Loc(i, ii).add(loc); return (ned.at(l) !== undefined || (this.at(l) !== undefined && cb(this.at(l)))); } return false; });
		return !found // !(mapped.flat().some(l => (ned.at(l) !== undefined || (this.fastAt(l) !== undefined && cb(this.fastAt(l)))))) // .nonEdges()
			? 1 : 0; //  mapped.flat().reduce((p, c) => p + (this.fastAt(c) !== undefined ? 1 : 0), 0) : 0;
	}
	// NOTE: These modify the original Mtx!	
	merge(m: Mtx<T>, l: Loc, cb: (T1: T, T2: T) => void): Mtx<T> { // cb is called when values are merging
		while (l.x < 0) { this.addRow(true); l.x++; } while (l.y < 0) { this.addCol(true); l.y++; } // Add rows to before values
		while (this.w < l.x + m.w) { this.addRow(); } while (this.h < l.y + m.h) { this.addCol(); } // Push rows after
		this.subArea(new Are(l, m.w, m.h)).forEach((t, i, ii) => { if (m.at([i, ii])) {
			if (t) { cb(t, m.at([i, ii])!); m.set(t, [i, ii]); }
			else { this.set(m.at([i, ii])!, [i + l.x, ii + l.y]); }
		}});
		this.rfsh = true;
		return this;
	}
	shift(d: Dir, keep?: boolean): Mtx<T> { dirMap[d].forEach((n, i) => {
		if(i === 0) {
			if (n > 0) { if(keep) this.values.unshift(this.values.pop()!); else { this.values.pop(); this.addRow(true); } }
			else if (n < 0) { if(keep) this.values.push(this.values.shift()!); else { this.values.shift(); this.addRow(); } } ;
		} else {
			if (n > 0) { if(keep) this.values.forEach(a => a.unshift(a.pop()!)); else { this.values.forEach(a => a.pop()); this.addCol(true); } }
			else if (n < 0) { if(keep) this.values.forEach(a => a.push(a.shift()!)); else { this.values.forEach(a => a.shift()); this.addCol(); } }
		}
	}); this.rfsh = true; return this;}
	rotate(cw?: boolean): Mtx<T> { this.values = this.values[0].map((c, i) => cw ? this.values.map(row => row[row.length - 1 - i]) : this.values.map(row => row[i]).reverse()); return this; }
	flip(): Mtx<T> { return this.rotate().rotate(); }
	mirror(): Mtx<T> { this.values = this.values[0].map((c, i) => this.values.map(row => row[i])); return this; }
	turn(i: number): Mtx<T> { return ([() => this, () => this.rotate(), () => this.flip(), () => this.rotate(true)].map(f => (i > 3) ? () => (f().mirror()) : f)[i % 4])(); }
	addRow(b: boolean = false): void { const newRow = Array.apply(null, Array(this.values[0] ? this.values[0].length : 0)); b ? this.values.unshift(newRow) : this.values.push(newRow); }
	addCol(b: boolean = false): void { this.values.forEach(a => b ? a.unshift(undefined) : a.push(undefined)); }
}