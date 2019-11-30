
const camera = require('../index.js')('/dev/serial0', {
  updateFrequency: 1,
  onEmissivity: em => {
    console.log('Emissivity:', em)
  },
  onTemperatures: (temperatures, ambient) => {
    console.log('Temperatures: ', temperatures)
    console.log('Ambient:      ', ambient)
  }
})

// console.log(camera)

camera.changeUpdateFrequency(0.5, true)
camera.emissivity()
camera.emissivity(0.95)
camera.emissivity()
camera.query()
