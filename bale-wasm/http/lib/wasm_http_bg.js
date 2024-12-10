let wasm
export function __wbg_set_wasm(val) {
  wasm = val
}

const heap = new Array(128).fill(undefined)

heap.push(undefined, null, true, false)

function getObject(idx) {
  return heap[idx]
}

let heap_next = heap.length

function dropObject(idx) {
  if (idx < 132) return
  heap[idx] = heap_next
  heap_next = idx
}

function takeObject(idx) {
  const ret = getObject(idx)
  dropObject(idx)
  return ret
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true })

cachedTextDecoder.decode()

let cachedUint8Memory0 = null

function getUint8Memory0() {
  if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer)
  }
  return cachedUint8Memory0
}

function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len))
}

function addHeapObject(obj) {
  if (heap_next === heap.length) heap.push(heap.length + 1)
  const idx = heap_next
  heap_next = heap[idx]

  heap[idx] = obj
  return idx
}

let WASM_VECTOR_LEN = 0

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder

let cachedTextEncoder = new lTextEncoder('utf-8')

const encodeString =
  typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view)
      }
    : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg)
        view.set(buf)
        return {
          read: arg.length,
          written: buf.length,
        }
      }

function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg)
    const ptr = malloc(buf.length, 1) >>> 0
    getUint8Memory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf)
    WASM_VECTOR_LEN = buf.length
    return ptr
  }

  let len = arg.length
  let ptr = malloc(len, 1) >>> 0

  const mem = getUint8Memory0()

  let offset = 0

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset)
    if (code > 0x7f) break
    mem[ptr + offset] = code
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset)
    }
    ptr = realloc(ptr, len, (len = offset + arg.length * 3), 1) >>> 0
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len)
    const ret = encodeString(arg, view)

    offset += ret.written
  }

  WASM_VECTOR_LEN = offset
  return ptr
}

function isLikeNone(x) {
  return x === undefined || x === null
}

let cachedInt32Memory0 = null

function getInt32Memory0() {
  if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer)
  }
  return cachedInt32Memory0
}

let cachedFloat64Memory0 = null

function getFloat64Memory0() {
  if (cachedFloat64Memory0 === null || cachedFloat64Memory0.byteLength === 0) {
    cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer)
  }
  return cachedFloat64Memory0
}

let cachedBigInt64Memory0 = null

function getBigInt64Memory0() {
  if (cachedBigInt64Memory0 === null || cachedBigInt64Memory0.byteLength === 0) {
    cachedBigInt64Memory0 = new BigInt64Array(wasm.memory.buffer)
  }
  return cachedBigInt64Memory0
}

function debugString(val) {
  // primitive types
  const type = typeof val
  if (type == 'number' || type == 'boolean' || val == null) {
    return `${val}`
  }
  if (type == 'string') {
    return `"${val}"`
  }
  if (type == 'symbol') {
    const description = val.description
    if (description == null) {
      return 'Symbol'
    } else {
      return `Symbol(${description})`
    }
  }
  if (type == 'function') {
    const name = val.name
    if (typeof name == 'string' && name.length > 0) {
      return `Function(${name})`
    } else {
      return 'Function'
    }
  }
  // objects
  if (Array.isArray(val)) {
    const length = val.length
    let debug = '['
    if (length > 0) {
      debug += debugString(val[0])
    }
    for (let i = 1; i < length; i++) {
      debug += ', ' + debugString(val[i])
    }
    debug += ']'
    return debug
  }
  // Test for built-in
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val))
  let className
  if (builtInMatches.length > 1) {
    className = builtInMatches[1]
  } else {
    // Failed to match the standard '[object ClassName]'
    return toString.call(val)
  }
  if (className == 'Object') {
    // we're a user defined class or Object
    // JSON.stringify avoids problems with cycles, and is generally much
    // easier than looping through ownProperties of `val`.
    try {
      return 'Object(' + JSON.stringify(val) + ')'
    } catch (_) {
      return 'Object'
    }
  }
  // errors
  if (val instanceof Error) {
    return `${val.name}: ${val.message}\n${val.stack}`
  }
  // TODO we could test for more things here, like `Set`s and `Map`s.
  return className
}

function makeMutClosure(arg0, arg1, dtor, f) {
  const state = { a: arg0, b: arg1, cnt: 1, dtor }
  const real = (...args) => {
    // First up with a closure we increment the internal reference
    // count. This ensures that the Rust closure environment won't
    // be deallocated while we're invoking it.
    state.cnt++
    const a = state.a
    state.a = 0
    try {
      return f(a, state.b, ...args)
    } finally {
      if (--state.cnt === 0) {
        wasm.__wbindgen_export_2.get(state.dtor)(a, state.b)
      } else {
        state.a = a
      }
    }
  }
  real.original = state

  return real
}
function __wbg_adapter_50(arg0, arg1) {
  wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h02b4557ad5974fb5(arg0, arg1)
}

function __wbg_adapter_53(arg0, arg1, arg2) {
  wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h0db54f67645b8b5e(arg0, arg1, addHeapObject(arg2))
}

/**
 * @param {any} opts
 * @param {any} request
 * @returns {Promise<any>}
 */
export function send(opts, request) {
  const ret = wasm.send(addHeapObject(opts), addHeapObject(request))
  return takeObject(ret)
}

function handleError(f, args) {
  try {
    return f.apply(this, args)
  } catch (e) {
    wasm.__wbindgen_exn_store(addHeapObject(e))
  }
}
function __wbg_adapter_141(arg0, arg1, arg2, arg3) {
  wasm.wasm_bindgen__convert__closures__invoke2_mut__h14947fd0062bd0a9(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3))
}

export function __wbindgen_object_drop_ref(arg0) {
  takeObject(arg0)
}

export function __wbindgen_is_null(arg0) {
  const ret = getObject(arg0) === null
  return ret
}

export function __wbindgen_is_object(arg0) {
  const val = getObject(arg0)
  const ret = typeof val === 'object' && val !== null
  return ret
}

export function __wbindgen_string_new(arg0, arg1) {
  const ret = getStringFromWasm0(arg0, arg1)
  return addHeapObject(ret)
}

export function __wbindgen_object_clone_ref(arg0) {
  const ret = getObject(arg0)
  return addHeapObject(ret)
}

export function __wbindgen_string_get(arg0, arg1) {
  const obj = getObject(arg1)
  const ret = typeof obj === 'string' ? obj : undefined
  var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc)
  var len1 = WASM_VECTOR_LEN
  getInt32Memory0()[arg0 / 4 + 1] = len1
  getInt32Memory0()[arg0 / 4 + 0] = ptr1
}

export function __wbindgen_boolean_get(arg0) {
  const v = getObject(arg0)
  const ret = typeof v === 'boolean' ? (v ? 1 : 0) : 2
  return ret
}

export function __wbindgen_is_bigint(arg0) {
  const ret = typeof getObject(arg0) === 'bigint'
  return ret
}

export function __wbindgen_bigint_from_i64(arg0) {
  const ret = arg0
  return addHeapObject(ret)
}

export function __wbindgen_jsval_eq(arg0, arg1) {
  const ret = getObject(arg0) === getObject(arg1)
  return ret
}

export function __wbindgen_number_get(arg0, arg1) {
  const obj = getObject(arg1)
  const ret = typeof obj === 'number' ? obj : undefined
  getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret
  getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret)
}

export function __wbindgen_in(arg0, arg1) {
  const ret = getObject(arg0) in getObject(arg1)
  return ret
}

export function __wbindgen_bigint_from_u64(arg0) {
  const ret = BigInt.asUintN(64, arg0)
  return addHeapObject(ret)
}

export function __wbindgen_is_string(arg0) {
  const ret = typeof getObject(arg0) === 'string'
  return ret
}

export function __wbindgen_cb_drop(arg0) {
  const obj = takeObject(arg0).original
  if (obj.cnt-- == 1) {
    obj.a = 0
    return true
  }
  const ret = false
  return ret
}

export function __wbg_fetch_98a70fdc5e8c9121(arg0, arg1) {
  const ret = fetch(getObject(arg0), getObject(arg1))
  return addHeapObject(ret)
}

export function __wbg_log_15e1bfbbe1d12878(arg0, arg1) {
  console.log(getStringFromWasm0(arg0, arg1))
}

export function __wbindgen_error_new(arg0, arg1) {
  const ret = new Error(getStringFromWasm0(arg0, arg1))
  return addHeapObject(ret)
}

export function __wbindgen_number_new(arg0) {
  const ret = arg0
  return addHeapObject(ret)
}

export function __wbindgen_jsval_loose_eq(arg0, arg1) {
  const ret = getObject(arg0) == getObject(arg1)
  return ret
}

export function __wbg_String_88810dfeb4021902(arg0, arg1) {
  const ret = String(getObject(arg1))
  const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc)
  const len1 = WASM_VECTOR_LEN
  getInt32Memory0()[arg0 / 4 + 1] = len1
  getInt32Memory0()[arg0 / 4 + 0] = ptr1
}

export function __wbg_set_841ac57cff3d672b(arg0, arg1, arg2) {
  getObject(arg0)[takeObject(arg1)] = takeObject(arg2)
}

export function __wbg_instanceof_Window_cde2416cf5126a72(arg0) {
  let result
  try {
    result = getObject(arg0) instanceof Window
  } catch (_) {
    result = false
  }
  const ret = result
  return ret
}

export function __wbg_setTimeout_07866af1a1842093() {
  return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).setTimeout(getObject(arg1), arg2)
    return ret
  }, arguments)
}

export function __wbg_fetch_637e27b9489c8aca(arg0, arg1, arg2) {
  const ret = getObject(arg0).fetch(getObject(arg1), getObject(arg2))
  return addHeapObject(ret)
}

export function __wbg_setTimeout_a7009fb086494628() {
  return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).setTimeout(getObject(arg1), arg2)
    return ret
  }, arguments)
}

export function __wbg_new_19676474aa414d62() {
  return handleError(function () {
    const ret = new Headers()
    return addHeapObject(ret)
  }, arguments)
}

export function __wbg_append_feec4143bbf21904() {
  return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4))
  }, arguments)
}

export function __wbg_signal_1ed842bebd6ae322(arg0) {
  const ret = getObject(arg0).signal
  return addHeapObject(ret)
}

export function __wbg_new_e4960143e41697a4() {
  return handleError(function () {
    const ret = new AbortController()
    return addHeapObject(ret)
  }, arguments)
}

export function __wbg_abort_8355f201f30300bb(arg0) {
  getObject(arg0).abort()
}

export function __wbg_newwithu8arraysequenceandoptions_f520ece5c28a5211() {
  return handleError(function (arg0, arg1) {
    const ret = new Blob(getObject(arg0), getObject(arg1))
    return addHeapObject(ret)
  }, arguments)
}

export function __wbg_status_7841bb47be2a8f16(arg0) {
  const ret = getObject(arg0).status
  return ret
}

export function __wbg_headers_ea7ef583d1564b08(arg0) {
  const ret = getObject(arg0).headers
  return addHeapObject(ret)
}

export function __wbg_text_39a6fb98be736e16() {
  return handleError(function (arg0) {
    const ret = getObject(arg0).text()
    return addHeapObject(ret)
  }, arguments)
}

export function __wbg_newwithstrandinit_29038da14d09e330() {
  return handleError(function (arg0, arg1, arg2) {
    const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2))
    return addHeapObject(ret)
  }, arguments)
}

export function __wbg_instanceof_FormData_ce8ab3b44769effd(arg0) {
  let result
  try {
    result = getObject(arg0) instanceof FormData
  } catch (_) {
    result = false
  }
  const ret = result
  return ret
}

export function __wbg_queueMicrotask_e5949c35d772a669(arg0) {
  queueMicrotask(getObject(arg0))
}

export function __wbg_queueMicrotask_2be8b97a81fe4d00(arg0) {
  const ret = getObject(arg0).queueMicrotask
  return addHeapObject(ret)
}

export function __wbindgen_is_function(arg0) {
  const ret = typeof getObject(arg0) === 'function'
  return ret
}

export function __wbg_get_4a9aa5157afeb382(arg0, arg1) {
  const ret = getObject(arg0)[arg1 >>> 0]
  return addHeapObject(ret)
}

export function __wbg_length_cace2e0b3ddc0502(arg0) {
  const ret = getObject(arg0).length
  return ret
}

export function __wbg_new_08236689f0afb357() {
  const ret = new Array()
  return addHeapObject(ret)
}

export function __wbg_newnoargs_ccdcae30fd002262(arg0, arg1) {
  const ret = new Function(getStringFromWasm0(arg0, arg1))
  return addHeapObject(ret)
}

export function __wbg_new_1b94180eeb48f2a2() {
  const ret = new Map()
  return addHeapObject(ret)
}

export function __wbg_next_15da6a3df9290720(arg0) {
  const ret = getObject(arg0).next
  return addHeapObject(ret)
}

export function __wbg_next_1989a20442400aaa() {
  return handleError(function (arg0) {
    const ret = getObject(arg0).next()
    return addHeapObject(ret)
  }, arguments)
}

export function __wbg_done_bc26bf4ada718266(arg0) {
  const ret = getObject(arg0).done
  return ret
}

export function __wbg_value_0570714ff7d75f35(arg0) {
  const ret = getObject(arg0).value
  return addHeapObject(ret)
}

export function __wbg_iterator_7ee1a391d310f8e4() {
  const ret = Symbol.iterator
  return addHeapObject(ret)
}

export function __wbg_get_2aff440840bb6202() {
  return handleError(function (arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1))
    return addHeapObject(ret)
  }, arguments)
}

export function __wbg_call_669127b9d730c650() {
  return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1))
    return addHeapObject(ret)
  }, arguments)
}

export function __wbg_new_c728d68b8b34487e() {
  const ret = new Object()
  return addHeapObject(ret)
}

export function __wbg_self_3fad056edded10bd() {
  return handleError(function () {
    const ret = self.self
    return addHeapObject(ret)
  }, arguments)
}

export function __wbg_window_a4f46c98a61d4089() {
  return handleError(function () {
    const ret = window.window
    return addHeapObject(ret)
  }, arguments)
}

export function __wbg_globalThis_17eff828815f7d84() {
  return handleError(function () {
    const ret = globalThis.globalThis
    return addHeapObject(ret)
  }, arguments)
}

export function __wbg_global_46f939f6541643c5() {
  return handleError(function () {
    const ret = global.global
    return addHeapObject(ret)
  }, arguments)
}

export function __wbindgen_is_undefined(arg0) {
  const ret = getObject(arg0) === undefined
  return ret
}

export function __wbg_set_0ac78a2bc07da03c(arg0, arg1, arg2) {
  getObject(arg0)[arg1 >>> 0] = takeObject(arg2)
}

export function __wbg_isArray_38525be7442aa21e(arg0) {
  const ret = Array.isArray(getObject(arg0))
  return ret
}

export function __wbg_of_283796b230947688(arg0) {
  const ret = Array.of(getObject(arg0))
  return addHeapObject(ret)
}

export function __wbg_instanceof_ArrayBuffer_c7cc317e5c29cc0d(arg0) {
  let result
  try {
    result = getObject(arg0) instanceof ArrayBuffer
  } catch (_) {
    result = false
  }
  const ret = result
  return ret
}

export function __wbg_call_53fc3abd42e24ec8() {
  return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2))
    return addHeapObject(ret)
  }, arguments)
}

export function __wbg_set_3355b9f2d3092e3b(arg0, arg1, arg2) {
  const ret = getObject(arg0).set(getObject(arg1), getObject(arg2))
  return addHeapObject(ret)
}

export function __wbg_isSafeInteger_c38b0a16d0c7cef7(arg0) {
  const ret = Number.isSafeInteger(getObject(arg0))
  return ret
}

export function __wbg_instanceof_Object_3c95bd459efa5c3c(arg0) {
  let result
  try {
    result = getObject(arg0) instanceof Object
  } catch (_) {
    result = false
  }
  const ret = result
  return ret
}

export function __wbg_entries_6d727b73ee02b7ce(arg0) {
  const ret = Object.entries(getObject(arg0))
  return addHeapObject(ret)
}

export function __wbg_toString_2c5d5b612e8bdd61(arg0) {
  const ret = getObject(arg0).toString()
  return addHeapObject(ret)
}

export function __wbg_new_feb65b865d980ae2(arg0, arg1) {
  try {
    var state0 = { a: arg0, b: arg1 }
    var cb0 = (arg0, arg1) => {
      const a = state0.a
      state0.a = 0
      try {
        return __wbg_adapter_141(a, state0.b, arg0, arg1)
      } finally {
        state0.a = a
      }
    }
    const ret = new Promise(cb0)
    return addHeapObject(ret)
  } finally {
    state0.a = state0.b = 0
  }
}

export function __wbg_reject_e4f6a4fa90f72e0f(arg0) {
  const ret = Promise.reject(getObject(arg0))
  return addHeapObject(ret)
}

export function __wbg_resolve_a3252b2860f0a09e(arg0) {
  const ret = Promise.resolve(getObject(arg0))
  return addHeapObject(ret)
}

export function __wbg_then_89e1c559530b85cf(arg0, arg1) {
  const ret = getObject(arg0).then(getObject(arg1))
  return addHeapObject(ret)
}

export function __wbg_then_1bbc9edafd859b06(arg0, arg1, arg2) {
  const ret = getObject(arg0).then(getObject(arg1), getObject(arg2))
  return addHeapObject(ret)
}

export function __wbg_buffer_344d9b41efe96da7(arg0) {
  const ret = getObject(arg0).buffer
  return addHeapObject(ret)
}

export function __wbg_new_d8a000788389a31e(arg0) {
  const ret = new Uint8Array(getObject(arg0))
  return addHeapObject(ret)
}

export function __wbg_set_dcfd613a3420f908(arg0, arg1, arg2) {
  getObject(arg0).set(getObject(arg1), arg2 >>> 0)
}

export function __wbg_length_a5587d6cd79ab197(arg0) {
  const ret = getObject(arg0).length
  return ret
}

export function __wbg_instanceof_Uint8Array_19e6f142a5e7e1e1(arg0) {
  let result
  try {
    result = getObject(arg0) instanceof Uint8Array
  } catch (_) {
    result = false
  }
  const ret = result
  return ret
}

export function __wbg_has_cdf8b85f6e903c80() {
  return handleError(function (arg0, arg1) {
    const ret = Reflect.has(getObject(arg0), getObject(arg1))
    return ret
  }, arguments)
}

export function __wbg_set_40f7786a25a9cc7e() {
  return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2))
    return ret
  }, arguments)
}

export function __wbg_stringify_4039297315a25b00() {
  return handleError(function (arg0) {
    const ret = JSON.stringify(getObject(arg0))
    return addHeapObject(ret)
  }, arguments)
}

export function __wbindgen_bigint_get_as_i64(arg0, arg1) {
  const v = getObject(arg1)
  const ret = typeof v === 'bigint' ? v : undefined
  getBigInt64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? BigInt(0) : ret
  getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret)
}

export function __wbindgen_debug_string(arg0, arg1) {
  const ret = debugString(getObject(arg1))
  const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc)
  const len1 = WASM_VECTOR_LEN
  getInt32Memory0()[arg0 / 4 + 1] = len1
  getInt32Memory0()[arg0 / 4 + 0] = ptr1
}

export function __wbindgen_throw(arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1))
}

export function __wbindgen_memory() {
  const ret = wasm.memory
  return addHeapObject(ret)
}

export function __wbindgen_closure_wrapper195(arg0, arg1, arg2) {
  const ret = makeMutClosure(arg0, arg1, 36, __wbg_adapter_50)
  return addHeapObject(ret)
}

export function __wbindgen_closure_wrapper644(arg0, arg1, arg2) {
  const ret = makeMutClosure(arg0, arg1, 151, __wbg_adapter_53)
  return addHeapObject(ret)
}
