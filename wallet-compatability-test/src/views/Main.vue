<template>
  <div id='container'>
    <el-col :span='20' :offset='2'>
      <el-card class="box-card">
        <h2>Wallet Compatability Test</h2><br/>
        <el-button class="centered" type="success" style="margin-right: 30px;" @click.native.prevent="torus">Torus</el-button>
        <el-button class="centered" type="success" style="margin-right: 30px;" @click.native.prevent="metamask">Metamask</el-button>
        <el-button class="centered" type="success" style="margin-right: 30px;" @click.native.prevent="polkadotjs">PolkadotJS</el-button>
        <el-button class="centered" type="success" style="margin-right: 30px;" @click.native.prevent="crustwallet">Crust Wallet</el-button>
        <el-button class="centered" type="success" style="margin-right: 30px;" @click.native.prevent="oneaccount">OneAccount</el-button>
      </el-card><br/><br/>
       <el-card class="box-card">
          <div class="text item action-content recipients">
            <el-input
              style="width: 40%; margin-bottom: 50px; margin-right: 20px;"
              placeholder="New Recipient"
              v-model='new_recipient'
              clearable>
            </el-input>
            <el-button icon="el-icon-plus" style="margin-right: 30px;" circle @click="addRecipient"></el-button>
            <el-table
              :data="results"
              v-loading="loading"
              highlight-current-row
              style="width: 100%">
                <el-table-column
                  property="wallet_name"
                  label="Wallet Name"
                  width='150'>
                </el-table-column>
                <el-table-column
                  property="public_key"
                  label="Public Key"
                  width='150'>
                </el-table-column>
                <el-table-column
                  property="encrypt_decrypt"
                  label="Encrypt/Decrypt"
                  width='150'>
                </el-table-column>
                <el-table-column
                  property="eth_tx"
                  label="ETH/Polygon TX"
                  width='150'>
                </el-table-column>
                <el-table-column
                  property="substrate_tx"
                  label="Substrate TX"
                  width='150'>
                </el-table-column>
                <el-table-column
                  property="sign"
                  label="Generate Signature"
                  width='150'>
                </el-table-column>
            </el-table>
          </div>
        </el-card>
    </el-col>
  </div>
</template>

<script>
import Torus from '@toruslabs/torus-embed'
import Web3 from 'web3'

import { DefaultSealer, EncryptionSchema } from '@skyekiwi/crypto'
import { File as FileHandle } from '@skyekiwi/file'
import { hexToU8a } from '@skyekiwi/util'
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp'
import { WASMContract } from '@skyekiwi/wasm-contract'
import { Crust } from '@skyekiwi/crust-network'
import { Driver } from '@skyekiwi/driver'

// import createClient from 'ipfs-http-client'
import createKeccakHash from 'keccak'

import abi from '@/mock/skyekiwi.json'
import types from '@/mock/types.ts'

// const testingSuite = {
//   async ipfsW3AGateway (chainType, publicAddress, singature) {
//     const ipfs = createClient({
//       headers: {
//         'Access-Control-Allow-Origin': '*',
//         Authorization: `Basic ${chainType}-${publicAddress}:${singature}`
//       },
//       host: 'ipfs-gw.crust.network',
//       port: 5001,
//       protocol: 'http'
//     })

//     try {
//       // the Dotapp CID
//       const content = await ipfs.cat('QmPqhofjJaL6oELPvbK9KES5bTVM9V7p6KqU6sYCHAjAQK')
//       if (content.length === 0) throw new Error()
//       return true
//     } catch (err) {
//       console.error(err)
//       return false
//     }
//   }
// }

export default {
  name: 'Main',
  async mounted () {
    await web3Enable('my cool dapp')
    const accounts = await web3Accounts()
    console.log(accounts)

    this.signers = accounts
  },
  data () {
    return {
      loading: false,
      results: []
    }
  },
  methods: {
    async torus () {
      var result = {
        wallet_name: 'Torus',
        eth_tx: '✅',
        public_key: '✅',
        substrate_tx: '❌'
      }
      // let public_key = false
      // let encrypt_decrypt = false
      // let eth_tx = false
      // let ipfsGatewayAuth = false
      // let substrate_tx = false

      const torus = new Torus()
      await torus.init()
      await torus.login()
      await torus.setProvider({
        host: 'kovan'
      })
      await torus.ethereum.enable()
      const web3 = new Web3(torus.provider)

      const address = await web3.eth.getAccounts()
      console.log(address)
      try {
        const sig = await web3.eth.personal.sign(
          '0x' + createKeccakHash('keccak256').update(address[0]).digest('hex'),
          address[0]
        )
        console.log(sig)
        result.sign = '✅'
      } catch (err) {
        console.error(err)
        result.sign = '❌'
      }

      const addr = await torus.getPublicAddress({
        verifier: 'google',
        verifierId: 'hello@skye.kiwi',
        isExtended: true
      })

      console.log(addr)
      console.log(web3)

      this.results.push(result)
    },
    uploadFile (evt) {
      console.log(evt)
    },
    async submitFile () {
      this.loading = true
      const streamToAsyncInterator = (stream) => {
        const reader = stream.getReader()
        return {
          next () {
            return reader.read()
          },
          return () {
            return reader.releaseLock()
          },
          [Symbol.asyncIterator] () {
            return this
          }
        }
      }

      const files = this.$refs['file-upload'].uploadFiles
      const oneFile = files[0]
      console.log(oneFile)

      const stream = oneFile.raw.stream()

      // 1. generate a file handle
      const fileHandle = new FileHandle({
        fileName: 'test.file',
        readStream: streamToAsyncInterator(stream)
      })

      // 2. generate a sealer
      const sealer = new DefaultSealer()
      sealer.key = hexToU8a('ae6811be7bd1f975830c22529683b04f739d3cc247a5ea5d2878023b568aa2d5')

      // 3. generate an encryptionSchema
      const encryptionSchema = new EncryptionSchema({
        author: sealer.getAuthorKey(),
        numOfShares: 2,
        threshold: 2,
        unencryptedPieceCount: 1
      })
      encryptionSchema.addMember(sealer.getAuthorKey(), 1)

      // 4. initialize the storage network and secret registry
      // here we use the first account
      const sender = this.signers[0].address
      const injector = await web3FromAddress('5DFhSMLmnw3Fgc6trbp8AuErcZoJS64gDFHUemqh2FRYdtoC')

      const storage = new Crust(sender, injector.signer)
      const registry = new WASMContract(sender, types, abi, '3gVh53DKMJMhQxNTc1fEegJFoZWvitpE7iCLPztDzSzef2Bg', injector.signer)

      // 5. now we are good to go upstream
      const result = await Driver.upstream(
        fileHandle, sealer, encryptionSchema, storage, registry
      )
      this.loading = false
      document.getElementById('result').innerHTML = JSON.stringify(result)
    },
    deleteRow (index, rows) {
      if (index === 0) {
        alert('Cannot delete youself, duh... ')
        return
      }
      rows.splice(index, 1)
    }
  }
}
</script>

<style>

.add-recipient {
  margin-bottom: 50px;
}
.lefted {
  text-align: left;
}
.centered {
  text-align: center;
}
button span {
  vertical-align: middle;
}

.action-content {
  padding: 1%;
}
#container {
  padding: 3%;
  font-family: 'Nunito', sans-serif;
}
div.el-step__title {
  font-size: 20px;
}
div.el-step__description {
  font-size: 14px;
}
.box-card {
  padding: 1%;
}
</style>
