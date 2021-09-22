<template>
  <div id='container'>
    <el-col :span='20' :offset='2'>
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span style='padding-top:20px;'>Upload the file</span>
        </div>
        <div class="text item action-content centered">
          <el-upload
            class="upload-demo"
            ref="file-upload"
            action="https://jsonplaceholder.typicode.com/posts/"
            drag
            @change="uploadFile"
            :auto-upload='false' >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">Drop file here or <em>click to upload</em></div>
            <div class="el-upload__tip" slot="tip">jpg/png files with a size less than 500kb</div>
          </el-upload>
        </div>
      </el-card><br/><br/>
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span style='padding-top:20px;'>Add Recipients</span>
        </div>
        <div class="text item action-content recipients">
          <el-input
            style="width: 40%; margin-bottom: 50px; margin-right: 20px;"
            placeholder="New Recipient"
            v-model='new_recipient'
            clearable>
          </el-input>
          <el-button icon="el-icon-plus" style="margin-right: 30px;" circle @click="addRecipient"></el-button>
          <el-table
            :data="recipients"
            v-loading="loading"
            highlight-current-row
            style="width: 100%">

              <el-table-column
                type="index"
                width="50">
              </el-table-column>
              <el-table-column
                property="public_address"
                label="Public Address">
              </el-table-column>
              <el-table-column
                property="public_key"
                label="Do we have their public key?"
                width='250'>
              </el-table-column>
              <el-table-column
                property="role"
                label="Role in this Agreement"
                width='200'>
              </el-table-column>
              <el-table-column
                fixed="right"
                label="Delete"
                width="120">
                <template slot-scope="scope">
                  <el-button
                    @click.native.prevent="deleteRow(scope.$index, recipients)"
                    type="primary"
                    size="small">
                    Remove
                  </el-button>
                </template>
              </el-table-column>
          </el-table>
        </div>
      </el-card>
      <br/>
      <el-button class="centered" type="success" style="margin-right: 30px;" @click.native.prevent="submitFile">Process</el-button>
      <span id='result'></span>
    </el-col>
  </div>
</template>

<script>

import { DefaultSealer, EncryptionSchema } from '@skyekiwi/crypto'
import { File as FileHandle } from '@skyekiwi/file'
import { hexToU8a } from '@skyekiwi/util'
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp'
import { WASMContract } from '@skyekiwi/wasm-contract'
import { Crust } from '@skyekiwi/crust-network'
import { Driver } from '@skyekiwi/driver'

import abi from '@/mock/skyekiwi.json'
import types from '@/mock/types.ts'

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
      recipients: [{
        public_address: '5DFhSMLmnw3Fgc6trbp8AuErcZoJS64gDFHUemqh2FRYdtoC (Yourself)',
        public_key: 'Yes',
        role: 'Creator'
      }],
      new_recipient: '',
      loading: false,
      fileList: [],
      signers: []
    }
  },
  computed: {

  },
  methods: {
    async addRecipient () {
      this.loading = true
      setTimeout(() => {
        const recipient = {
          public_address: this.new_recipient,
          public_key: 'Yes',
          role: 'Recipient'
        }
        this.recipients.push(recipient)
        this.loading = false
      }, 3000)
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
</style>
