interface FormatFunc {
    (...args: any[]): string;
    map: Object;
}

interface String {
    format: FormatFunc;
}


declare module ROT {
    const RNG: ROT.RNG;
    const Map: ROT.MapStatic;
    const Display: ROT.Display;
    const Scheduler: ROT.SchedulerStatic;
    const EventQueue: ROT.EventQueue;
    const StringGenerator: ROT.StringGenerator;
    const Engine: ROT.Engine;
    const Noise: ROT.Noise;
    const FOV: ROT.FOVStatic;
    const Color: ROT.Color;
    const Lighting: ROT.Lighting;
    const Path: ROT.PathStatic;

    function isSupported(): boolean;

    interface WeightedObject {
        key: Object;
        weight: number;
    }

    interface RNG {
        getUniform(): number;
        getNormal(mean : any, stddev : any): number;
        getPercentage(): number;
        getState(): Array<number>;
        setState(state: Array<number>): void;
        getSeed(): number;
        setSeed(seed: number): void;
        getWeightedValue(data: Array<WeightedObject>): Object;
    }

    interface MapStatic {
        Digger: Digger;
        Uniform: Uniform;
        Rogue: Rogue;
    }

    interface Map {
        create(callback?: DigCallback): Digger;
    }

    interface DigCallback { (x: number, y: number, cellValue: number): void; }
    interface DoorCallback { (x: number, y: number): void; }
    interface PriorityWallCallback { (x: number, y: number): void; }
    interface IsWallCallback { (x: number, y: number): boolean; }
    interface CanBeDugCallback { (x: number, y: number): boolean; }

    interface Dungeon extends Map {
        getRooms(): Array<Room>;
        getCorridors(): Array<Corridor>;
    }

    interface Room {
        getCenter(): Array<number>;
        getLeft(): number;
        getTop(): number;
        getRight(): number;
        getBottom(): number;

        addDoor(x: number, y: number): Room;
        addDoors(callback: IsWallCallback): Room;
        getDoors(callback: DoorCallback): Room;
        clearDoors(): Room;
    }

    interface Corridor {
        new (startX: number, startY: number, endX: number, endY: number): Corridor;
        create(callback: DigCallback): boolean;
        createPriorityWalls(callback: PriorityWallCallback): void;
        isValid(isWallCallback: IsWallCallback, canBeDugCallback: CanBeDugCallback): boolean;
    }

    interface DiggerOptions {
        roomWidth?: Array<number>;
        roomHeight?: Array<number>;
        corridorLength?: Array<number>;
        dugPercentage?: number;
        timeLimit?: number;
    }

    interface Digger extends Dungeon {
        new (width?: number, height?: number, options?: DiggerOptions): Digger;
    }

    interface UniformOptions {
        roomWidth?: Array<number>;
        roomHeight?: Array<number>;
        corridorLength?: Array<number>;
        dugPercentage?: number;
    }

    interface Uniform extends Dungeon {
        new (width?: number, height?: number, options?: UniformOptions): Uniform;
    }

    interface RogueOptions {
        cellWidth?: Array<number>;
        cellHeight?: Array<number>;
        roomWidth?: Array<number>;
        roomHeight?: Array<number>;
    }

    interface Rogue extends Map {
        new (width?: number, height?: number, options?: RogueOptions): Rogue;
    }

    interface DisplayOptions {
        width?: number;
        height?: number;
        fontSize?: number;
        fontFamily?: string;
        fontStyle?: string;
        fg?: string;
        bg?: string;
        spacing?: number;
        border?: number;
        layout?: string;
        tileWidth?: number;
        tileHeight?: number;
        tileMap?: Object;
        tileSet?: Object;
        tileColorize?: boolean;
        forceSquareRatio?: boolean;
    }

    interface Display {
        DEBUG: DigCallback;

        new (options?: DisplayOptions): Display;
        clear(): void;
        getContainer(): Node;
        setOptions(options: DisplayOptions): void;
        getOptions(): DisplayOptions;
        draw(x: number, y: number, character: any, fg?: string, bg?: string): void;
        drawText(x: number, y: number, text: string, width?: number): void;
    }

    interface SchedulerStatic {
        Action: Action;
        Simple: Simple;
        Speed: Speed;
    }

    interface Scheduler {
        add(item: any, repeat: boolean): Scheduler;
        remove(item: any): boolean;
        clear(): Scheduler;
        next(): any;
        getTime(): number;
    }

    interface Action extends Scheduler {
        new (): Action;
        add(item: any, repeat: boolean, time?: number): Scheduler;
        setDuration(time: number): Action;
    }

    interface Simple extends Scheduler { }

    interface SpeedActor {
        getSpeed(): number;
    }

    interface Speed extends Scheduler {
        add(item: SpeedActor, repeat: boolean, time?: number): Scheduler;
    }

    interface StringGeneratorOptions {
        words?: boolean;
        order?: number;
        prior?: number;
    }

    interface StringGenerator {
        new (options: StringGeneratorOptions): StringGenerator;

        clear(): void;
        generate(): string;
        observe(text: string): void;
        getStats(): string;
    }

    interface EventQueue {
        new (): EventQueue;
        getTime(): number;
        clear(): void;
        add(event: string, time: number): void;
        get(): string;
        remove(event: string): boolean;
    }

    interface Engine {
        new (scheduler: Scheduler): Engine;

        start(): Engine;
        lock(): Engine;
        unlock(): Engine;
    }

    interface NoiseFunction {
        new (): Noise;
        get(x: number, y: number): number;
    }

    interface SimplexNoise extends NoiseFunction { }

    interface Noise extends NoiseFunction {
        Simplex: SimplexNoise;
    }

    interface FOVOptions {
        topology: number;
    }

    interface LightPassesCallback { (x: number, y: number): boolean; }
    interface VisibilityCallback { (x: number, y: number, r: number, visibility: number): void; }

    interface FOV {
        new (lightPassesCallback: LightPassesCallback, options?: FOVOptions): FOV;
        compute(x: number, y: number, R: number, callback: VisibilityCallback): void;
    }

    interface PreciseShadowCasting extends FOV {  }
    interface RecursiveShadowcasting extends FOV {
        compute90(x: number, y: number, R: number, dir: number, callback: VisibilityCallback): void;
        compute180(x: number, y: number, R: number, dir: number, callback: VisibilityCallback): void;
    }

    interface FOVStatic {
        PreciseShadowCasting: PreciseShadowCasting;
        RecursiveShadowcasting: RecursiveShadowcasting;
    }

    interface ROTColor {
        0: number;
        1: number;
        2: number;
    }

    interface Color {
        fromString(text: string): ROTColor;
        toRGB(array: ROTColor): string;
        toHex(array: ROTColor): string;
        rgb2hsl(array: ROTColor): ROTColor;
        hsl2rgb(array: ROTColor): ROTColor;

        add(...color: Array<ROTColor>): ROTColor;
        add_(...color: Array<ROTColor>): void;

        multiply(...color: Array<ROTColor>): ROTColor;
        multiply_(...color: Array<ROTColor>): void;

        interpolate(first: ROTColor, second: ROTColor, int: number): ROTColor;
        interpolateHSL(first: ROTColor, second: ROTColor, int: number): ROTColor;

        randomize(color: ROTColor, deviation: ROTColor): ROTColor;
    }

    interface ReflectivityCallback { (x: number, y: number): number; }
    interface LightingCallback { (x: number, y: number, color: ROTColor): void; }

    interface LightingOptions {
        passes?: number;
        emissionThreshold?: number;
        range?: number;
    }

    interface Lighting {
        new (reflectivityCallback: ReflectivityCallback, lightingOptions: LightingOptions): Lighting;

        setFOV(FOV: FOV): void;
        setLight(x: number, y: number, color: ROTColor): void;
        compute(lightingCallback: LightingCallback): void;
    }

    interface MovePassableCallback { (x: number, y: number): boolean; }
    interface MoveCallback { (x: number, y: number): void; }

    interface Path {
    	new (x: number, y: number, passableCallback: MovePassableCallback): Path;
    	compute(x: number, y: number, callback: MoveCallback): void;
    }

    interface AStar extends Path { }

    interface PathStatic {
        AStar: AStar;
    }

    const DEFAULT_WIDTH: number;
    const DEFAULT_HEIGHT: number;

    const DIRS: {
        "4": Array<Array<number>>;
        "8": Array<Array<number>>;
        "6": Array<Array<number>>;
    };

    const VK_CANCEL: number;
    const VK_HELP: number;
    const VK_BACK_SPACE: number;
    const VK_TAB: number;
    const VK_CLEAR: number;
    /** Return key. */
    const VK_RETURN: number;
    /** Reserved, but not used. */
    const VK_ENTER: number;
    /** Shift key. */
    const VK_SHIFT: number;
    /** Control key. */
    const VK_CONTROL: number;
    /** Alt (Option on Mac) key. */
    const VK_ALT: number;
    /** Pause key. */
    const VK_PAUSE: number;
    /** Caps lock. */
    const VK_CAPS_LOCK: number;
    /** Escape key. */
    const VK_ESCAPE: number;
    /** Space bar. */
    const VK_SPACE: number;
    /** Page Up key. */
    const VK_PAGE_UP: number;
    /** Page Down key. */
    const VK_PAGE_DOWN: number;
    /** End key. */
    const VK_END: number;
    /** Home key. */
    const VK_HOME: number;
    /** Left arrow. */
    const VK_LEFT: number;
    /** Up arrow. */
    const VK_UP: number;
    /** Right arrow. */
    const VK_RIGHT: number;
    /** Down arrow. */
    const VK_DOWN: number;
    /** Print Screen key. */
    const VK_PRINTSCREEN: number;
    /** Ins(ert) key. */
    const VK_INSERT: number;
    /** Del(ete) key. */
    const VK_DELETE: number;
    /***/
    const VK_0: number;
    /***/
    const VK_1: number;
    /***/
    const VK_2: number;
    /***/
    const VK_3: number;
    /***/
    const VK_4: number;
    /***/
    const VK_5: number;
    /***/
    const VK_6: number;
    /***/
    const VK_7: number;
    /***/
    const VK_8: number;
    /***/
    const VK_9: number;
    /** Colon (:) key. Requires Gecko 15.0 */
    const VK_COLON: number;
    /** Semicolon (;) key. */
    const VK_SEMICOLON: number;
    /** Less-than (<) key. Requires Gecko 15.0 */
    const VK_LESS_THAN: number;
    /** Equals (=) key. */
    const VK_EQUALS: number;
    /** Greater-than (>) key. Requires Gecko 15.0 */
    const VK_GREATER_THAN: number;
    /** Question mark (?) key. Requires Gecko 15.0 */
    const VK_QUESTION_MARK: number;
    /** Atmark (@) key. Requires Gecko 15.0 */
    const VK_AT: number;
    /***/
    const VK_A: number;
    /***/
    const VK_B: number;
    /***/
    const VK_C: number;
    /***/
    const VK_D: number;
    /***/
    const VK_E: number;
    /***/
    const VK_F: number;
    /***/
    const VK_G: number;
    /***/
    const VK_H: number;
    /***/
    const VK_I: number;
    /***/
    const VK_J: number;
    /***/
    const VK_K: number;
    /***/
    const VK_L: number;
    /***/
    const VK_M: number;
    /***/
    const VK_N: number;
    /***/
    const VK_O: number;
    /***/
    const VK_P: number;
    /***/
    const VK_Q: number;
    /***/
    const VK_R: number;
    /***/
    const VK_S: number;
    /***/
    const VK_T: number;
    /***/
    const VK_U: number;
    /***/
    const VK_V: number;
    /***/
    const VK_W: number;
    /***/
    const VK_X: number;
    /***/
    const VK_Y: number;
    /***/
    const VK_Z: number;
    /***/
    const VK_CONTEXT_MENU: number;
    /** 0 on the numeric keypad. */
    const VK_NUMPAD0: number;
    /** 1 on the numeric keypad. */
    const VK_NUMPAD1: number;
    /** 2 on the numeric keypad. */
    const VK_NUMPAD2: number;
    /** 3 on the numeric keypad. */
    const VK_NUMPAD3: number;
    /** 4 on the numeric keypad. */
    const VK_NUMPAD4: number;
    /** 5 on the numeric keypad. */
    const VK_NUMPAD5: number;
    /** 6 on the numeric keypad. */
    const VK_NUMPAD6: number;
    /** 7 on the numeric keypad. */
    const VK_NUMPAD7: number;
    /** 8 on the numeric keypad. */
    const VK_NUMPAD8: number;
    /** 9 on the numeric keypad. */
    const VK_NUMPAD9: number;
    /** * on the numeric keypad. */
    const VK_MULTIPLY: number;
    /** + on the numeric keypad. */
    const VK_ADD: number;
    /***/
    const VK_SEPARATOR: number;
    /** - on the numeric keypad. */
    const VK_SUBTRACT: number;
    /** Decimal point on the numeric keypad. */
    const VK_DECIMAL: number;
    /** / on the numeric keypad. */
    const VK_DIVIDE: number;
    /** F1 key. */
    const VK_F1: number;
    /** F2 key. */
    const VK_F2: number;
    /** F3 key. */
    const VK_F3: number;
    /** F4 key. */
    const VK_F4: number;
    /** F5 key. */
    const VK_F5: number;
    /** F6 key. */
    const VK_F6: number;
    /** F7 key. */
    const VK_F7: number;
    /** F8 key. */
    const VK_F8: number;
    /** F9 key. */
    const VK_F9: number;
    /** F10 key. */
    const VK_F10: number;
    /** F11 key. */
    const VK_F11: number;
    /** F12 key. */
    const VK_F12: number;
    /** F13 key. */
    const VK_F13: number;
    /** F14 key. */
    const VK_F14: number;
    /** F15 key. */
    const VK_F15: number;
    /** F16 key. */
    const VK_F16: number;
    /** F17 key. */
    const VK_F17: number;
    /** F18 key. */
    const VK_F18: number;
    /** F19 key. */
    const VK_F19: number;
    /** F20 key. */
    const VK_F20: number;
    /** F21 key. */
    const VK_F21: number;
    /** F22 key. */
    const VK_F22: number;
    /** F23 key. */
    const VK_F23: number;
    /** F24 key. */
    const VK_F24: number;
    /** Num Lock key. */
    const VK_NUM_LOCK: number;
    /** Scroll Lock key. */
    const VK_SCROLL_LOCK: number;
    /** Circumflex (^) key. Requires Gecko 15.0 */
    const VK_CIRCUMFLEX: number;
    /** Exclamation (!) key. Requires Gecko 15.0 */
    const VK_EXCLAMATION: number;
    /** Double quote () key. Requires Gecko 15.0 */
    const VK_DOUBLE_QUOTE: number;
    /** Hash (#) key. Requires Gecko 15.0 */
    const VK_HASH: number;
    /** Dollar sign ($) key. Requires Gecko 15.0 */
    const VK_DOLLAR: number;
    /** Percent (%) key. Requires Gecko 15.0 */
    const VK_PERCENT: number;
    /** Ampersand (&) key. Requires Gecko 15.0 */
    const VK_AMPERSAND: number;
    /** Underscore (_) key. Requires Gecko 15.0 */
    const VK_UNDERSCORE: number;
    /** Open parenthesis (() key. Requires Gecko 15.0 */
    const VK_OPEN_PAREN: number;
    /** Close parenthesis ()) key. Requires Gecko 15.0 */
    const VK_CLOSE_PAREN: number;
    /* Asterisk (*) key. Requires Gecko 15.0 */
    const VK_ASTERISK: number;
    /** Plus (+) key. Requires Gecko 15.0 */
    const VK_PLUS: number;
    /** Pipe (|) key. Requires Gecko 15.0 */
    const VK_PIPE: number;
    /** Hyphen-US/docs/Minus (-) key. Requires Gecko 15.0 */
    const VK_HYPHEN_MINUS: number;
    /** Open curly bracket ({) key. Requires Gecko 15.0 */
    const VK_OPEN_CURLY_BRACKET: number;
    /** Close curly bracket (}) key. Requires Gecko 15.0 */
    const VK_CLOSE_CURLY_BRACKET: number;
    /** Tilde (~) key. Requires Gecko 15.0 */
    const VK_TILDE: number;
    /** Comma (,) key. */
    const VK_COMMA: number;
    /** Period (.) key. */
    const VK_PERIOD: number;
    /** Slash (/) key. */
    const VK_SLASH: number;
    /** Back tick (`) key. */
    const VK_BACK_QUOTE: number;
    /** Open square bracket ([) key. */
    const VK_OPEN_BRACKET: number;
    /** Back slash (\) key. */
    const VK_BACK_SLASH: number;
    /** Close square bracket (]) key. */
    const VK_CLOSE_BRACKET: number;
    /** Quote (''') key. */
    const VK_QUOTE: number;
    /** Meta key on Linux, Command key on Mac. */
    const VK_META: number;
    /** AltGr key on Linux. Requires Gecko 15.0 */
    const VK_ALTGR: number;
    /** Windows logo key on Windows. Or Super or Hyper key on Linux. Requires Gecko 15.0 */
    const VK_WIN: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_KANA: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_HANGUL: number;
    /** 英数 key on Japanese Mac keyboard. Requires Gecko 15.0 */
    const VK_EISU: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_JUNJA: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_FINAL: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_HANJA: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_KANJI: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_CONVERT: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_NONCONVERT: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_ACCEPT: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_MODECHANGE: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_SELECT: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_PRINT: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_EXECUTE: number;
    /** Linux support for this keycode was added in Gecko 4.0. */
    const VK_SLEEP: number;
}