import { bytesToHex, setLengthRight } from '@ethereumjs/util'

import { EvmErrorResult, OOGResult } from '../evm.ts'

import { getPrecompileName } from './index.ts'
import { gasLimitCheck } from './util.ts'

import type { EVM } from '../evm.ts'
import type { ExecResult } from '../types.ts'
import type { PrecompileInput } from './types.ts'

export function precompile07(opts: PrecompileInput): ExecResult {
  const pName = getPrecompileName('07')
  const gasUsed = opts.common.param('bn254MulGas')
  if (!gasLimitCheck(opts, gasUsed, pName)) {
    return OOGResult(opts.gasLimit)
  }

  // > 128 bytes: chop off extra bytes
  // < 128 bytes: right-pad with 0-s
  const input = setLengthRight(opts.data.subarray(0, 128), 128)

  let returnData
  try {
    returnData = (opts._EVM as EVM)['_bn254'].mul(input)
  } catch (e: any) {
    if (opts._debug !== undefined) {
      opts._debug(`${pName} failed: ${e.message}`)
    }
    return EvmErrorResult(e, opts.gasLimit)
  }

  // check ecmul success or failure by comparing the output length
  if (returnData.length !== 64) {
    if (opts._debug !== undefined) {
      opts._debug(`${pName} failed: OOG`)
    }
    // TODO: should this really return OOG?
    return OOGResult(opts.gasLimit)
  }

  if (opts._debug !== undefined) {
    opts._debug(`${pName} return value=${bytesToHex(returnData)}`)
  }

  return {
    executionGasUsed: gasUsed,
    returnValue: returnData,
  }
}
