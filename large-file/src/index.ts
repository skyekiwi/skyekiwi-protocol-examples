// Copyright 2021 @skyekiwi authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from 'tweetnacl'
import { mnemonicToMiniSecret } from '@polkadot/util-crypto'
import fs from 'fs'

import { File } from '@skyekiwi/file'
import { Driver } from '@skyekiwi/driver'
import { EncryptionSchema, DefaultSealer } from '@skyekiwi/crypto'
import { Crust } from '@skyekiwi/crust-network'
import { WASMContract } from '@skyekiwi/wasm-contract'

const abi = require('./wasm-contract/skyekiwi.json')
import types from './wasm-contract/types'

require('dotenv').config()

const main = async () => {

  // 1. generate a large file
  const filePath = './src/file.file'
  const size = 2_000_000_000 // 2GB

  const content = randomBytes(size)
  File.writeFile(content, filePath, 'w')

  console.log('file generation done!')

  // 2. register a file handle
  const fileHandle = new File({
    fileName: 'file.file',
    readStream: fs.createReadStream(filePath, {
      highWaterMark: 10_000_000 // 10MB chunk size = 200 chunks
    })
  })

  console.log('file handle registered!')

  // 3. generate a new Sealer
  const mnemonic = process.env.SEED_PHRASE
  const privateKey = mnemonicToMiniSecret(mnemonic)
  const sealer = new DefaultSealer()
  sealer.key = privateKey

  console.log('sealer generated with an authorKey', sealer.getAuthorKey())

  // 4. generate an encryptionSchema
  // only yourself can read this file 
  const encryptionSchema = new EncryptionSchema({
    author: sealer.getAuthorKey(),
    numOfShares: 2,
    threshold: 2,
    unencryptedPieceCount: 1
  });

  encryptionSchema.addMember(sealer.getAuthorKey(), 1);

  console.log('encryptionSchema generated!')

  // 5. initiate the blockchain connections
  const storage = new Crust(mnemonic);
  const registry = new WASMContract(mnemonic, types, abi, '3gVh53DKMJMhQxNTc1fEegJFoZWvitpE7iCLPztDzSzef2Bg');

  console.log('blockchain connector initiated!')
  
  // 6. Let it Upstream!
  const result = await Driver.upstream(
    fileHandle, sealer, encryptionSchema, storage, registry
  );

  console.log(result)
}

main().catch(err => {
  console.error(err)
})
