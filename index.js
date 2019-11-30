
const { Buffer } = require("buffer")
const SerialPort = require('serialport')

const bitRates = {
  9600: Buffer.from([0xa5, 0x15, 0x01, 0xbb]),
  115200: Buffer.from([0xa5, 0x15, 0x02, 0xbc]),
  460800: Buffer.from([0xa5, 0x15, 0x03, 0xbd])
}

const updateFrequencies = {
  0.5: Buffer.from([0xa5, 0x25, 0x00, 0xca]),
  1: Buffer.from([0xa5, 0x25, 0x01, 0xcb]),
  2: Buffer.from([0xa5, 0x25, 0x02, 0xcc]),
  4: Buffer.from([0xa5, 0x25, 0x03, 0xcd]),
  8: Buffer.from([0xa5, 0x25, 0x04, 0xce])
}

const commands = {
  query: Buffer.from([0xa5, 0x35, 0x01, 0xdb]),
  automatic: Buffer.from([0xa5, 0x35, 0x02, 0xdc]),
  emissivity: Buffer.from([0xa5, 0x55, 0x01, 0xfb]),
  save: Buffer.from([0xa5, 0x65, 0x01, 0x0b]),
}

const frameSize = 1544
const temperaturesCount = 32 * 24
const temperaturesOffset = 4
const ambientOffset = 1540
const checksumOffset = 1542

const defaults = {
  bitRate: 115200,
  updateFrequency: 4
}

module.exports = (dev, options = {}) => {
  this.dev = dev
  this.buf = Buffer.alloc(2048) // Probably enough...?
  this.buflen = 0 // Start off with empty buffer
  this.port = null
  this.bitRate = options.bitRate || defaults.bitRate
  this.onTemperatures = options.onTemperatures && options.onTemperatures instanceof Function ? options.onTemperatures : null
  this.onEmissivity = options.onEmissivity && options.onEmissivity instanceof Function ? options.onEmissivity : null

  this.save = () => {
    this.port.write(commands.save)
  }

  this.emissivity = (em) => {
    if (em === undefined) {
      this.port.write(commands.emissivity)
    } else {
      // Clamp the number between 0 and 1, and scale by 100
      em = em < 0 ? 0 : em
      em = em > 1 ? 1 : em
      em *= 0x64
      em &= 0xff
      const cmd = Buffer.from([0xa5, 0x45, em, (0xa5 + 0x45 + em) & 0xff])
      this.port.write(cmd)
    }
  }

  this.query = () => {
    this.port.write(commands.query)
  }

  this.automatic = () => {
    this.port.write(commands.automatic)
  }

  this.changeUpdateFrequency = (updateFrequency, write = false) => {
    if (updateFrequencies[updateFrequency]) {
      this.updateFrequency = updateFrequency
      if (write) {
        this.port.write(updateFrequencies[updateFrequency])
      }
    } else {
      throw TypeError(`Update frequency error. Use one of: ${Object.keys(updateFrequencies).join(', ')}`)
    }
  }

  this.changeUpdateFrequency(options.updateFrequency || defaults.updateFrequency)

  // Perform some rudimentary checks
  if (!bitRates[this.bitRate])
    throw TypeError(`Bitrate error. Use one of: ${Object.keys(bitRates).join(', ')}`)

  // TODO: add change baud rate command

  this.port = new SerialPort(this.dev, {
    baudRate: this.bitRate,
    autoOpen: true
  })

  // open errors will be emitted as an error event
  this.port.on('error', err => {
    console.error('Error: ', err.message);
  })

  this.port.on('open', () => {
    this.port.write(bitRates[this.bitRate])
    this.port.write(updateFrequencies[this.updateFrequency])
  });

  this.port.on('data', data => {

    // Append data to buffer
    this.buflen += data.copy(this.buf, this.buflen)

    // Examine the data buffer and handle all located frames.
    let i = 0
    while (this.buflen && i <= this.buflen - 4) {

      // Look for frame header
      if (this.buf.readUInt16LE(i) === 0x5a5a) {

        // Is this a temperature frame?
        if (this.buf.readUInt16LE(i + 2) === 0x0602) {

          // Do we have enough data to verify frame?
          if (this.buflen - i >= frameSize) {

            // Yes we do. Compute the checksum.
            let sum = 0
            for (let j = 0; j < (frameSize / 2) - 1; j++) {
              const offset = i + (j * 2)
              sum += this.buf.readUInt16LE(offset)
            }
            sum &= 0xffff
            const frameSum = this.buf.readUInt16LE(i + checksumOffset)

            // Check if the sums match
            if (sum === frameSum) {

              // Handle temperature frame
              if (this.onTemperatures) {
                const temperatures = []
                for (let j = 0; j < temperaturesCount; j++) {
                  const offset = i + temperaturesOffset + (j * 2)
                  temperatures[j] = this.buf.readInt16LE(offset) / 100
                }
                const ambient = this.buf.readInt16LE(i + ambientOffset) / 100

                this.onTemperatures(temperatures, ambient)
              }

              // Advance past the temperatures frame
              i += frameSize
            } else {
              // No checksum match; advance one byte
              i++
            }
          } else {
            // Not enough data; terminate loop
            break
          }
        } else {
          // Maybe it's a emissivity frame?
          const em = this.buf.readUInt8(i + 2)
          const sum = (0x5a + 0x5a + em) & 0xff
          const frameSum = this.buf.readUInt8(i + 3)

          // Well, is it?
          if (sum === frameSum) {
            // Handle emissivity frame
            if (this.onEmissivity) {
              this.onEmissivity(em / 100)
            }

            // Advance past the emissivity frame
            i += 4
          } else {
            // No checksum match; advance one byte
            i++
          }

        }
      } else {
        // No frame header; advance one byte
        i++
      }

      // Throw away any processed bytes.
      if (i) {
        const remainder = this.buflen - i
        if (remainder) {
          this.buflen = this.buf.copy(this.buf, 0, i, i + remainder)
        }
        this.buflen = remainder
        i = 0
      }
    }
  })

  return this
}
