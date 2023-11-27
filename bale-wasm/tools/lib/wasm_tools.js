import * as wasm from "./wasm_tools_bg.wasm";
import { __wbg_set_wasm } from "./wasm_tools_bg.js";
__wbg_set_wasm(wasm);
export * from "./wasm_tools_bg.js";
