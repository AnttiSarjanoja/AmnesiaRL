/*
Rooms are basic stuff that connect everything
Subrooms does not count on neighcount, parentonly, mb secret
Bigroom must have corridors to 2-4 dirs
Corridor must have room at ends, corridor may extend
Aligned square (w === h) rooms may extend
Majors may not be forgotten completely
Secrets are initially hidden, do not count on neighcount
*/

enum JoinType { DOOR, LOCKED, OPEN, PILLARS, FLOOR, WATER }
enum RoomType { ROOM, CORRIDOR, MAJOR, SECRET, SUBROOM, BIGROOM, MISC }; // Will affect generation
type DrawTile = [string, string, string]; // char, fcolor, bcolor - For ROT.Display

interface RoomSettings {
	id: string;
	type: RoomType;
	layout: string[];
	extensions?: string[][];
	neighTypes?: [RoomType, JoinType][];
	parentOnly?: boolean;
	coalignType?: JoinType;
}
const ROOMS: Map<RoomType, Map<string, () => RoomSettings> > = new Map();
ROOMS.set(RoomType.ROOM, new Map()
	.set("Basic", (): RoomSettings => ({ id: "Basic", type: RoomType.ROOM, layout: [
		"  ####",
		"###..#",
		"#....#",
		"#...##",
		"##### "
	]}))
	.set("Pillars", (): RoomSettings => ({ id: "Pillars", type: RoomType.ROOM, coalignType: JoinType.OPEN, layout: [
		"¤¤¤¤¤",
		"#I#I#",
		"§...§",
		"#...#",
		"#####"
	]}))
);
ROOMS.set(RoomType.CORRIDOR, new Map()
	.set("Basic",	(): RoomSettings => ({ id: "Basic", type: RoomType.CORRIDOR, layout: [
		"#§#",
		"#.#",
		"#.#",
		//"#.#",
		//"#.#",
		//"#.#",
		"#.#",
		"#.#",
		"#§#"
	]}))
);
ROOMS.set(RoomType.MAJOR, new Map()
	.set("Start", (): RoomSettings => ({ id: "Start", type: RoomType.MAJOR, layout: [
		"    #¤¤¤#   ",
		" ####.~.####",
		" #....~....#",
		" #...~~~...#",
		" #.#~~≈~~#.#",
		"##.~~≈≈≈~~.#",
		"§..~≈≈≈≈≈~.=",
		"##.~~≈≈≈~~.#",
		" #.#~~≈~~#.#",
		" #...~~~.?.#",
		" #.........#",
		" #####.#####",
		"     #§#    "],
	extensions: [[
		"¤¤¤#",
		"¤µ.#",
		"¤..#",
		"¤µ.#",
		"¤¤¤#"],
	[
		"¤¤¤#",
		"¤µ.#",
		"¤..#",
		"¤¤¤#"]]
	}))
	.set("Stairs", (): RoomSettings => ({ id: "Stairs", type: RoomType.MAJOR, layout: [
		"#<#   #>#",
		"¤.¤¤¤¤¤.¤",
		"#.......#",
		"###...###",
		"  #...#  ",
		"  ##§##  "
	]}))
);
ROOMS.set(RoomType.MISC, new Map()
	.set("StairConnector", (): RoomSettings => ({ id: "StairConnector", type: RoomType.MISC, layout: [
		"¤=¤#",//==¤¤",
		"=.X>",//.XX.¤",
		"¤X¤#",//¤¤¤X¤",
		"#<# "//  #>#"
	]}))
);
ROOMS.set(RoomType.SECRET, new Map());
ROOMS.set(RoomType.SUBROOM, new Map()
	.set("Basic", (): RoomSettings => ({ id: "Basic", type: RoomType.SUBROOM, layout: [
		"####",
		"#..#",
		"#..#",
		"####"
	]}))
	.set("DEBUG", (): RoomSettings => ({ id: "DEBUG", type: RoomType.SUBROOM, layout: [
		"  #####",
		"  #...#",
		"  #..I#",
		"###.###",
		"#...#  ",
		"#####  "
	]}))
);
ROOMS.set(RoomType.BIGROOM, new Map()
	.set("Tree", (): RoomSettings => ({ id: "Tree", type: RoomType.BIGROOM, layout: [
		" ##§##       ",
		"##...######  ",
		"#..T......¤¤¤",
		"#.TTT.¤¤¤..T¤",
		"#..T..¤ ¤.TT¤",
		"#.TTT.¤¤¤..T¤",
		"#..T......¤¤¤",
		"##...######  ",
		" ##§##       "
	]}))
);

const BASICWALL = "#";
const PREFDOOR = "§";
const NONEIGH = "¤";
const UPSTAIRS = "<";
const DOWNSTAIRS = ">";
const WALLS = BASICWALL + PREFDOOR + NONEIGH;
const isWall = (s: string ) => WALLS.indexOf(s) !== -1;
const isStairs = (s: string) => (UPSTAIRS + DOWNSTAIRS + "X").indexOf(s) !== -1;
const likeWall = (s: string ) => WALLS.concat("+=x").indexOf(s) !== -1; // For wall drawing only
const terrainLos = (s: string) => WALLS.concat("+").indexOf(s) === -1;
const terrainMove = (s: string) => !isWall(s) && "T=≈S".indexOf(s) === -1;

const DRWS: Map<string, DrawTile> = new Map();
DRWS.set("", ["", "", ""]) // Key is what is found on room layout
	.set(BASICWALL, [BASICWALL, "#fff", "#000"]) // Wall
	.set(NONEIGH, [NONEIGH, "#fff", "#000"]) // Wall-noNeigh
	.set(PREFDOOR, [PREFDOOR, "#fff", "#000"]) // Wall-prefdoor
	// .set("ǁ", ["ǁ", "#fff", "#000"]) // Pillar (For manually setting pillar somewhere)

	.set("<", ["<", "#777", "#000"]) // Stairs up
	.set(">", [">", "#777", "#000"]) // Stairs down
	.set("X", ["X", "#777", "#000"]) // Stairs
	.set(".", [".", "#777", "#000"]) // Floor // "·"
	.set("~", ["~", "#007", "#002"]) // Water
	.set("≈", ["≈", "#004", "#001"]) // Deep water
	.set("+", ["+", "#ba8", "#000"]) // Door
	.set("■", ["■", "#ba8", "#000"]) // Open door
	.set("x", [".", "#ba8", "#000"]) // Doorway, aka. empty door
	.set("%", ["%", "#f00", "#400"]) // Corpse
	.set("µ", ["µ", "#aaa", "#000"]) // Furniture placeholder
	.set("S", ["@", "#666", "#000"]) // Statue
	.set("T", ["±", "#0b0", "#010"]) // Tree
	.set("$", ["¢", "#fff", "#000"]) // Money
	.set("?", [".", "#777", "#000"]) // DEBUG
	.set("*", ["░", "#123", "#000"]) // Outside // NOTE: Actually has char
	.set("=", ["=", "#6af", "#000"]) // Window
	
	// ≡ ≈ ■ ⌠ ▒ ░ ⦀
	// Triple vert ⦀

	.set("G", ["G", "#f00", "#000"]) // Goat man
	.set("W", ["W", "#74b", "#000"]) // Witch
	.set("@", ["@", "#fff", "#000"]); // Player
const drw = (c: string): DrawTile => { if (DRWS.get(c) === undefined) { throw new Error("No such drw: " + c); } return <[string, string, string]>DRWS.get(c)!.slice(); }

const MORSOS: Map<string, [string, string]> = new Map(); // TODO: Morsoconfig
MORSOS
	.set("G", ["Goat man", "G"])
	.set("W", ["Witch", "W"]);

