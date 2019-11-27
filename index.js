
const SerialPort = require('serialport')


const bitRates = [9600, 115200, 460800]
const updateFrequencies = [ 0.5, 1, 2, 4, 8 ]

const defaultOptions = {
  bitRate: 115200,
  updateFrequency: 4
}


module.exports = (dev, options = {}) => {
  console.log('constructor')
}
